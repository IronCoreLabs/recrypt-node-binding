const Benchmark = require("benchmark");
const recrypt = require("../index.js");

const api = new recrypt.Api256();

let plaintext;

function onCycle() {
    plaintext = api.generatePlaintext();
}
onCycle();
module.exports = new Benchmark("deriveSymmetricKey", {
    fn: () => {
        api.deriveSymmetricKey(plaintext);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
