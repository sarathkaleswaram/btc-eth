const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/v3/605567f94946494a81e52ac8ca2784de"));

var privateKey = "0x83fad48f97e40e445ee86d8efcb4c7b110afe196d4602946f56dfb0492b189ba"

var account = web3.eth.accounts.privateKeyToAccount(privateKey);
console.log({ address: account.address, privateKey: account.privateKey });