const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = '-';

function decodePunycode(input: string): string | null {
    let n = INITIAL_N;
    let i = 0;
    let bias = INITIAL_BIAS;
    const output: number[] = [];

    const delimIdx = input.lastIndexOf(DELIMITER);
    if (delimIdx > 0) {
        for (let j = 0; j < delimIdx; j++) {
            output.push(input.charCodeAt(j));
        }
        input = input.substring(delimIdx + 1);
    }

    while (input.length > 0) {
        const oldi = i;
        let w = 1;
        for (let k = BASE; ; k += BASE) {
            if (input.length === 0) return null;
            const char = input.charCodeAt(0);
            input = input.substring(1);
            
            let digit: number;
            if (char >= 48 && char <= 57) {
                digit = char - 48 + 26;
            } else if (char >= 97 && char <= 122) {
                digit = char - 97;
            } else if (char >= 65 && char <= 90) {
                digit = char - 65;
            } else {
                digit = BASE;
            }

            if (digit >= BASE) return null;
            i += digit * w;
            const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
            if (digit < t) break;
            w = w * (BASE - t);
        }
        const outLen = output.length + 1;
        let delta = i - oldi;
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

function toUnicode(domain: string): string {
    return domain.split('.').map(part => {
        if (part.toLowerCase().startsWith('xn--')) {
            const decoded = decodePunycode(part.substring(4));
            return decoded !== null ? decoded : part;
        }
        return part;
    }).join('.');
}

/**
 * Decodes any email address containing a Punycode encoded domain (e.g., ies@xn--caaveral-e3a.com)
 * back to its Unicode form (e.g., ies@cañaveral.com).
 */
export function decodeEmail(email: string | null | undefined): string {
    if (!email) return '';
    if (!email.includes('@')) return email;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [localPart, domain] = parts;
    try {
        const decodedDomain = toUnicode(domain);
        return `${localPart}@${decodedDomain}`;
    } catch {
        return email;
    }
}
