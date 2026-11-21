#!/usr/bin/env python3
"""4ndr0neering v8.2 performance gate: replayable paired workload measurement.

No unmeasured source-shape preference can produce a performance PASS.  This is
an original workload measurement tool, NOT an ISO/IEC 5055 conformity checker.
"""
from __future__ import annotations
import argparse, ast, hashlib, json, math, os, platform, random, statistics, subprocess, sys, time, tempfile
from pathlib import Path

VERSION = '8.2.0'

def digest(raw: bytes) -> str: return hashlib.sha256(raw).hexdigest()
def digest_file(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as handle:
        while chunk:=handle.read(1<<20): h.update(chunk)
    return h.hexdigest()
def canon(obj: object) -> bytes: return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
def write_json(path: Path, obj: dict) -> None:
    import tempfile
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,name=tempfile.mkstemp(prefix='.'+path.name+'.',suffix='.tmp',dir=str(path.parent))
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as out:
            json.dump(obj,out,indent=2,sort_keys=True,ensure_ascii=False);out.write('\n');out.flush();os.fsync(out.fileno())
        os.replace(name,path)
    finally:
        if os.path.exists(name): os.unlink(name)
def contained(root: Path, name: str) -> Path:
    p=(root/name).resolve()
    if not p.is_relative_to(root.resolve()): raise ValueError('path escapes root: '+name)
    return p

def verify_inputs(root: Path, data: dict) -> dict:
    if data.get('version')!='1.0': raise ValueError('contract version must be 1.0')
    if not isinstance(data.get('workload_id'),str) or not data['workload_id'].strip(): raise ValueError('workload_id required')
    for key in ('baseline_command','candidate_command'):
        cmd=data.get(key)
        if not isinstance(cmd,list) or not cmd or not all(isinstance(x,str) and x for x in cmd):
            raise ValueError(key+' must be nonempty argv list')
    n=data.get('samples',9); warm=data.get('warmups',2)
    if type(n)!=int or n<7 or n>1000: raise ValueError('samples must be integer in [7,1000]')
    if type(warm)!=int or warm<2 or warm>100: raise ValueError('warmups must be integer in [2,100]')
    timeout=data.get('timeout_seconds',30)
    if not isinstance(timeout,(int,float)) or isinstance(timeout,bool) or not math.isfinite(timeout) or not 0<timeout<=3600: raise ValueError('invalid timeout')
    limit=data.get('max_regression_pct',5)
    if not isinstance(limit,(int,float)) or isinstance(limit,bool) or not math.isfinite(limit) or not 0<=limit<=1000: raise ValueError('invalid regression tolerance')
    cwd=contained(root,data.get('cwd','.'))
    if not cwd.is_dir(): raise ValueError('cwd does not exist')
    fingerprints={}
    for branch in ('baseline','candidate'):
        items=data.get('fingerprints',{}).get(branch,[])
        if not isinstance(items,list) or not items: raise ValueError('fingerprints.'+branch+' required')
        fingerprints[branch]=[]
        for item in items:
            if not isinstance(item,dict): raise ValueError('fingerprint entry must be object')
            p=contained(root,item['path'])
            if not p.is_file(): raise ValueError('fingerprint missing: '+str(p))
            actual=digest_file(p)
            if item.get('sha256')!=actual: raise ValueError('fingerprint mismatch: '+item['path'])
            fingerprints[branch].append({'path':item['path'],'sha256':actual})
    if 'dataset_path' in data or 'dataset_sha256' in data:
        if not isinstance(data.get('dataset_path'),str) or not isinstance(data.get('dataset_sha256'),str):
            raise ValueError('dataset_path and dataset_sha256 must be paired')
        p=contained(root,data['dataset_path'])
        if not p.is_file() or digest_file(p)!=data['dataset_sha256']:
            raise ValueError('dataset path or content mismatch')
    return {'cwd':cwd,'fingerprints':fingerprints,'samples':n,'warmups':warm,'timeout':float(timeout),'limit':float(limit)}

def _file_digest(file_obj):
    file_obj.seek(0)
    h=hashlib.sha256();count=0
    while chunk:=file_obj.read(1<<20):
        h.update(chunk);count+=len(chunk)
    return h.hexdigest(),count

def timed(argv: list[str],cwd: Path,timeout: float) -> dict:
    start=time.perf_counter_ns()
    try:
        # Stream large outputs to temporary files instead of buffering in RAM.
        with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
            cp=subprocess.run(argv,cwd=str(cwd),stdin=subprocess.DEVNULL,stdout=stdout,stderr=stderr,timeout=timeout,check=False)
            if cp.returncode!=0:
                stderr.seek(0)
                raise RuntimeError(f'exit={cp.returncode}; stderr={stderr.read(250).decode(errors="replace")}')
            out_hash,out_size=_file_digest(stdout)
            err_hash,_=_file_digest(stderr)
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError('timeout after '+str(timeout)+'s') from exc
    except OSError as exc:
        raise RuntimeError('command unavailable: '+str(exc)) from exc
    elapsed=max(1,(time.perf_counter_ns()-start))/1e6
    return {'ms':elapsed,'stdout_sha256':out_hash,'stdout_bytes':out_size,'stderr_sha256':err_hash}

def boot_ci(b: list[float],c: list[float],iterations: int=2000) -> tuple[float,float]:
    # Bootstrap *paired* log ratios; observed B/C order alternates on each round.
    logs=[math.log(y/x) for x,y in zip(b,c)]
    rng=random.Random(82125055)
    n=len(logs)
    dist=[]
    for _ in range(iterations):
        draw=[logs[rng.randrange(n)] for _ in range(n)]
        dist.append(math.exp(statistics.mean(draw)))
    dist.sort()
    return dist[int(iterations*0.025)],dist[int(iterations*0.975)-1]

def evaluate_measurements(b:list[float],c:list[float],limit:float,max_ms:float|None=None)->dict:
    if len(b)!=len(c) or len(b)<7 or any(not math.isfinite(v) or v<=0 for v in b+c): raise ValueError('at least 7 positive paired samples are required')
    lo,hi=boot_ci(b,c)
    medb=statistics.median(b); medc=statistics.median(c)
    geo=math.exp(statistics.mean([math.log(y/x) for x,y in zip(b,c)]))
    tolerance=1+limit/100
    budget_bad=max_ms is not None and medc>max_ms
    if budget_bad or lo>tolerance: state='DEFECT'
    elif hi<=tolerance: state='VERIFIED'
    else: state='UNVERIFIED_NOISE'
    return {'status':state,'n':len(b),'baseline_median_ms':medb,'candidate_median_ms':medc,'candidate_over_baseline_median_ratio':medc/medb,'paired_geomean_ratio':geo,'paired_bootstrap_ci95':[lo,hi], 'max_regression_pct':limit,'absolute_budget_ms':max_ms,'absolute_budget_exceeded':bool(budget_bad),'regression_evidence': 'paired bootstrap log-ratio; descriptive, not machine-independent proof'}

def run_bench(root:Path,spec_path:Path,output:Path) -> int:
    spec=json.loads(spec_path.read_text())
    conf=verify_inputs(root,spec)
    b=[];c=[];pairs=[];stdout_digests={'baseline':set(),'candidate':set()}
    status='UNVERIFIED';problem=None
    try:
        for warm in range(conf['warmups']):
            for branch in (('baseline','candidate') if warm%2==0 else ('candidate','baseline')):
                timed(spec[branch+'_command'],conf['cwd'],conf['timeout'])
        for i in range(conf['samples']):
            current={}
            order=('baseline','candidate') if i%2==0 else ('candidate','baseline')
            for branch in order:
                m=timed(spec[branch+'_command'],conf['cwd'],conf['timeout'])
                current[branch]=m;stdout_digests[branch].add(m['stdout_sha256'])
            b.append(current['baseline']['ms']);c.append(current['candidate']['ms'])
            pairs.append({'index':i,'order':list(order),**current})
        equal=spec.get('equal_stdout',True)
        if type(equal)!=bool: raise ValueError('equal_stdout must be boolean')
        if equal and (len(stdout_digests['baseline'])!=1 or stdout_digests['baseline']!=stdout_digests['candidate']):
            status='DEFECT';problem='baseline and candidate stdout differs or is nondeterministic'
        elif not equal:
            status='UNVERIFIED';problem='functional equivalence not checked: equal_stdout=false; independent correctness evidence required'
        else:
            budget=spec.get('max_candidate_median_ms')
            if budget is not None and (type(budget) not in (float,int) or budget<=0 or not math.isfinite(budget)):
                raise ValueError('max_candidate_median_ms invalid')
            metrics=evaluate_measurements(b,c,conf['limit'],budget)
            status=metrics['status']
    except (RuntimeError,ValueError) as exc:
        problem=str(exc)
        if not status=='DEFECT': status='BLOCKED_EXECUTION'
    report={'schema_version':'1.0','tool_version':VERSION,'workload_id':spec['workload_id'],
        'status':status,'problem':problem,'contract_sha256':digest(spec_path.read_bytes()),
        'environment':{'platform':platform.platform(),'python':platform.python_version(),'machine':platform.machine()},
        'fingerprints':conf['fingerprints'],'config':{'samples':conf['samples'],'warmups':conf['warmups'],'timeout_seconds':conf['timeout'],'max_regression_pct':conf['limit']},
        'measurements':pairs,'metrics': (metrics if 'metrics' in locals() else None),
        'claim_boundary':'This measures this command and workload on this host; it is not ISO/IEC 5055 conformance.'}
    write_json(output,report)
    print(json.dumps({'status':status,'report':str(output),'problem':problem,'metrics':report['metrics']},sort_keys=True))
    return 0 if status=='VERIFIED' else 1

def scan(root:Path, output:Path)->int:
    findings=[];visited=0;not_analyzed=[]
    for p in sorted(root.rglob('*')):
        if not p.is_file() or '.git' in p.parts: continue
        suffix=p.suffix.lower()
        if suffix not in {'.py','.js','.ts','.go','.rs','.c','.cc','.cpp','.java'}: continue
        rel=str(p.relative_to(root))
        if p.stat().st_size>1_000_000:
            not_analyzed.append(rel+': file exceeds static scan limit');continue
        if suffix!='.py':
            not_analyzed.append(rel+': no adapter; not analyzed');continue
        visited+=1
        try: tree=ast.parse(p.read_text(encoding='utf-8'))
        except (UnicodeDecodeError,SyntaxError): not_analyzed.append(rel+': unparsable');continue
        class Visitor(ast.NodeVisitor):
            nesting=0
            def visit_For(self,node): self._visit_loop(node)
            def visit_While(self,node): self._visit_loop(node)
            def _visit_loop(self,node):
                self.nesting+=1
                if self.nesting>=2: findings.append({'path':rel,'line':node.lineno,'rule':'PE-HINT-LOOP-NESTING','confidence':'LOW','finding':'nested iteration; assess algorithmic cost from actual input sizes'})
                self.generic_visit(node)
                self.nesting-=1
            def visit_Call(self,node):
                if self.nesting:
                    if isinstance(node.func,ast.Attribute) and node.func.attr in {'execute','executemany','fetchall','read_bytes','read_text','connect'}:
                        findings.append({'path':rel,'line':node.lineno,'rule':'PE-HINT-RESOURCE-IN-LOOP','confidence':'MEDIUM','finding':'potential resource/DB call in loop; inspect actual implementation and workload'})
                self.generic_visit(node)
        Visitor().visit(tree)
    report={'schema_version':'1.0','status':'HINTS_ONLY','python_files_analyzed':visited,'findings':findings,'not_analyzed':not_analyzed,
            'claim_boundary':'Heuristics do not prove a CWE, a performance regression, ISO conformity, or absence of risk.'}
    write_json(output,report)
    print(json.dumps({'status':report['status'],'findings':len(findings),'analyzed':visited,'unscanned':len(not_analyzed),'report':str(output)}))
    return 0

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='action',required=True)
    run=sub.add_parser('run');run.add_argument('--root',default='.');run.add_argument('--contract',default='contract.json');run.add_argument('--output',required=True)
    eva=sub.add_parser('evaluate');eva.add_argument('--baseline-samples',required=True,help='JSON array in a file');eva.add_argument('--candidate-samples',required=True,help='JSON array in a file');eva.add_argument('--max-regression-pct',type=float,default=5);eva.add_argument('--output',required=True)
    chk=sub.add_parser('scan');chk.add_argument('--root',default='.');chk.add_argument('--output',required=True)
    args=parser.parse_args()
    try:
        if args.action=='run':return run_bench(Path(args.root).resolve(),Path(args.contract).resolve(),Path(args.output).resolve())
        if args.action=='scan':return scan(Path(args.root).resolve(),Path(args.output).resolve())
        b=json.loads(Path(args.baseline_samples).read_text());c=json.loads(Path(args.candidate_samples).read_text())
        d=evaluate_measurements(b,c,args.max_regression_pct)
        d['claim_boundary']='Imported samples are untrusted until separately bound to real executed commands and source fingerprints.'
        write_json(Path(args.output),d);print(json.dumps(d,sort_keys=True))
        return 0 if d['status']=='VERIFIED' else 1
    except (ValueError,OSError,KeyError,json.JSONDecodeError) as exc:
        print('VALIDATION ERROR: '+str(exc),file=sys.stderr);return 2
if __name__=='__main__':sys.exit(main())
