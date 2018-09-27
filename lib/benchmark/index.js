const generateKeyPair = require("./generateKeyPair");
const generateEd25519KeyPair = require("./generateEd25519KeyPair");
const generatePlaintext = require("./generatePlaintext");
const generateTransformKey = require("./generateTransformKey");
const computePublicKey = require("./computePublicKey");
const deriveSymmetricKey = require("./deriveSymmetricKey");
const encrypt = require("./encrypt");
const transformLevelOne = require("./transformLevelOne");
const transformLevelTwo = require("./transformLevelTwo");
const decryptLevelZero = require("./decryptLevelZero");
const decryptLevelOne = require("./decryptLevelOne");
const decryptLevelTwo = require("./decryptLevelTwo");

generateKeyPair.on("complete", () => {
    generateEd25519KeyPair.run({async: true});
});

generateEd25519KeyPair.on("complete", () => {
    generatePlaintext.run({async: true});
});

generatePlaintext.on("complete", () => {
    generateTransformKey.run({async: true});
});

generateTransformKey.on("complete", () => {
    computePublicKey.run({async: true});
});

computePublicKey.on("complete", () => {
    deriveSymmetricKey.run({async: true});
});

deriveSymmetricKey.on("complete", () => {
    encrypt.run({async: true});
});

encrypt.on("complete", () => {
    transformLevelOne.run({async: true});
});

transformLevelOne.on("complete", () => {
    transformLevelTwo.run({async: true});
});

transformLevelTwo.on("complete", () => {
    decryptLevelZero.run({async: true});
});

decryptLevelZero.on("complete", () => {
    decryptLevelOne.run({async: true});
});

decryptLevelOne.on("complete", () => {
    decryptLevelTwo.run({async: true});
});

generateKeyPair.run({async: true});
