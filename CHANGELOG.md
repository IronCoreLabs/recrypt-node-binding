## 0.2.0

### Breaking Changes

None

### Added

* Added methods for [Schnorr signing](https://en.wikipedia.org/wiki/Schnorr_signature).
    + `Api256::schnorrSign(privateKey: Buffer, publicKey: PublicKey, message: Buffer): Signature;`
    + `Api256::schnorrVerify(publicKey: PublicKey, augmentedPrivateKey: Buffer | undefined, message: Buffer, signature: Signature): boolean;`
* Exposed methods to perform ed25519 signing and verification as well as method to compute an ed25519 public key given it's matching private key.
    + `Api256::ed25519Sign(privateKey: PrivateSigningKey, message: Buffer): Signature;`
    + `Api256::ed25519Verify(publicKey: PublicSigningKey, message: Buffer, signature: Signature): boolean;`
    + `Api256::computeEd25519PublicKey(privateKey: PrivateSigningKey): PublicSigningKey;`

### Changed

* Consumed changes from [`recrypt-rs`](https://github.com/IronCoreLabs/recrypt-rs)([#1](https://github.com/IronCoreLabs/recrypt-rs/issues/1)) to zero secret bytes after use
* Moved `benchmark` and `test` repos to the root of the repo


## 0.1.0

Initial open source release