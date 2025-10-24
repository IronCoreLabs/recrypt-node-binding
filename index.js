"use strict";

/**
 * WARNING!
 *
 * This file is the bridge between the generated Rust binary and the JavaScript interface users call into.
 *
 * This file is not generated. Any changes made in the Rust code will need to be propagated out here, either by adding
 * bare functions to the export declaration at the bottom, or by adding new methods to the Api256 class.
 *
 * The `index.d.ts` file is also manually maintained, add any new signatures to it.
 */

const internal = require("./bin-package/index.node");

class Api256 {
    constructor() {
        this.boxed = internal.createApi256();
    }

    generateKeyPair() {
        return internal.generateKeyPair(this.boxed);
    }

    generateEd25519KeyPair() {
        return internal.generateEd25519KeyPair(this.boxed);
    }

    ed25519Sign(privateKey, message) {
        return internal.ed25519Sign(privateKey, message);
    }

    ed25519Verify(publicKey, message, signature) {
        return internal.ed25519Verify(publicKey, message, signature);
    }

    computeEd25519PublicKey(privateKey) {
        return internal.computeEd25519PublicKey(privateKey);
    }

    generatePlaintext() {
        return internal.generatePlaintext(this.boxed);
    }

    generateTransformKey(fromPrivateKey, toPublicKey, privateSigningKey) {
        return internal.generateTransformKey(this.boxed, fromPrivateKey, toPublicKey, privateSigningKey);
    }

    computePublicKey(privateKey) {
        return internal.computePublicKey(this.boxed, privateKey);
    }

    deriveSymmetricKey(plaintext) {
        return internal.deriveSymmetricKey(this.boxed, plaintext);
    }

    encrypt(plaintext, toPublicKey, privateSigningKey) {
        return internal.encrypt(this.boxed, plaintext, toPublicKey, privateSigningKey);
    }

    transform(encryptedValue, transformKey, privateSigningKey) {
        return internal.transform(this.boxed, encryptedValue, transformKey, privateSigningKey);
    }

    decrypt(encryptedValue, privateKey) {
        return internal.decrypt(this.boxed, encryptedValue, privateKey);
    }

    schnorrSign(privateKey, publicKey, message) {
        return internal.schnorrSign(this.boxed, privateKey, publicKey, message);
    }

    schnorrVerify(publicKey, augmentedPrivateKey, message, signature) {
        return internal.schnorrVerify(this.boxed, publicKey, augmentedPrivateKey, message, signature);
    }
}

module.exports = {
    Api256,
    augmentPublicKey256: internal.augmentPublicKey256,
    augmentTransformKey256: internal.augmentTransformKey256,
    transformKeyToBytes256: internal.transformKeyToBytes256,
    addPrivateKeys: internal.addPrivateKeys,
    subtractPrivateKeys: internal.subtractPrivateKeys,
};
