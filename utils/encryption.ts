import CryptoJS from 'crypto-js';

// WARNING: In a production environment, this key should be an environment variable
// and never committed to version control.
const SECRET_KEY = 'nova-gob-secret-chat-key-2026';

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
        // If decryption fails (e.g. empty string result for invalid key/text), return original 
        // to handle legacy/plain text messages gracefully during migration.
        return originalText || cipherText;
    } catch (e) {
        console.warn("Decryption failed (likely legacy plain text):", cipherText);
        return cipherText;
    }
};
