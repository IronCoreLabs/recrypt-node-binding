export type PrivateKey = Buffer;
export type PublicSigningKey = Buffer;
export type PrivateSigningKey = Buffer;
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
export function augmentTransformKey(transformKey: TransformKey, privateKey: PrivateKey): TransformKey;
export class Api256 {
    constructor();
    generateKeyPair(): KeyPair;
    generateEd25519KeyPair(): SigningKeyPair;
    generatePlaintext(): Plaintext;
    generateTransformKey(
        fromPrivateKey: PrivateKey,
        toPublicKey: PublicKey,
        publicSigningKey: PublicSigningKey,
        privateSigningKey: PrivateSigningKey
    ): TransformKey;
    computePublicKey(privateKey: PrivateKey): PublicKey;
    deriveSymmetricKey(plaintext: Plaintext): Buffer;
    encrypt(plaintext: Plaintext, toPublicKey: PublicKey, publicSigningKey: PublicSigningKey, privateSigningKey: PrivateSigningKey): EncryptedValue;
    transform(
        encryptedValue: EncryptedValue,
        transformKey: TransformKey,
        publicSigningKey: PublicSigningKey,
        privateSigningKey: PrivateSigningKey
    ): EncryptedValue;
    decrypt(encryptedValue: EncryptedValue, privateKey: PrivateKey): Plaintext;
}
