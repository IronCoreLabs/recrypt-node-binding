const Benchmark = require("benchmark");
const recrypt = require("../index.js");

const api = new recrypt.Api256();

module.exports = new Benchmark("generatePlaintext", {
    fn: () => {
        api.generatePlaintext();
    },
    onError: (err) => {
        console.log(err);
    },
    onComplete: (result) => {
        console.log(result.currentTarget.toString());
    },
});
