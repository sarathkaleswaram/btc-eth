const Web3 = require("web3");
const network = 'ropsten'; // mainnet, ropsten, rinkeby
const infuraApiKey = '605567f94946494a81e52ac8ca2784de';
const ethNetwork = `https://${network}.infura.io/v3/${infuraApiKey}`;
const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));

var address = "0x1bdE485751FC4552e9d727f22038945D3D2ddaD9";

web3.eth.getBalance(address, async (err, result) => {
    if (err) console.error(err);
    console.log(web3.utils.fromWei(result, "ether") + " ETH");
});
