const Benchmark = require("benchmark");
const recrypt = require("../index.js");

const api = new recrypt.Api256();

const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

let fromPrivateKey = api.generateKeyPair().privateKey;
let toPublicKey = api.generateKeyPair().publicKey;
module.exports = new Benchmark("generateTransformKey", {
    fn: () => {
        api.generateTransformKey(fromPrivateKey, toPublicKey, privateSigningKey);
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
