/* qr-verify.mjs — extracts the QRCode module EXACTLY as shipped in
 * the canon Pixeldrain++ file, evaluates it against the same round-trip
 * decoder used for the reference encoder. Proves the embedded copy equals
 * the tested copy — no transcription drift. */
import fs from "node:fs";

const canon = fs.readFileSync("canon/_sovereign/4ndr0tools - Pixeldrain++.user.js", "utf8");
const start = canon.indexOf("    const QRCode = (() => {");
const svgStart = canon.indexOf("        function svg(text, size = 220) {", start);
if (start === -1 || svgStart === -1) throw new Error("QRCode module not found in canon");

/* pull the module body up to (excluding) svg(), then expose qrEncode */
let body = canon.slice(start + "    const QRCode = (() => {".length, svgStart);
const moduleSrc = `
    const api = (() => {
${body}
        return { qrEncode };
    })();
`;

const mod = await (async () => {
    const blob = `export const qrEncode = (() => {\n${body}\nreturn qrEncode;\n})();`;
    return import("data:text/javascript;charset=utf-8," + encodeURIComponent(blob));
})();

/* round-trip decoder (same as qr-roundtrip-test.mjs) */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
function rsGenerator(degree) {
    let result = [1], root = 1;
    for (let i = 0; i < degree; i++) {
        const next = new Array(result.length + 1).fill(0);
        for (let j = 0; j < result.length; j++) { next[j] ^= result[j]; next[j + 1] ^= gmul(result[j], root); }
        result = next;
        root = gmul(root, 2);
    }
    return result;
}
const CAP = [[19, 7], [34, 10], [55, 15], [80, 20], [108, 26]];
const ALIGN = [null, null, [6, 18], [6, 22], [6, 26], [6, 30]];
const MASKS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function decode(qr) {
    const { size, modules: m } = qr;
    const version = (size - 17) / 4;
    const R = Array.from({ length: size }, () => new Array(size).fill(false));
    const mark = (r, c) => { if (r >= 0 && r < size && c >= 0 && c < size) R[r][c] = true; };
    const finder = (r0, c0) => { for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) mark(r0 + dr, c0 + dc); };
    finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
    for (let i = 8; i < size - 8; i++) { mark(6, i); mark(i, 6); }
    if (ALIGN[version]) {
        for (const r of ALIGN[version]) for (const c of ALIGN[version]) {
            if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
            for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) mark(r + dr, c + dc);
        }
    }
    mark(size - 8, 8);
    for (let i = 0; i <= 8; i++) { mark(8, i); mark(i, 8); }
    for (let i = 0; i < 8; i++) { mark(8, size - 1 - i); mark(size - 1 - i, 8); }

    const readFmt = () => {
        const bits = new Array(15);
        for (let i = 0; i <= 5; i++) bits[i] = m[8][i] ? 1 : 0;
        bits[6] = m[8][7] ? 1 : 0; bits[7] = m[8][8] ? 1 : 0; bits[8] = m[7][8] ? 1 : 0;
        for (let i = 9; i <= 14; i++) bits[i] = m[14 - i][8] ? 1 : 0;
        let v = 0;
        for (let i = 14; i >= 0; i--) v = (v << 1) | bits[i];
        return v ^ 0x5412;
    };
    const readFmt2 = () => {
        const bits = new Array(15);
        for (let i = 0; i <= 6; i++) bits[i] = m[size - 1 - i][8] ? 1 : 0;
        for (let i = 7; i <= 14; i++) bits[i] = m[8][size - 15 + i] ? 1 : 0;
        let v = 0;
        for (let i = 14; i >= 0; i--) v = (v << 1) | bits[i];
        return v ^ 0x5412;
    };
    const f1 = readFmt(), f2 = readFmt2();
    if (f1 !== f2) throw new Error("format copies disagree");
    const fdata = f1 >> 10;
    const mask = fdata & 0b111;
    const ecLevel = (fdata >> 3) & 0b11;
    if (ecLevel !== 0b01) throw new Error("expected EC level L");
    let rem = fdata << 10;
    for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    if (rem !== (f1 & 0x3FF)) throw new Error("BCH check failed");

    const fn = MASKS[mask];
    const bits = [];
    let up = true;
    for (let right = size - 1; right >= 1; right -= 2) {
        if (right === 6) right--;
        for (let vert = 0; vert < size; vert++) {
            for (let j = 0; j < 2; j++) {
                const c = right - j;
                const r = up ? size - 1 - vert : vert;
                if (R[r][c]) continue;
                bits.push((m[r][c] !== fn(r, c)) ? 1 : 0);
            }
        }
        up = !up;
    }
    const codewords = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
        codewords.push(b);
    }
    const [dataLen, ecLen] = CAP[version - 1];
    if (codewords.length !== dataLen + ecLen) throw new Error(`codeword count ${codewords.length} != ${dataLen + ecLen}`);
    const gen = rsGenerator(ecLen);
    const remCheck = new Array(ecLen).fill(0);
    for (const b of codewords) {
        const factor = b ^ remCheck.shift();
        remCheck.push(0);
        if (factor !== 0) for (let i = 0; i < ecLen; i++) remCheck[i] ^= gmul(gen[i + 1], factor);
    }
    if (remCheck.some((x) => x !== 0)) throw new Error("RS syndrome non-zero");
    const dbits = codewords.slice(0, dataLen).flatMap((b) => b.toString(2).padStart(8, "0").split("").map(Number));
    let count = 0;
    for (let i = 4; i < 12; i++) count = (count << 1) | dbits[i];
    const out = [];
    for (let i = 0; i < count; i++) {
        let b = 0;
        for (let j = 12 + i * 8; j < 12 + i * 8 + 8; j++) b = (b << 1) | dbits[j];
        out.push(b);
    }
    return { text: new TextDecoder().decode(new Uint8Array(out)) };
}

const cases = [
    "HELLO WORLD",
    "https://pixeldrain.com/u/abc123",
    "https://cdn.pixeldrain.com/api/file/xyz789?download",
    "a",
    "The quick brown fox jumps over the lazy dog 0123456789 !@#$%^&*()",
    "unicode: Ψ 4ndr0666 — æøå 日本語",
    "x".repeat(106),
];
let pass = 0, fail = 0;
for (const text of cases) {
    try {
        const qr = mod.qrEncode(text);
        if (!qr) throw new Error("null");
        const dec = decode(qr);
        if (dec.text !== text) throw new Error("mismatch");
        pass++;
        console.log(`PASS (embedded) ${text.length}ch`);
    } catch (e) {
        fail++;
        console.log(`FAIL (embedded) ${text.slice(0, 40)}: ${e.message}`);
    }
}
if (mod.qrEncode("x".repeat(107)) !== null) { fail++; console.log("FAIL boundary"); } else { pass++; console.log("PASS boundary (embedded)"); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
