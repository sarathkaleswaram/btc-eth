const Web3 = require("web3");
const EthereumTx = require('ethereumjs-tx').Transaction;
const axios = require('axios');
const network = 'ropsten'; // mainnet, ropsten, rinkeby
const infuraApiKey = '605567f94946494a81e52ac8ca2784de';
const ethNetwork = `https://${network}.infura.io/v3/${infuraApiKey}`;
const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));

// Sender Details
var fromAddress = "0x1bdE485751FC4552e9d727f22038945D3D2ddaD9";
var fromPrivateKey = "0x83fad48f97e40e445ee86d8efcb4c7b110afe196d4602946f56dfb0492b189ba";
// Send Ether Amount
var sendAmount = 0.10;
// Receiver Details
var toAddress = "0xe75F5C9C9177fC3553Db4332F419b91d2A3D6Edc";


async function transferFund(sendersData, receiverData, amountToSend) {
    return new Promise(async (resolve, reject) => {
        var nonce = await web3.eth.getTransactionCount(sendersData.address);
        web3.eth.getBalance(sendersData.address, async (err, result) => {
            if (err) {
                return reject();
            }
            let balance = web3.utils.fromWei(result, "ether");
            console.log("From Account Balance: ", balance + " ETH");
            if (balance < amountToSend) {
                console.log('insufficient funds');
                return reject();
            }

            let gasPrices = await getCurrentGasPrices();
            let details = {
                "to": receiverData.address,
                "value": web3.utils.toHex(web3.utils.toWei(amountToSend.toString(), 'ether')),
                "gas": 21000,
                "gasPrice": gasPrices.low * 1000000000,
                "nonce": nonce,
                "chainId": getChainId()
            };

            const transaction = new EthereumTx(details, { chain: network });
            let privateKey = sendersData.privateKey.split('0x');
            let privKey = Buffer.from(privateKey[1], 'hex');
            transaction.sign(privKey);

            const serializedTransaction = transaction.serialize();

            web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
                if (err) {
                    console.log(err);
                    return reject();
                }
                const url = `https://${network}.etherscan.io/tx/${id}`;
                resolve({ transactionHash: id, link: url });
            });
        });
    });
}

async function getCurrentGasPrices() {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    let prices = {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10
    };
    return prices;
}

function getChainId() {
    switch (network) {
        case 'mainnet':
            return 1;
        case 'kovan':
            return 2;
        case 'ropsten':
            return 3;
        case 'rinkeby':
            return 4;
        case 'goerli':
            return 5;
        default:
            return 3;
    }
}

transferFund({ address: fromAddress, privateKey: fromPrivateKey }, { address: toAddress }, sendAmount)
    .then(data => console.log(data))
    .catch(error => console.error(error));