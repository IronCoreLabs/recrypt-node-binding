const Benchmark = require("benchmark");
const recrypt = require("../../native/index.node");

const api = new recrypt.Api256();

module.exports = new Benchmark("generateKeyPair", {
    fn: () => {
        api.generateKeyPair();
    },
    onError: (err) => {
        console.log(err);
    },
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
