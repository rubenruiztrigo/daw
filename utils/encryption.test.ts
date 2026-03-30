import { describe, it, expect } from 'vitest';
import { encryptMessage, decryptMessage } from './encryption';

describe('Encryption Utility', () => {
    it('should encrypt and decrypt a message correctly', () => {
        const originalText = 'Hello NovaGob 2026';
        const encrypted = encryptMessage(originalText);
        expect(encrypted).not.toBe(originalText);
        
        const decrypted = decryptMessage(encrypted);
        expect(decrypted).toBe(originalText);
    });

    it('should handle empty strings', () => {
        expect(encryptMessage('')).toBe('');
        expect(decryptMessage('')).toBe('');
    });

    it('should return original text if decryption fails', () => {
        const invalidCipher = 'not-a-valid-cipher';
        expect(decryptMessage(invalidCipher)).toBe(invalidCipher);
    });
});
