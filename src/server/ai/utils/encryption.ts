import crypto from 'crypto';

let masterKeyBuffer: Buffer;
const envKey = process.env.AI_ENCRYPTION_MASTER_KEY;

if (envKey) {
  if (envKey.length === 64) {
    masterKeyBuffer = Buffer.from(envKey, 'hex');
  } else {
    masterKeyBuffer = crypto.createHash('sha256').update(envKey).digest();
  }
} else {
  console.warn('⚠️ WARNING: AI_ENCRYPTION_MASTER_KEY is not configured in environment. Generating a secure temporary session-only key.');
  masterKeyBuffer = crypto.randomBytes(32);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns the hex-encoded ciphertext, unique IV, and authentication tag.
 */
export function encrypt(text: string): { encryptedText: string; iv: string; tag: string } {
  if (!text) {
    throw new Error('No text provided to encrypt');
  }
  const iv = crypto.randomBytes(12); // 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKeyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return {
    encryptedText: encrypted,
    iv: iv.toString('hex'),
    tag: tag
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext using the provided IV and auth tag.
 */
export function decrypt(encryptedText: string, ivHex: string, tagHex: string): string {
  if (!encryptedText || !ivHex || !tagHex) {
    throw new Error('Missing cipher parameters for decryption');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKeyBuffer, iv);

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
