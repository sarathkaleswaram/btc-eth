const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/605567f94946494a81e52ac8ca2784de"));

var account = web3.eth.accounts.create();
console.log({ address: account.address, privateKey: account.privateKey });