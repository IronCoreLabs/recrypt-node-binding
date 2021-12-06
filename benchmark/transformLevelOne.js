const Benchmark = require("benchmark");
const recrypt = require("../index.node");
//Randomly generated legit ED25519 keypair
const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

const api = new recrypt.Api256();

let lvl0EncryptedValue, userToDeviceTransform;

function onCycle() {
    const userKeys = api.generateKeyPair();
    const deviceKeys = api.generateKeyPair();
    lvl0EncryptedValue = api.encrypt(api.generatePlaintext(), userKeys.publicKey, privateSigningKey);
    userToDeviceTransform = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);
}
onCycle();
module.exports = new Benchmark("transformLevelOne", {
    fn: () => {
        api.transform(lvl0EncryptedValue, userToDeviceTransform, privateSigningKey);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
