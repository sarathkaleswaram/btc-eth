// cQNmJ6yuu3Z3UBjsxwbpUDX7FKEYi2E6X7oiGzvraEd9ErX6BCw4 

const bitcoin = require('bitcoinjs-lib');

const keyPair = bitcoin.ECPair.fromWIF("L1Kzcyy88LyckShYdvoLFg1FYpB5ce1JmTYtieHrhkN65GhVoq73");
const privateKey = keyPair.toWIF();
const publicKey = keyPair.publicKey.toString("hex");
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

console.log({ address: address, publicKey: publicKey, privateKey: privateKey });