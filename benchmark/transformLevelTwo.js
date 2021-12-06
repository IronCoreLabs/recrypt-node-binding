const Benchmark = require("benchmark");
const recrypt = require("../index.node");
//Randomly generated legit ED25519 keypair
const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

const api = new recrypt.Api256();

let groupToUserTransform, userToDeviceTransform, lvl0EncryptedValue;

function onCycle() {
    const groupKeys = api.generateKeyPair();
    const userKeys = api.generateKeyPair();
    const deviceKeys = api.generateKeyPair();
    lvl0EncryptedValue = api.encrypt(api.generatePlaintext(), userKeys.publicKey, privateSigningKey);
    groupToUserTransform = api.generateTransformKey(groupKeys.privateKey, userKeys.publicKey, privateSigningKey);
    userToDeviceTransform = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);
}
onCycle();
module.exports = new Benchmark("transformLevelTwo", {
    fn: () => {
        const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, groupToUserTransform, privateSigningKey);
        api.transform(lvl1EncryptedValue, userToDeviceTransform, privateSigningKey);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
