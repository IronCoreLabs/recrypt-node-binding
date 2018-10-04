const Benchmark = require("benchmark");
const recrypt = require("../native/index.node");

const api = new recrypt.Api256();

module.exports = new Benchmark("generateEd25519KeyPair", {
    fn: () => {
        api.generateEd25519KeyPair();
    },
    onError: (err) => {
        console.log(err);
    },
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
