const crypto = require("crypto");
const Benchmark = require("benchmark");
const recrypt = require("../../native/index.node");

const api = new recrypt.Api256();

let fromPrivateKey = api.generateKeyPair().privateKey;
let toPublicKey = api.generateKeyPair().publicKey;
module.exports = new Benchmark("generateTransformKey", {
    fn: () => {
        api.generateTransformKey(fromPrivateKey, toPublicKey, crypto.randomBytes(32), crypto.randomBytes(64));
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle: () => {
        fromPrivateKey = api.generateKeyPair().privateKey;
        toPublicKey = api.generateKeyPair().publicKey;
    },
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
