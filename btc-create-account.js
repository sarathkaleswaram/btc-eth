var bitcoin = require("bitcoinjs-lib");

const keyPair = bitcoin.ECPair.makeRandom();
const privateKey = keyPair.toWIF();
const publicKey = keyPair.publicKey.toString("hex");
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

console.log({ address: address, publicKey: publicKe, privateKey: privateKeyy });