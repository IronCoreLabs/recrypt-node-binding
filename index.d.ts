export type PrivateKey = Buffer;
export type PublicSigningKey = Buffer;
export type PrivateSigningKey = Buffer;
export type Signature = Buffer;
export interface PublicKey {
    x: Buffer;
    y: Buffer;
}
export interface KeyPair {
    publicKey: PublicKey;
    privateKey: PrivateKey;
}
export interface SigningKeyPair {
    publicKey: PublicSigningKey;
    privateKey: PrivateSigningKey;
}
export type Plaintext = Buffer;
export interface TransformBlock {
    publicKey: PublicKey;
    encryptedTempKey: Buffer;
    randomTransformPublicKey: PublicKey;
    randomTransformEncryptedTempKey: Buffer;
}
export interface EncryptedValue {
    ephemeralPublicKey: PublicKey;
    encryptedMessage: Buffer;
    authHash: Buffer;
    transformBlocks: TransformBlock[];
    publicSigningKey: PublicSigningKey;
    signature: Buffer;
}

export interface TransformKey {
    ephemeralPublicKey: PublicKey;
    toPublicKey: PublicKey;
    encryptedTempKey: Buffer;
    hashedTempKey: Buffer;
    publicSigningKey: PublicSigningKey;
    signature: Buffer;
}

export function augmentPublicKey256(publicKey: PublicKey, otherPublicKey: PublicKey): PublicKey;
export function augmentTransformKey256(transformKey: TransformKey, privateKey: PrivateKey): TransformKey;
export function transformKeyToBytes256(transformKey: TransformKey): Buffer;
export class Api256 {
    constructor();
    generateKeyPair(): KeyPair;
    generateEd25519KeyPair(): SigningKeyPair;
    ed25519Sign(privateKey: PrivateSigningKey, message: Buffer): Signature;
    ed25519Verify(publicKey: PublicSigningKey, message: Buffer, signature: Signature): boolean;
    computeEd25519PublicKey(privateKey: PrivateSigningKey): PublicSigningKey;
    generatePlaintext(): Plaintext;
    generateTransformKey(fromPrivateKey: PrivateKey, toPublicKey: PublicKey, privateSigningKey: PrivateSigningKey): TransformKey;
    computePublicKey(privateKey: PrivateKey): PublicKey;
    hash256(hashable_buffer: Buffer): Buffer;
    deriveSymmetricKey(plaintext: Plaintext): Buffer;
    encrypt(plaintext: Plaintext, toPublicKey: PublicKey, privateSigningKey: PrivateSigningKey): EncryptedValue;
    transform(encryptedValue: EncryptedValue, transformKey: TransformKey, privateSigningKey: PrivateSigningKey): EncryptedValue;
    decrypt(encryptedValue: EncryptedValue, privateKey: PrivateKey): Plaintext;
    schnorrSign(privateKey: Buffer, publicKey: PublicKey, message: Buffer): Signature;
    schnorrVerify(publicKey: PublicKey, augmentedPrivateKey: Buffer | undefined, message: Buffer, signature: Signature): boolean;
}
