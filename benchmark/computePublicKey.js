const Benchmark = require("benchmark");
const recrypt = require("../index.node");

const api = new recrypt.Api256();

let keypair;

function onCycle() {
    keypair = api.generateKeyPair();
}
onCycle();
module.exports = new Benchmark("computePublicKey", {
    fn: () => {
        api.computePublicKey(keypair.privateKey);
    },
    onError: (err) => {
        console.log(err);
    },
    onCycle,
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
