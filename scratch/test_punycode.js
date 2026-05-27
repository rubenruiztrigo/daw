const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = '-';

function decodePunycode(input) {
    let n = INITIAL_N;
    let i = 0;
    let bias = INITIAL_BIAS;
    let output = [];

    let delimIdx = input.lastIndexOf(DELIMITER);
    if (delimIdx > 0) {
        for (let j = 0; j < delimIdx; j++) {
            let code = input.charCodeAt(j);
            output.push(code);
        }
        input = input.substring(delimIdx + 1);
    }

    while (input.length > 0) {
        let oldi = i;
        let w = 1;
        for (let k = BASE; ; k += BASE) {
            if (input.length === 0) return null; // error
            let char = input.charCodeAt(0);
            input = input.substring(1);
            
            // Digit mapping: a-z => 0-25, 0-9 => 26-35
            let digit;
            if (char >= 48 && char <= 57) {
                digit = char - 48 + 26;
            } else if (char >= 97 && char <= 122) {
                digit = char - 97;
            } else if (char >= 65 && char <= 90) {
                digit = char - 65;
            } else {
                digit = BASE;
            }

            if (digit >= BASE) return null; // error
            i += digit * w;
            let t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
            if (digit < t) break;
            w = w * (BASE - t);
        }
        let outLen = output.length + 1;
        let delta = i - oldi;
        
        // Adapt bias
        delta = oldi === 0 ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
        delta += Math.floor(delta / outLen);
        let k = 0;
        while (delta > Math.floor(((BASE - TMIN) * TMAX) / 2)) {
            delta = Math.floor(delta / (BASE - TMIN));
            k += BASE;
        }
        bias = k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
        
        n += Math.floor(i / outLen);
        i = i % outLen;
        output.splice(i, 0, n);
        i++;
    }
    return String.fromCodePoint(...output);
}

function toUnicode(domain) {
    return domain.split('.').map(part => {
        if (part.toLowerCase().startsWith('xn--')) {
            return decodePunycode(part.substring(4));
        }
        return part;
    }).join('.');
}

const email = 'ies@xn--caaveral-e3a.com';
const [localPart, domain] = email.split('@');
const decodedDomain = toUnicode(domain);
console.log('Decoded Email:', `${localPart}@${decodedDomain}`);
