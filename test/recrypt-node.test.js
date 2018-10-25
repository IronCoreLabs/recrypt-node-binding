const recrypt = require("../native/index.node");
//Randomly generated legit ED25519 keypair
const publicSigningKey = Buffer.from("LQPVx4NPqxSFQO/p6JgA4xGydUfxnfsRwTu/VJy6sQ0=", "base64");
const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

describe("Recrypt-Node", () => {
    describe("Api256", () => {
        const api = new recrypt.Api256();

        describe("generateKeyPair", () => {
            test("should generate keypairs of the expected length", () => {
                const keypair = api.generateKeyPair();
                expect(keypair).toBeObject();
                expect(Object.keys(keypair)).toHaveLength(2);
                expect(keypair.publicKey).toBeObject();
                expect(keypair.privateKey).toBeInstanceOf(Buffer);
                expect(keypair.privateKey).toHaveLength(32);
                expect(Object.keys(keypair.publicKey)).toHaveLength(2);
                expect(keypair.publicKey.x).toBeInstanceOf(Buffer);
                expect(keypair.publicKey.x).toHaveLength(32);
                expect(keypair.publicKey.y).toBeInstanceOf(Buffer);
                expect(keypair.publicKey.y).toHaveLength(32);
            });
        });

        describe("generateEd25519KeyPair", () => {
            test("should generate ed25519 keypairs of the expected length", () => {
                const keypair = api.generateEd25519KeyPair();
                expect(keypair).toBeObject();
                expect(Object.keys(keypair)).toHaveLength(2);
                expect(keypair.publicKey).toBeInstanceOf(Buffer);
                expect(keypair.privateKey).toBeInstanceOf(Buffer);

                expect(keypair.publicKey).toHaveLength(32);
                expect(keypair.privateKey).toHaveLength(64);
            });
        });

        describe("ed25519Sign", () => {
            test("should produce a valid signature", () => {
                const keypair = api.generateEd25519KeyPair();

                const signature = api.ed25519Sign(keypair.privateKey, Buffer.from("message to sign"));
                expect(signature).toBeInstanceOf(Buffer);
                expect(signature).toHaveLength(64);
            });
        });

        describe("ed25519Verify", () => {
            test("should roundtrip verify a signature", () => {
                const keypair = api.generateEd25519KeyPair();
                const signature = api.ed25519Sign(keypair.privateKey, Buffer.from("message to sign"));

                expect(api.ed25519Verify(keypair.publicKey, Buffer.from("message to sign"), signature)).toBeTrue();
            });

            test("should fail if message is not the same", () => {
                const keypair = api.generateEd25519KeyPair();
                const signature = api.ed25519Sign(keypair.privateKey, Buffer.from("message to sign"));

                expect(api.ed25519Verify(keypair.publicKey, Buffer.from("message to sign2"), signature)).toBeFalse();
            });

            test("should fail if key is wrong", () => {
                const keypair = api.generateEd25519KeyPair();
                const failedKeyPair = api.generateEd25519KeyPair();
                const signature = api.ed25519Sign(keypair.privateKey, Buffer.from("message to sign"));

                expect(api.ed25519Verify(failedKeyPair.publicKey, Buffer.from("message to sign2"), signature)).toBeFalse();
            });
        });

        describe("computeEd25519PublicKey", () => {
            it("should result in expected public key", () => {
                const keypair = api.generateEd25519KeyPair();
                expect(api.computeEd25519PublicKey(keypair.privateKey)).toEqual(keypair.publicKey);
            });
        });

        describe("generatePlaintext", () => {
            test("should generate a plaintext of the expected length", () => {
                const plaintext = api.generatePlaintext();
                expect(plaintext).toBeInstanceOf(Buffer);
                expect(plaintext).toHaveLength(384);
            });
        });

        describe("generateTransformKey", () => {
            test("should generate tramsform key with expected properties", () => {
                const fromPrivateKey = api.generateKeyPair().privateKey;
                const toPublicKey = api.generateKeyPair().publicKey;

                const transformKey = api.generateTransformKey(fromPrivateKey, toPublicKey, privateSigningKey);
                expect(transformKey).toBeObject();
                expect(Object.keys(transformKey)).toHaveLength(6);

                expect(transformKey.toPublicKey).toEqual(toPublicKey);
                expect(transformKey.publicSigningKey).toEqual(publicSigningKey);

                expect(transformKey.ephemeralPublicKey).toBeObject();
                expect(Object.keys(transformKey.ephemeralPublicKey)).toHaveLength(2);
                expect(transformKey.ephemeralPublicKey.x).toBeInstanceOf(Buffer);
                expect(transformKey.ephemeralPublicKey.x).toHaveLength(32);
                expect(transformKey.ephemeralPublicKey.y).toBeInstanceOf(Buffer);
                expect(transformKey.ephemeralPublicKey.y).toHaveLength(32);

                expect(transformKey.encryptedTempKey).toBeInstanceOf(Buffer);
                expect(transformKey.encryptedTempKey).toHaveLength(384);

                expect(transformKey.hashedTempKey).toBeInstanceOf(Buffer);
                expect(transformKey.hashedTempKey).toHaveLength(128);

                expect(transformKey.signature).toBeInstanceOf(Buffer);
                expect(transformKey.signature).toHaveLength(64);
            });
        });

        describe("computePublicKey", () => {
            test("should return expected public key from private key", () => {
                const keypair = api.generateKeyPair();
                expect(api.computePublicKey(keypair.privateKey)).toEqual(keypair.publicKey);
            });
        });

        describe("deriveSymmetricKey", () => {
            test("should return symmetric key from plaintext", () => {
                const pt = api.generatePlaintext();
                const symmetricKey = api.deriveSymmetricKey(pt);
                expect(symmetricKey).toBeInstanceOf(Buffer);
                expect(symmetricKey).toHaveLength(32);
            });
        });

        describe("encrypt", () => {
            test("should encrypt the provided value and return an encrypted value object", () => {
                const plaintext = api.generatePlaintext();
                const toPublicKey = api.generateKeyPair().publicKey;

                const encryptedVal = api.encrypt(plaintext, toPublicKey, privateSigningKey);

                expect(encryptedVal).toBeObject();
                expect(Object.keys(encryptedVal)).toHaveLength(6);

                expect(encryptedVal.ephemeralPublicKey).toBeObject();
                expect(Object.keys(encryptedVal.ephemeralPublicKey)).toHaveLength(2);
                expect(encryptedVal.ephemeralPublicKey.x).toBeInstanceOf(Buffer);
                expect(encryptedVal.ephemeralPublicKey.x).toHaveLength(32);
                expect(encryptedVal.ephemeralPublicKey.y).toBeInstanceOf(Buffer);
                expect(encryptedVal.ephemeralPublicKey.y).toHaveLength(32);

                expect(encryptedVal.encryptedMessage).toBeInstanceOf(Buffer);
                expect(encryptedVal.encryptedMessage).toHaveLength(384);

                expect(encryptedVal.authHash).toBeInstanceOf(Buffer);
                expect(encryptedVal.authHash).toHaveLength(32);

                expect(encryptedVal.publicSigningKey).toEqual(publicSigningKey);

                expect(encryptedVal.signature).toBeInstanceOf(Buffer);
                expect(encryptedVal.signature).toHaveLength(64);

                expect(encryptedVal.transformBlocks).toBeArrayOfSize(0);
            });
        });

        describe("transform", () => {
            it("generates expected value for level 1 transform", () => {
                const keys = api.generateKeyPair();
                const publicKey = keys.publicKey;
                const privateKey = keys.privateKey;
                const lvl0EncryptedValue = api.encrypt(api.generatePlaintext(), publicKey, privateSigningKey);
                const secondaryKeys = api.generateKeyPair();
                const transformKey = api.generateTransformKey(privateKey, secondaryKeys.publicKey, privateSigningKey);
                const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, transformKey, privateSigningKey);

                expect(lvl1EncryptedValue).toBeObject();
                expect(Object.keys(lvl1EncryptedValue)).toHaveLength(6);

                expect(lvl1EncryptedValue.ephemeralPublicKey).toBeObject();
                expect(Object.keys(lvl1EncryptedValue.ephemeralPublicKey)).toHaveLength(2);
                expect(lvl1EncryptedValue.ephemeralPublicKey.x).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.ephemeralPublicKey.x).toHaveLength(32);
                expect(lvl1EncryptedValue.ephemeralPublicKey.y).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.ephemeralPublicKey.y).toHaveLength(32);

                expect(lvl1EncryptedValue.encryptedMessage).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.encryptedMessage).toHaveLength(384);

                expect(lvl1EncryptedValue.authHash).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.authHash).toHaveLength(32);

                expect(lvl1EncryptedValue.publicSigningKey).toEqual(publicSigningKey);
                expect(lvl1EncryptedValue.publicSigningKey).toHaveLength(32);

                expect(lvl1EncryptedValue.signature).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.signature).toHaveLength(64);

                expect(lvl1EncryptedValue.transformBlocks).toBeArrayOfSize(1);

                expect(lvl1EncryptedValue.transformBlocks[0].encryptedTempKey).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.transformBlocks[0].encryptedTempKey).toHaveLength(384);

                expect(lvl1EncryptedValue.transformBlocks[0].randomTransformEncryptedTempKey).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.transformBlocks[0].randomTransformEncryptedTempKey).toHaveLength(384);

                expect(lvl1EncryptedValue.transformBlocks[0].publicKey).toBeObject();
                expect(Object.keys(lvl1EncryptedValue.transformBlocks[0].publicKey)).toHaveLength(2);
                expect(lvl1EncryptedValue.transformBlocks[0].publicKey.x).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.transformBlocks[0].publicKey.x).toHaveLength(32);
                expect(lvl1EncryptedValue.transformBlocks[0].publicKey.y).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.transformBlocks[0].publicKey.y).toHaveLength(32);

                expect(lvl1EncryptedValue.transformBlocks[0].randomTransformPublicKey).toBeObject();
                expect(Object.keys(lvl1EncryptedValue.transformBlocks[0].randomTransformPublicKey)).toHaveLength(2);
                expect(lvl1EncryptedValue.transformBlocks[0].randomTransformPublicKey.x).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.transformBlocks[0].randomTransformPublicKey.x).toHaveLength(32);
                expect(lvl1EncryptedValue.transformBlocks[0].randomTransformPublicKey.y).toBeInstanceOf(Buffer);
                expect(lvl1EncryptedValue.transformBlocks[0].randomTransformPublicKey.y).toHaveLength(32);
            });

            it("generates expected value for level 2 transform", () => {
                const groupKeys = api.generateKeyPair();
                const userKeys = api.generateKeyPair();
                const deviceKeys = api.generateKeyPair();

                const groupToUserTransform = api.generateTransformKey(groupKeys.privateKey, userKeys.publicKey, privateSigningKey);
                const userToDeviceTransform = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);

                const lvl0EncryptedValue = api.encrypt(api.generatePlaintext(), groupKeys.publicKey, privateSigningKey);
                const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, groupToUserTransform, privateSigningKey);
                const lvl2EncryptedValue = api.transform(lvl1EncryptedValue, userToDeviceTransform, privateSigningKey);

                expect(lvl2EncryptedValue).toBeObject();
                expect(Object.keys(lvl2EncryptedValue)).toHaveLength(6);

                expect(lvl2EncryptedValue.ephemeralPublicKey).toBeObject();
                expect(Object.keys(lvl2EncryptedValue.ephemeralPublicKey)).toHaveLength(2);
                expect(lvl2EncryptedValue.ephemeralPublicKey.x).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.ephemeralPublicKey.x).toHaveLength(32);
                expect(lvl2EncryptedValue.ephemeralPublicKey.y).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.ephemeralPublicKey.y).toHaveLength(32);

                expect(lvl2EncryptedValue.encryptedMessage).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.encryptedMessage).toHaveLength(384);

                expect(lvl2EncryptedValue.authHash).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.authHash).toHaveLength(32);

                expect(lvl2EncryptedValue.publicSigningKey).toEqual(publicSigningKey);
                expect(lvl2EncryptedValue.publicSigningKey).toHaveLength(32);

                expect(lvl2EncryptedValue.signature).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.signature).toHaveLength(64);

                expect(lvl2EncryptedValue.transformBlocks).toBeArrayOfSize(2);

                expect(lvl2EncryptedValue.transformBlocks[0].encryptedTempKey).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[0].encryptedTempKey).toHaveLength(384);

                expect(lvl2EncryptedValue.transformBlocks[0].randomTransformEncryptedTempKey).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[0].randomTransformEncryptedTempKey).toHaveLength(384);

                expect(lvl2EncryptedValue.transformBlocks[0].publicKey).toBeObject();
                expect(Object.keys(lvl2EncryptedValue.transformBlocks[0].publicKey)).toHaveLength(2);
                expect(lvl2EncryptedValue.transformBlocks[0].publicKey.x).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[0].publicKey.x).toHaveLength(32);
                expect(lvl2EncryptedValue.transformBlocks[0].publicKey.y).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[0].publicKey.y).toHaveLength(32);

                expect(lvl2EncryptedValue.transformBlocks[0].randomTransformPublicKey).toBeObject();
                expect(Object.keys(lvl2EncryptedValue.transformBlocks[0].randomTransformPublicKey)).toHaveLength(2);
                expect(lvl2EncryptedValue.transformBlocks[0].randomTransformPublicKey.x).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[0].randomTransformPublicKey.x).toHaveLength(32);
                expect(lvl2EncryptedValue.transformBlocks[0].randomTransformPublicKey.y).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[0].randomTransformPublicKey.y).toHaveLength(32);

                expect(lvl2EncryptedValue.transformBlocks[1].encryptedTempKey).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[1].encryptedTempKey).toHaveLength(384);

                expect(lvl2EncryptedValue.transformBlocks[1].randomTransformEncryptedTempKey).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[1].randomTransformEncryptedTempKey).toHaveLength(384);

                expect(lvl2EncryptedValue.transformBlocks[1].publicKey).toBeObject();
                expect(Object.keys(lvl2EncryptedValue.transformBlocks[1].publicKey)).toHaveLength(2);
                expect(lvl2EncryptedValue.transformBlocks[1].publicKey.x).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[1].publicKey.x).toHaveLength(32);
                expect(lvl2EncryptedValue.transformBlocks[1].publicKey.y).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[1].publicKey.y).toHaveLength(32);

                expect(lvl2EncryptedValue.transformBlocks[1].randomTransformPublicKey).toBeObject();
                expect(Object.keys(lvl2EncryptedValue.transformBlocks[1].randomTransformPublicKey)).toHaveLength(2);
                expect(lvl2EncryptedValue.transformBlocks[1].randomTransformPublicKey.x).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[1].randomTransformPublicKey.x).toHaveLength(32);
                expect(lvl2EncryptedValue.transformBlocks[1].randomTransformPublicKey.y).toBeInstanceOf(Buffer);
                expect(lvl2EncryptedValue.transformBlocks[1].randomTransformPublicKey.y).toHaveLength(32);
            });
        });

        describe("decrypt roundtrip", () => {
            test("should be able to roundtrip decrypt a level 0 encrypted value", () => {
                const plaintext = api.generatePlaintext();
                const keys = api.generateKeyPair();
                const publicKey = keys.publicKey;
                const privateKey = keys.privateKey;
                const lvl1EncryptedValue = api.encrypt(plaintext, publicKey, privateSigningKey);

                const decryptedPlaintext = api.decrypt(lvl1EncryptedValue, privateKey);

                expect(decryptedPlaintext).toEqual(plaintext);
            });

            it("should be able to roundtrip decrypt a level 1 encrypted value", () => {
                const plaintext = api.generatePlaintext();
                const userKeys = api.generateKeyPair();
                const deviceKeys = api.generateKeyPair();
                const transformKey = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);
                const lvl0EncryptedValue = api.encrypt(plaintext, userKeys.publicKey, privateSigningKey);

                const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, transformKey, privateSigningKey);

                const decryptedPlaintext = api.decrypt(lvl1EncryptedValue, deviceKeys.privateKey);

                expect(decryptedPlaintext).toEqual(plaintext);
            });

            it("should be able to decrypt augmented values", () => {
                const plaintext = api.generatePlaintext();
                const userKeys = api.generateKeyPair();
                const deviceKeys = api.generateKeyPair();
                const serverKeys = api.generateKeyPair();
                const transformKey = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);
                const augmentedPublicKey = recrypt.augmentPublicKey256(userKeys.publicKey, serverKeys.publicKey);
                const augmentedTransformKey = recrypt.augmentTransformKey256(transformKey, serverKeys.privateKey);

                const lvl0EncryptedValue = api.encrypt(plaintext, augmentedPublicKey, privateSigningKey);

                const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, augmentedTransformKey, privateSigningKey);

                const decryptedPlaintext = api.decrypt(lvl1EncryptedValue, deviceKeys.privateKey);

                expect(decryptedPlaintext).toEqual(plaintext);
            });

            it("should be able to roundtrip decrypt a level 2 encrypted value", () => {
                const plaintext = api.generatePlaintext();
                const groupKeys = api.generateKeyPair();
                const userKeys = api.generateKeyPair();
                const deviceKeys = api.generateKeyPair();
                const groupToUserTransform = api.generateTransformKey(groupKeys.privateKey, userKeys.publicKey, privateSigningKey);
                const userToDeviceTransform = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);

                const lvl0EncryptedValue = api.encrypt(plaintext, groupKeys.publicKey, privateSigningKey);
                const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, groupToUserTransform, privateSigningKey);
                const lvl2EncryptedValue = api.transform(lvl1EncryptedValue, userToDeviceTransform, privateSigningKey);

                const decryptedPlaintext = api.decrypt(lvl2EncryptedValue, deviceKeys.privateKey);

                expect(decryptedPlaintext).toEqual(plaintext);
            });
        });

        describe("Schnorr sign", () => {
            it("should sign the provided bytes and return the expected signature", () => {
                const keys = api.generateKeyPair();
                const message = Buffer.from("message to sign");

                const signature = api.schnorrSign(keys.privateKey, keys.publicKey, message);
                expect(signature).toBeInstanceOf(Buffer);
                expect(signature).toHaveLength(64);
            });
        });

        describe("Schnorr verify", () => {
            it("should verify the provided signed signature", () => {
                const keys = api.generateKeyPair();
                const falseKeys = api.generateKeyPair();

                const message = Buffer.from("message to sign");

                const signature = api.schnorrSign(keys.privateKey, keys.publicKey, message);

                expect(api.schnorrVerify(keys.publicKey, undefined, message, signature)).toBeTrue();
                expect(api.schnorrVerify(keys.publicKey, null, message, signature)).toBeTrue();

                expect(api.schnorrVerify(falseKeys.publicKey, undefined, message, signature)).toBeFalse();
            });

            it("should verify that passing in augmented private key works", () => {
                const userKeys = api.generateKeyPair();
                const serverKeys = api.generateKeyPair();
                const message = Buffer.from("message to sign");

                const augmentedPublicKey = recrypt.augmentPublicKey256(userKeys.publicKey, serverKeys.publicKey);

                const signature = api.schnorrSign(userKeys.privateKey, augmentedPublicKey, message);

                expect(api.schnorrVerify(augmentedPublicKey, serverKeys.privateKey, message, signature)).toBeTrue();
            });
        });
    });

    describe("augmentTransformKey256", () => {
        it("augments the provided transform key", () => {
            const api = new recrypt.Api256();
            const fromPrivateKey = api.generateKeyPair().privateKey;
            const toPublicKey = api.generateKeyPair().publicKey;
            const augPrivateKey = api.generateKeyPair().privateKey;

            const transformKey = api.generateTransformKey(fromPrivateKey, toPublicKey, privateSigningKey);

            const augTransformKey = recrypt.augmentTransformKey256(transformKey, augPrivateKey);

            expect(augTransformKey).toBeObject();
            expect(Object.keys(augTransformKey)).toHaveLength(6);

            expect(augTransformKey.toPublicKey).toEqual(toPublicKey);
            expect(augTransformKey.publicSigningKey).toEqual(publicSigningKey);

            expect(augTransformKey.ephemeralPublicKey).toBeObject();
            expect(Object.keys(augTransformKey.ephemeralPublicKey)).toHaveLength(2);
            expect(augTransformKey.ephemeralPublicKey.x).toBeInstanceOf(Buffer);
            expect(augTransformKey.ephemeralPublicKey.x).toHaveLength(32);
            expect(augTransformKey.ephemeralPublicKey.y).toBeInstanceOf(Buffer);
            expect(augTransformKey.ephemeralPublicKey.y).toHaveLength(32);

            expect(augTransformKey.encryptedTempKey).toBeInstanceOf(Buffer);
            expect(augTransformKey.encryptedTempKey).toHaveLength(384);

            expect(augTransformKey.hashedTempKey).toBeInstanceOf(Buffer);
            expect(augTransformKey.hashedTempKey).toHaveLength(128);

            expect(augTransformKey.signature).toBeInstanceOf(Buffer);
            expect(augTransformKey.signature).toHaveLength(64);
        });
    });

    describe("augmentPublicKey256", () => {
        it("augments the provided public key with another public key", () => {
            const api = new recrypt.Api256();
            const pub1 = api.generateKeyPair().publicKey;
            const pub2 = api.generateKeyPair().publicKey;

            const augPublicKey = recrypt.augmentPublicKey256(pub1, pub2);

            expect(augPublicKey).toBeObject();
            expect(Object.keys(augPublicKey)).toHaveLength(2);
            expect(augPublicKey.x).toBeInstanceOf(Buffer);
            expect(augPublicKey.x).toHaveLength(32);
            expect(augPublicKey.y).toBeInstanceOf(Buffer);
            expect(augPublicKey.y).toHaveLength(32);

            expect(augPublicKey).not.toEqual(pub1);
        });
    });

    describe("transformKeyToBytes256", () => {
        it("returns expected number of bytes", () => {
            const api = new recrypt.Api256();
            const fromPrivateKey = api.generateKeyPair().privateKey;
            const toPublicKey = api.generateKeyPair().publicKey;

            const transformKey = api.generateTransformKey(fromPrivateKey, toPublicKey, privateSigningKey);

            const transformKeyBytes = recrypt.transformKeyToBytes256(transformKey);
            expect(transformKeyBytes).toBeInstanceOf(Buffer);
            expect(transformKeyBytes).toHaveLength(672);
        });
    });
});
