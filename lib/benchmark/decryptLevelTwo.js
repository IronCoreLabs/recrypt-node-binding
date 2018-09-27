const Benchmark = require("benchmark");
const recrypt = require("../../native/index.node");
//Randomly generated legit ED25519 keypair
//prettier-ignore
const publicSigningKey = Buffer.from([138, 136, 227, 221, 116, 9, 241, 149, 253, 82, 219, 45, 60, 186, 93, 114, 202, 103, 9, 191, 29, 148, 18, 27, 243, 116, 136, 1, 180, 15, 111, 92]);
//prettier-ignore
const privateSigningKey = Buffer.from([88, 232, 110, 251, 117, 250, 78, 44, 65, 15, 70, 225, 109, 233, 246, 172, 174, 26, 23, 3, 82, 134, 81, 182, 155, 193, 118, 192, 136, 190, 243, 110, 177, 122, 42, 44, 243, 212, 164, 26, 142, 78, 24, 204, 69, 200, 101, 109, 85, 142, 206, 221, 176, 173, 180, 107, 250, 8, 138, 95, 83, 190, 210, 82]);

const api = new recrypt.Api256();

let devicePrivateKey, lvl2EncryptedValue;

function onCycle() {
    const plaintext = api.generatePlaintext();
    const groupKeys = api.generateKeyPair();
    const userKeys = api.generateKeyPair();
    const deviceKeys = api.generateKeyPair();
    devicePrivateKey = deviceKeys.privateKey;

    const groupToUserTransform = api.generateTransformKey(groupKeys.privateKey, userKeys.publicKey, publicSigningKey, privateSigningKey);
    const userToDeviceTransform = api.generateTransformKey(userKeys.privateKey, deviceKeys.publicKey, publicSigningKey, privateSigningKey);

    const lvl0EncryptedValue = api.encrypt(plaintext, groupKeys.publicKey, publicSigningKey, privateSigningKey);
    const lvl1EncryptedValue = api.transform(lvl0EncryptedValue, groupToUserTransform, publicSigningKey, privateSigningKey);
    lvl2EncryptedValue = api.transform(lvl1EncryptedValue, userToDeviceTransform, publicSigningKey, privateSigningKey);
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
