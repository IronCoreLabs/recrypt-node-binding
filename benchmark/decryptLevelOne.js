const Benchmark = require("benchmark");
const recrypt = require("../native/index.node");
//Randomly generated legit ED25519 keypair
const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

const api = new recrypt.Api256();

let devicePrivateKey, lvl1EncryptedValue;

function onCycle() {
    const plaintext = api.generatePlaintext();
    const userKeys = api.generateKeyPair();
    const deviceKeys = api.generateKeyPair();
    devicePrivateKey = deviceKeys.privateKey;
    const transformKey = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);

    const lvl0EncryptedValue = api.encrypt(plaintext, userKeys.publicKey, privateSigningKey);
    lvl1EncryptedValue = api.transform(lvl0EncryptedValue, transformKey, privateSigningKey);
}
onCycle();
module.exports = new Benchmark("decryptLevel1", {
    fn: () => {
        api.decrypt(lvl1EncryptedValue, devicePrivateKey);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
