# Recrypt Node Binding

[![Build Status](https://travis-ci.org/IronCoreLabs/recrypt-node-binding.svg?branch=master)](https://travis-ci.org/IronCoreLabs/recrypt-node-binding)

Bindings to be able to use [Recrypt Rust](https://github.com/IronCoreLabs/recrypt-rs) from NodeJS code. Improves the performance of Recrypt operations by using native code.

## NodeJS Support

| Node 8 | Node 10 |
| ------ | ------- |
|    ✓   |    ✓    |

## Details

This library uses the [Neon Bindings](https://www.neon-bindings.com) toolchain to compile the [Recrypt Rust](https://github.com/IronCoreLabs/recrypt-rs) library into a binary NodeJS file that can be used from Node applications. The Neon Bindings provide a way to write a shim which converts data in/out of the [Recrypt Rust](https://github.com/IronCoreLabs/recrypt-rs) code. The resulting binary Node file can then be imported into a NodeJS module just like any other dependency.

## Getting Started

In order to build the binary Node file for Recrypt, you'll need the dependencies specified on the [Neon Bindings site](https://guides.neon-bindings.com/getting-started/). Follow their getting started directions and install Rust and the Node Build Tools. The Neon CLI is already installed as a dependecy of this project so you don't have to install that as a global dependency.

Once all of those dependencies are installed, the following can be run.

```
npm run compile
```
or
```
yarn run compile
```

This will produce an `index.node` file within the `native` directory. This file can then be included within a NodeJS file by simply requiring the file, e.g.

```
const recrypt = require('index.node');
```

## Types

This library contains [TypeScript definitions](index.d.ts) file which shows the available classes and methods.

## Benchmarks

+ From this repos root, run `npm i` or `yarn`.
+ Run `npm/yarn run compile` to compile the Rust source into a `native/index.node` module.
+ Run `npm/yarn run benchmark`.

## Unit Tests

+ From this repos root, run `npm i` or `yarn`.
+ Run `npm/yarn run compile` to compile the Rust source into a `native/index.node` module.
+ Run `npm/yarn run test`.

## Examples

The following examples show how to use this library from a NodeJS application

#### Basic Encrypt/Decrypt Example
```js
const assert = require("assert");
const Recrypt = require("index.node");

//Create a new Recrypt API instance
const Api256 = new Recrypt.Api256();

//Generate both a user key pair and a signing key pair
const keys = Api256.generateKeyPair();
const signingKeys = Api256.generateEd25519KeyPair();

//Generate a plaintext to encrypt
const plaintext = Api256.generatePlaintext();

//Encrypt the data to the public key and then attempt to decrypt with the private key
const encryptedValue = Api256.encrypt(plaintext, keys.publicKey, signingKeys.publicKey, signingKeys.privateKey);
const decryptedValue = Api256.decrypt(encryptedValue, keys.privateKey);

assert.equal(decryptedValue, plaintext);
```

#### Single-hop Transform Encryption Example
```js
const assert = require("assert");
const Recrypt = require("index.node");

//Create a new Recrypt API instance
const Api256 = new Recrypt.Api256();

//Generate both a user key pair and a signing key pair
const userKeys = Api256.generateKeyPair();
const signingKeys = Api256.generateEd25519KeyPair();

//Generate a plaintext to encrypt
const plaintext = Api256.generatePlaintext();

//Encrypt the data to the user public key
const encryptedValue = Api256.encrypt(plaintext, userKeys.publicKey, signingKeys.publicKey, signingKeys.privateKey);

//Generate a second public/private key pair as the target of the transform. This will allow the encrypted data to be
//transformed to this second key pair and allow it to be decrypted.
const deviceKeys = Api256.generateKeyPair();

//Generate a transform key from the user private key to the device public key
const userToDeviceTransformKey = Api256.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, signingKeys.publicKey, signingKeys.privateKey);

//Transform the encrypted data (without decrypting it!) so that it can be decrypted with the second key pair
const transformedEncryptedValue = Api256.transform(encryptedValue, userToDeviceTransformKey, signingKeys.publicKey, signingKeys.privateKey);

//Decrypt the data using the second private key
const decryptedValue = Api256.decrypt(transformedEncryptedValue, deviceKeys.privateKey);

assert.equal(decryptedValue, plaintext);
```
