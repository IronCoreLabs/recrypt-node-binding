const Benchmark = require("benchmark");
const recrypt = require("../index.js");

const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

const api = new recrypt.Api256();

let plaintext, toPublicKey;

function onCycle() {
    plaintext = api.generatePlaintext();
    toPublicKey = api.generateKeyPair().publicKey;
}
onCycle();
module.exports = new Benchmark("encrypt", {
    fn: () => {
        api.encrypt(plaintext, toPublicKey, privateSigningKey);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
