const Benchmark = require("benchmark");
const recrypt = require("../native/index.node");
//Randomly generated legit ED25519 keypair
const privateSigningKey = Buffer.from("O7f2FYsabKOFj3enK+HQ+cBmTMbAG6aCesd1nLcFM1wtA9XHg0+rFIVA7+nomADjEbJ1R/Gd+xHBO79UnLqxDQ==", "base64");

const api = new recrypt.Api256();

let devicePrivateKey, lvl2EncryptedValue;

function onCycle() {
    const plaintext = api.generatePlaintext();
    const groupKeys = api.generateKeyPair();
    const userKeys = api.generateKeyPair();
    const deviceKeys = api.generateKeyPair();
    devicePrivateKey = deviceKeys.privateKey;

    const groupToUserTransform = api.generateTransformKey(groupKeys.privateKey, userKeys.publicKey, privateSigningKey);
    const userToDeviceTransform = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, privateSigningKey);

    const lvl0EncryptedValue = api.encrypt(plaintext, groupKeys.publicKey, privateSigningKey);
    const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, groupToUserTransform, privateSigningKey);
    lvl2EncryptedValue = api.transform(lvl1EncryptedValue, userToDeviceTransform, privateSigningKey);
}
onCycle();
module.exports = new Benchmark("decryptLevel2", {
    fn: () => {
        api.decrypt(lvl2EncryptedValue, devicePrivateKey);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
