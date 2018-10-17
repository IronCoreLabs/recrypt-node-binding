const Benchmark = require("benchmark");
const recrypt = require("../native/index.node");
//Randomly generated legit ED25519 keypair
const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

const api = new recrypt.Api256();

let privateKey, lvl0EncryptedValue;

function onCycle() {
    const plaintext = api.generatePlaintext();
    const keys = api.generateKeyPair();
    privateKey = keys.privateKey;
    lvl0EncryptedValue = api.encrypt(plaintext, keys.publicKey, privateSigningKey);
}
onCycle();
module.exports = new Benchmark("decryptLevel0", {
    fn: () => {
        api.decrypt(lvl0EncryptedValue, privateKey);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
