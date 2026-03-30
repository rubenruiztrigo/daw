import CryptoJS from 'crypto-js';

// 2026 STANDARD: Secrets must be in environment variables.
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_SECRET || 'fallback-dev-key-not-for-production';

if (!import.meta.env.VITE_ENCRYPTION_SECRET && import.meta.env.MODE === 'production') {
    console.error("FATAL: VITE_ENCRYPTION_SECRET is missing in production!");
}

export const encryptMessage = (text: string): string => {
    if (!text) return text;
    try {
        return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
    } catch (e) {
        console.error("Encryption failed:", e);
        return text;
    }
};

export const decryptMessage = (cipherText: string): string => {
    if (!cipherText) return cipherText;
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText || cipherText;
    } catch (e) {
        console.warn("Decryption failed:", cipherText);
        return cipherText;
    }
};
