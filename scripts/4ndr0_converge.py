#!/usr/bin/env python3
"""4ndr0neering 8.2: immutable acceptance contracts + evidence-backed stop/go ledger.

The controller never treats an incomplete mandatory gate as task completion.
A checkpoint is useful engineering output, but its exit status is not release PASS.
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, subprocess, sys, tempfile
from pathlib import Path

VERSION='8.2.0'
STATUSES={'PENDING','VERIFIED','DEFECT','UNVERIFIED','BLOCKED'}
GATES={'functional','regression','performance','security','reliability','persistence','provenance','integration','delivery','other'}
OWNERS={'engineer','user','external'}

def sha(raw:bytes)->str:return hashlib.sha256(raw).hexdigest()
def canonical(obj)->bytes:return json.dumps(obj,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()
def atomic_json(path:Path,obj)->None:
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(prefix='.'+path.name+'.',suffix='.tmp',dir=str(path.parent))
    try:
        with os.fdopen(fd,'w',encoding='utf-8') as out:
            json.dump(obj,out,indent=2,ensure_ascii=False,sort_keys=True);out.write('\n');out.flush();os.fsync(out.fileno())
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp):os.unlink(tmp)
def inside(root:Path,name:str)->Path:
    result=(root/name).resolve()
    if not result.is_relative_to(root.resolve()):raise ValueError('path escapes project root: '+name)
    return result

def validate_contract(doc:dict)->None:
    if not isinstance(doc,dict) or doc.get('version')!='1.0':raise ValueError('contract.version must be 1.0')
    items=doc.get('criteria')
    if not isinstance(items,list) or not items:raise ValueError('contract.criteria must be a non-empty array')
    ids=set();mandatory_count=0
    for c in items:
        if not isinstance(c,dict):raise ValueError('criterion must be an object')
        id=c.get('id')
        if not isinstance(id,str) or not re.fullmatch(r'[a-z][a-z0-9_-]{1,63}',id) or id in ids:raise ValueError('invalid/duplicate criterion id: '+str(id))
        ids.add(id)
        if not isinstance(c.get('description'),str) or not c['description'].strip():raise ValueError('criterion '+id+' missing description')
        if type(c.get('mandatory'))!=bool:raise ValueError('criterion '+id+' must declare mandatory true/false')
        mandatory_count+=bool(c['mandatory'])
        if c.get('gate') not in GATES:raise ValueError('criterion '+id+' invalid gate')
        if c.get('owner','engineer') not in OWNERS:raise ValueError('criterion '+id+' invalid owner')
        if 'command' in c and (not isinstance(c['command'],list) or not c['command'] or not all(isinstance(x,str) and x for x in c['command'])):
            raise ValueError('criterion '+id+' command must be executable argv list')
        if c.get('owner','engineer')=='user' and c.get('command'):
            raise ValueError('user authority cannot be satisfied by an automatic command: '+id)
        if c.get('owner','engineer')=='engineer' and not c.get('command'):
            raise ValueError('engineer-owned criterion '+id+' requires runnable command')
        if c.get('timeout_seconds',60) not in range(1,3601):raise ValueError('criterion '+id+' invalid timeout_seconds')
    if mandatory_count==0:raise ValueError('at least one mandatory criterion required')

def init(contract_path:Path,ledger_path:Path,root:Path)->dict:
    if ledger_path.exists():raise ValueError('ledger already exists; do not reset progress, use a new versioned path')
    contract=json.loads(contract_path.read_text());validate_contract(contract)
    led={'version':'1.0','engine_version':VERSION,'contract_sha256':sha(contract_path.read_bytes()),
         'source_contract_path':str(contract_path),'project_root':str(root),
         'states':{c['id']:'PENDING' for c in contract['criteria']},'events':[]}
    atomic_json(ledger_path,led);return led

def verify_ledger(led:dict,contract_path:Path,root:Path)->dict:
    contract=json.loads(contract_path.read_text());validate_contract(contract)
    if led.get('version')!='1.0':raise ValueError('unsupported ledger version')
    if led.get('contract_sha256')!=sha(contract_path.read_bytes()):raise ValueError('acceptance contract changed; new user-approved baseline required')
    if root!=Path(led.get('project_root','')).resolve():raise ValueError('project root differs from ledger baseline')
    states={c['id']:'PENDING' for c in contract['criteria']};last='0'*64
    for idx,event in enumerate(led.get('events',[])):
        if event.get('seq')!=idx+1 or event.get('previous_hash')!=last:raise ValueError('ledger hash chain broken at event '+str(idx))
        copy={k:v for k,v in event.items() if k!='event_hash'}
        expected=sha(canonical(copy))
        if event.get('event_hash')!=expected:raise ValueError('ledger event modified at '+str(idx))
        id=event.get('criterion_id');state=event.get('status')
        if id not in states or state not in STATUSES:raise ValueError('ledger has unrecognized criterion/state')
        if event.get('kind') not in ('command','environment_block'):raise ValueError('unsupported event kind')
        path=inside(root,event['evidence_path'])
        if not path.is_file() or sha(path.read_bytes())!=event.get('evidence_sha256'):
            raise ValueError('evidence file missing/changed: '+str(path))
        states[id]=state;last=expected
    if states!=led.get('states'):raise ValueError('ledger states do not match verified event chain')
    return contract

def add_event(led:dict,root:Path,crit:dict,status:str,kind:str,evidence_path:Path,details:dict)->None:
    if status not in STATUSES:raise ValueError('invalid status')
    rel=str(evidence_path.resolve().relative_to(root))
    prev=led['events'][-1]['event_hash'] if led['events'] else '0'*64
    event={'seq':len(led['events'])+1,'previous_hash':prev,'criterion_id':crit['id'],
           'status':status,'kind':kind,'evidence_path':rel,'evidence_sha256':sha(evidence_path.read_bytes()),
           'details':details}
    event['event_hash']=sha(canonical(event))
    led['events'].append(event);led['states'][crit['id']]=status

def run_check(led:dict,crit:dict,root:Path,ledger_path:Path)->str:
    if not crit.get('command'):raise ValueError('criterion '+crit['id']+' is not executable; requires owner decision')
    timeout=crit.get('timeout_seconds',60)
    seq=len(led['events'])+1
    evidence_dir=ledger_path.parent/'evidence'
    if not evidence_dir.resolve().is_relative_to(root):raise ValueError('ledger must reside within project root')
    path=evidence_dir/(f'round_{seq:04d}_{crit["id"]}.json')
    try:
        cp=subprocess.run(crit['command'],cwd=str(root),stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=timeout,check=False)
        code=cp.returncode
        stdout=cp.stdout;stderr=cp.stderr
        status='VERIFIED' if code==0 else 'DEFECT'
        exception=None
    except (subprocess.TimeoutExpired,OSError) as exc:
        code=None;stdout=getattr(exc,'stdout',None) or b'';stderr=getattr(exc,'stderr',None) or b''
        status='BLOCKED' if isinstance(exc,OSError) else 'DEFECT'
        exception=str(exc)
    evidence={'criterion_id':crit['id'],'command':crit['command'],'exit_code':code,'exception':exception,
        'stdout_sha256':sha(stdout),'stderr_sha256':sha(stderr),
        'stdout_excerpt':stdout[:8192].decode('utf-8',errors='replace'),
        'stderr_excerpt':stderr[:8192].decode('utf-8',errors='replace'),
        'stdout_truncated':len(stdout)>8192,'stderr_truncated':len(stderr)>8192,
        'status':status,'timeout_seconds':timeout}
    atomic_json(path,evidence)
    add_event(led,root,crit,status,'command',path,{'exit_code':code,'exception':exception})
    return status

def block_with_evidence(led:dict,crit:dict,root:Path,evidence_path:Path,reason:str,owner:str)->None:
    if not reason or len(reason)<12:raise ValueError('must state specific technical blocker')
    if owner not in {'user','external'} or crit.get('owner','engineer')!=owner:raise ValueError('blocker owner must match explicit contract owner')
    path=evidence_path.resolve()
    if not path.is_relative_to(root) or not path.is_file():raise ValueError('blocker evidence must be a real file inside project root')
    add_event(led,root,crit,'BLOCKED','environment_block',path,{'reason':reason,'owner':owner})

def assessment(contract:dict,led:dict)->dict:
    required=[c for c in contract['criteria'] if c['mandatory']]
    outstanding=[{'id':c['id'],'gate':c['gate'],'status':led['states'][c['id']],'owner':c.get('owner','engineer'),'description':c['description']} for c in required if led['states'][c['id']]!='VERIFIED']
    optional_unverified=[c['id'] for c in contract['criteria'] if not c['mandatory'] and led['states'][c['id']]!='VERIFIED']
    if not outstanding:state='CERTIFIED';next_action='DELIVER_CERTIFIED_RELEASE'
    elif any(x['status']=='DEFECT' and x['owner']=='engineer' for x in outstanding):state='INCOMPLETE';next_action='MITIGATE_AND_RETEST'
    elif any(x['status']=='BLOCKED' and x['owner']=='user' for x in outstanding):state='AUTHORITY_CHECKPOINT';next_action='REQUEST_NARROW_USER_DECISION'
    elif any(x['status']=='BLOCKED' and x['owner']=='external' for x in outstanding):state='EXTERNAL_BLOCKED';next_action='EXECUTE_ON_SUPPORTED_EXTERNAL_HOST'
    else:state='INCOMPLETE';next_action='EXECUTE_OR_REPLAN_REQUIRED_GATES'
    return {'status':state,'next_action':next_action,'mandatory_total':len(required),'mandatory_verified':len(required)-len(outstanding),
            'outstanding':outstanding,'optional_outstanding':optional_unverified,
            'release_eligible':state=='CERTIFIED',
            'claim_boundary':'Checkpoint/handoff is not task completion. Approval is not inferred; required criteria cannot be waived by this controller.'}

def main()->int:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['init','run','block','evaluate','verify'])
    parser.add_argument('--root',default='.')
    parser.add_argument('--contract',required=True)
    parser.add_argument('--ledger',required=True)
    parser.add_argument('--id')
    parser.add_argument('--all',action='store_true')
    parser.add_argument('--reason')
    parser.add_argument('--evidence')
    parser.add_argument('--owner',choices=['user','external'])
    parser.add_argument('--output')
    args=parser.parse_args()
    root=Path(args.root).resolve();contract_path=Path(args.contract).resolve();ledger_path=Path(args.ledger).resolve()
    lock_fd=None
    try:
        if not ledger_path.is_relative_to(root):raise ValueError('ledger must be within project root')
        # Serialize concurrent controller processes for a single repository ledger.
        # The existing kit builder already targets POSIX/Git/Bash environments.
        import fcntl
        ledger_path.parent.mkdir(parents=True,exist_ok=True)
        lock_fd=open(str(ledger_path)+'.lock','a+b')
        fcntl.flock(lock_fd,fcntl.LOCK_EX)
        if args.action=='init':
            ledger=init(contract_path,ledger_path,root)
            contract=json.loads(contract_path.read_text())
        else:
            ledger=json.loads(ledger_path.read_text())
            contract=verify_ledger(ledger,contract_path,root)
        if args.action=='run':
            selected=[c for c in contract['criteria'] if args.all or c['id']==args.id]
            if not selected or not (args.all or args.id):raise ValueError('select --id or --all')
            for crit in selected:
                if crit.get('command'):
                    run_check(ledger,crit,root,ledger_path)
                    atomic_json(ledger_path,ledger)
        if args.action=='block':
            matches=[c for c in contract['criteria'] if c['id']==args.id]
            if len(matches)!=1 or not args.evidence or not args.owner:raise ValueError('block requires --id, --evidence, --owner and --reason')
            block_with_evidence(ledger,matches[0],root,Path(args.evidence),args.reason or '',args.owner)
            atomic_json(ledger_path,ledger)
        if args.action=='verify':
            print(json.dumps({'status':'VALID','events':len(ledger['events']),'contract_sha256':ledger['contract_sha256']}));return 0
        report=assessment(contract,ledger)
        if args.output:atomic_json(Path(args.output),report)
        print(json.dumps(report,sort_keys=True))
        return 0 if args.action=='init' else (0 if report['release_eligible'] else 1)
    except (ValueError,KeyError,OSError,json.JSONDecodeError,ImportError) as exc:
        print('VALIDATION ERROR: '+str(exc),file=sys.stderr);return 2
    finally:
        if lock_fd is not None: lock_fd.close()
if __name__=='__main__':sys.exit(main())
