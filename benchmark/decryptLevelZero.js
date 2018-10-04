const Benchmark = require("benchmark");
const recrypt = require("../native/index.node");
//Randomly generated legit ED25519 keypair
//prettier-ignore
const publicSigningKey = Buffer.from([138, 136, 227, 221, 116, 9, 241, 149, 253, 82, 219, 45, 60, 186, 93, 114, 202, 103, 9, 191, 29, 148, 18, 27, 243, 116, 136, 1, 180, 15, 111, 92]);
//prettier-ignore
const privateSigningKey = Buffer.from([88, 232, 110, 251, 117, 250, 78, 44, 65, 15, 70, 225, 109, 233, 246, 172, 174, 26, 23, 3, 82, 134, 81, 182, 155, 193, 118, 192, 136, 190, 243, 110, 177, 122, 42, 44, 243, 212, 164, 26, 142, 78, 24, 204, 69, 200, 101, 109, 85, 142, 206, 221, 176, 173, 180, 107, 250, 8, 138, 95, 83, 190, 210, 82]);

const api = new recrypt.Api256();

let privateKey, lvl0EncryptedValue;

function onCycle() {
    const plaintext = api.generatePlaintext();
    const keys = api.generateKeyPair();
    privateKey = keys.privateKey;
    lvl0EncryptedValue = api.encrypt(plaintext, keys.publicKey, publicSigningKey, privateSigningKey);
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
