# Recrypt Node Binding

[![Build Status](https://travis-ci.org/IronCoreLabs/recrypt-node-binding.svg?branch=master)](https://travis-ci.org/IronCoreLabs/recrypt-node-binding)
[![NPM Version](https://badge.fury.io/js/%40ironcorelabs%2Frecrypt-node-binding.svg)](https://www.npmjs.com/package/@ironcorelabs/recrypt-node-binding)

Bindings to be able to use [Recrypt Rust](https://github.com/IronCoreLabs/recrypt-rs) from NodeJS code. Improves the performance of Recrypt operations by using native code.

This library uses the [Neon Bindings](https://www.neon-bindings.com) toolchain to compile the [Recrypt Rust](https://github.com/IronCoreLabs/recrypt-rs) library into a binary NodeJS file that can be used from Node applications. The Neon Bindings provide a way to write a shim which converts data in/out of the [Recrypt Rust](https://github.com/IronCoreLabs/recrypt-rs) code. The resulting binary Node file can then be included into a NodeJS module just like any other NPM dependency.

## Supported Platforms

|           | Node 8 | Node 10 | Node 12 |
| --------- | ------ | ------- | ------  |
| Linux x64 |    ✓   |    ✓    |    ✓    |
| OSX x64   |    ✓   |    ✓    |    ✓    |

## Install

```
npm install @ironcorelabs/recrypt-node-binding
```

The binary that is generated via the Neon Bindings toolchain is platform specific. We use the [`node-pre-gyp`](https://github.com/mapbox/node-pre-gyp) tool to pre-compile binaries for the most [popular platforms](https://github.com/IronCoreLabs/recrypt-node-binding#supported-platforms). When you `npm install` this library it will automatically pull down the proper binary for your platform from the binaries uploaded to the [releases page](https://github.com/IronCoreLabs/recrypt-node-binding/releases).

This means that you'll need to make sure that the machine that runs `npm install` is the machine where the code will run. This library will not work if you run `npm install` on an OSX machine and move the `node_modules` directory over to a Linux machine, for example.

If the machine you run `npm install` on is not one of the supported architectures you will get an install failure. If there's an architecture that you'd like supported that isn't yet available, [open a new issue](https://github.com/IronCoreLabs/recrypt-node-binding/issues/new) and we'll look into adding support for it. You can also build the bindings yourself to generate a binary file for whichever architecture you need. Refer to the [local development section](https://github.com/IronCoreLabs/recrypt-node-binding#local-development) for details.

## Types

This library contains a [TypeScript definitions](index.d.ts) file which shows the available classes and methods.

## Examples

The following examples show how to use this library from a NodeJS application

#### Basic Encrypt/Decrypt Example
```js
const assert = require("assert");
const Recrypt = require("@ironcorelabs/recrypt-node-binding");

//Create a new Recrypt API instance
const Api256 = new Recrypt.Api256();

//Generate both a user key pair and a signing key pair
const keys = Api256.generateKeyPair();
const signingKeys = Api256.generateEd25519KeyPair();

//Generate a plaintext to encrypt
const plaintext = Api256.generatePlaintext();

//Encrypt the data to the public key and then attempt to decrypt with the private key
const encryptedValue = Api256.encrypt(plaintext, keys.publicKey, signingKeys.privateKey);
const decryptedValue = Api256.decrypt(encryptedValue, keys.privateKey);

assert.equal(decryptedValue, plaintext);
```

#### Single-hop Transform Encryption Example
```js
const assert = require("assert");
const Recrypt = require("@ironcorelabs/recrypt-node-binding");

//Create a new Recrypt API instance
const Api256 = new Recrypt.Api256();

//Generate both a user key pair and a signing key pair
const userKeys = Api256.generateKeyPair();
const signingKeys = Api256.generateEd25519KeyPair();

//Generate a plaintext to encrypt
const plaintext = Api256.generatePlaintext();

//Encrypt the data to the user public key
const encryptedValue = Api256.encrypt(plaintext, userKeys.publicKey, signingKeys.privateKey);

//Generate a second public/private key pair as the target of the transform. This will allow the encrypted data to be
//transformed to this second key pair and allow it to be decrypted.
const deviceKeys = Api256.generateKeyPair();

//Generate a transform key from the user private key to the device public key
const userToDeviceTransformKey = Api256.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, signingKeys.privateKey);

//Transform the encrypted data (without decrypting it!) so that it can be decrypted with the second key pair
const transformedEncryptedValue = Api256.transform(encryptedValue, userToDeviceTransformKey, signingKeys.privateKey);

//Decrypt the data using the second private key
const decryptedValue = Api256.decrypt(transformedEncryptedValue, deviceKeys.privateKey);

assert.equal(decryptedValue, plaintext);
```

## Local Development

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

### Benchmarks

+ From this repos root, run `npm i` or `yarn`.
+ Run `npm/yarn run compile` to compile the Rust source into a `native/index.node` module.
+ Run `npm/yarn run benchmark`.

### Unit Tests

+ From this repos root, run `npm i` or `yarn`.
+ Run `npm/yarn run compile` to compile the Rust source into a `native/index.node` module.
+ Run `npm/yarn run test`.

Copyright (c)  2018-present  IronCore Labs, Inc.
All rights reserved.
