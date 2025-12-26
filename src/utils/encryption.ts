// Polyfill for crypto.getRandomValues (must be imported FIRST)
import 'react-native-get-random-values';

import CryptoJS from 'crypto-js';
import auth from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
const APP_SALT = process.env.ENCRYPTION_SALT;

class EncryptionService {
  /** Derive a 256-bit key as a CryptoJS WordArray */
  private getKey(): CryptoJS.lib.WordArray {
    const user = auth(getApp()).currentUser;
    let rawKey: string;

    if (user && user.uid) {
      const email = user.email ?? '';
      rawKey = `${user.uid}:${email}:${APP_SALT}`;
    } else {
      console.warn('Encryption key: user not authenticated – using fallback key');
      rawKey = APP_SALT;
    }

    // SHA-256 produces a 256-bit (32-byte) key
    return CryptoJS.SHA256(rawKey);
  }

  /** Encrypt a UTF-8 string. Returns `IV_HEX:CIPHERTEXT_BASE64` */
  encrypt(plain: string): string {
    if (!plain) return plain;

    const key = this.getKey();
    // Generate a random 128-bit IV
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(plain, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Store IV (hex) + ciphertext (base64) separated by ':'
    const ivHex = iv.toString(CryptoJS.enc.Hex);
    const ctBase64 = encrypted.toString(); // already base64
    return `${ivHex}:${ctBase64}`;
  }

  /** Decrypt a string produced by `encrypt` */
  decrypt(encoded: string): string {
    if (!encoded) return encoded;

    const colonIndex = encoded.indexOf(':');
    if (colonIndex === -1) {
      // Legacy format (no IV prefix) – try direct decryption
      const key = this.getKey();
      const bytes = CryptoJS.AES.decrypt(encoded, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    }

    const ivHex = encoded.substring(0, colonIndex);
    const ctBase64 = encoded.substring(colonIndex + 1);

    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const key = this.getKey();

    const decrypted = CryptoJS.AES.decrypt(ctBase64, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

}

export const encryptionService = new EncryptionService();
