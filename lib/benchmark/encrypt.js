const crypto = require("crypto");
const Benchmark = require("benchmark");
const recrypt = require("../../native/index.node");

const api = new recrypt.Api256();

let plaintext, toPublicKey;

function onCycle() {
    plaintext = api.generatePlaintext();
    toPublicKey = api.generateKeyPair().publicKey;
}
onCycle();
module.exports = new Benchmark("encrypt", {
    fn: () => {
        api.encrypt(plaintext, toPublicKey, crypto.randomBytes(32), crypto.randomBytes(64));
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
