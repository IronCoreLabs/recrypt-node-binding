## 0.7.3

### Breaking Changes

None

### Changed

-   Added support for Node 14.

## 0.7.2

### Changed

-   Updated all JS and Rust library dependencies

## 0.7.1

### Changed

-   Added support for Node 10/12 on Windows

## 0.7.0

### Breaking Changes

-   Removed support for Node 8.

### Changed

-   Added method `addPrivateKeys(privKeyA: PrivateKey, privKeyB: PrivateKey): PrivateKey` which takes two private keys and adds them together to return a new private key.
-   Added method `subtractPrivateKeys(privKeyA: PrivateKey, privKeyB: PrivateKey): PrivateKey` which takes two private keys and subtracts `privKeyB` from `privKeyA` to return a new private key.

## 0.6.1

### Breaking Changes

None

### Changed

Updated to latest version of `recrypt-rs`.

## 0.6.0

### Added

-   Added binaries dynamically linked to musl-libc to support Alpine Linux

### Breaking Changes

None

### Changed

None

## 0.5.2

-   Depend on official release of Neon 0.3.

## 0.5.1

### Breaking Changes

-   Added support for Node 12
-   Removed support for Node 9 and 11
-   Removed the `hash256` method from the API. Use the `deriveSymmetricKey` method instead.

### Changed

-   Updated all dependencies to their latest versions, including Recrypt to 0.8.

## 0.4.2

### Added

None

### Breaking Changes

None

### Changed

-   Added support to build artifacts for Node 9 and Node 11.

## 0.4.1

### Added

-   `Api256.hash256(hashable_buffer: Buffer): Buffer;` Note that the returned `Buffer` will always be _exactly_ 32 bytes.

## 0.4.0

### Breaking Changes

-   Renamed the `transformKeyToBytes` method to `transformKeyToBytes256` to specify that it only works with 256 bit TransformKeys.
-   Removed incorrect empty array from TransformKey objects.

### Added

None

### Changed

-   Added `engines`, `os`, and `cpu` keys to `package.json` to specify which Node version and architectures this library will work on.

## 0.3.0

### Breaking Changes

-   The `Api256.encrypt`, `Api256.generateTransformKey`, `Api256.transform` functions now only take a private signing key and no longer need to provide a public signing key.

### Added

-   Added new `transformKeyToBytes` top level method to convert a `TransformKey` object into a Buffer in a consistent order. Useful for being able to sign over the bytes of a `TransformKey`.

### Changed

-   Updated to `recrypt-rs` 0.3.0.

## 0.2.0

### Breaking Changes

None

### Added

-   Added methods for [Schnorr signing](https://en.wikipedia.org/wiki/Schnorr_signature).
    -   `Api256::schnorrSign(privateKey: Buffer, publicKey: PublicKey, message: Buffer): Signature;`
    -   `Api256::schnorrVerify(publicKey: PublicKey, augmentedPrivateKey: Buffer | undefined, message: Buffer, signature: Signature): boolean;`
-   Exposed methods to perform ed25519 signing and verification as well as method to compute an ed25519 public key given it's matching private key.
    -   `Api256::ed25519Sign(privateKey: PrivateSigningKey, message: Buffer): Signature;`
    -   `Api256::ed25519Verify(publicKey: PublicSigningKey, message: Buffer, signature: Signature): boolean;`
    -   `Api256::computeEd25519PublicKey(privateKey: PrivateSigningKey): PublicSigningKey;`

### Changed

-   Consumed changes from [`recrypt-rs`](https://github.com/IronCoreLabs/recrypt-rs)([#1](https://github.com/IronCoreLabs/recrypt-rs/issues/1)) to zero secret bytes after use
-   Moved `benchmark` and `test` repos to the root of the repo

## 0.1.0

Initial open source release
