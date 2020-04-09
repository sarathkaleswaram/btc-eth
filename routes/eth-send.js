const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
var server = require('../server')

var ethSend = async function (req, res) {
    try {
        console.log('\nethSend body:', req.body)
        var web3 = server.web3
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var account

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            console.log('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!web3.utils.isAddress(sourceAddress)) {
            console.log('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!web3.utils.isAddress(destinationAddress)) {
            console.log('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = web3.eth.accounts.privateKeyToAccount(privateKey)
        } catch (error) {
            console.log('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }
        try {
            amount = parseFloat(amount)
        } catch (error) {
            console.error('Invalid amount')
            res.json({
                result: 'error',
                message: 'Invalid amount',
            })
            return
        }

        var nonce = await web3.eth.getTransactionCount(sourceAddress)
        web3.eth.getBalance(sourceAddress, async (error, result) => {
            if (error) {
                console.error(error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            let balance = web3.utils.fromWei(result, 'ether')
            console.log('Source Account Balance: ', balance + ' ETH')
            console.log(balance, ' < ', amount)
            if (parseFloat(balance) < amount) {
                console.log('Insufficient funds')
                res.json({
                    result: 'error',
                    message: 'Insufficient funds',
                })
                return
            }

            getCurrentGasPrices(res, function (gasPrices) {
                let details = {
                    'to': destinationAddress,
                    'value': web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether')),
                    'gas': 21000,
                    'gasPrice': gasPrices.low * 1000000000,
                    'nonce': nonce,
                    'chainId': getChainId()
                }

                const transaction = new EthereumTx(details, { chain: server.ethNetwork })
                var privateKeySplit = privateKey.split('0x')
                try {
                    var privateKeyHex = Buffer.from(privateKeySplit[1], 'hex')
                    transaction.sign(privateKeyHex)
                } catch (error) {
                    console.log('Failed to sign Transaction')
                    console.error(error)
                    res.json({
                        result: 'error',
                        message: 'Failed to sign Transaction',
                    })
                    return                    
                }

                const serializedTransaction = transaction.serialize()
                web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
                    if (err) {
                        console.log(err)
                        res.json({
                            result: 'error',
                            message: err,
                        })
                        return
                    }
                    var subdomain = server.ethNetwork === 'mainnet' ? '' : server.ethNetwork + '.'
                    const url = `https://${subdomain}etherscan.io/tx/${id}`
                    console.log({ transactionHash: id, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: id,
                        link: url
                    })
                })
            })
        })
    } catch (error) {
        console.error('ethSend catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

function getCurrentGasPrices(res, callback) {
    request({
        url: 'https://ethgasstation.info/json/ethgasAPI.json',
        json: true
    }, function (error, response, body) {
        if (error || !body.safeLow || !body.average || !body.fast) {
            console.error('Failed to get fees')
            res.json({
                result: 'error',
                message: 'Failed to get fees',
            })
            return
        }
        let prices = {
            low: body.safeLow / 10,
            medium: body.average / 10,
            high: body.fast / 10
        }
        callback(prices)
    })
}

function getChainId() {
    switch (server.network) {
        case 'mainnet':
            return 1
        case 'kovan':
            return 2
        case 'ropsten':
            return 3
        case 'rinkeby':
            return 4
        case 'goerli':
            return 5
        default:
            return 3
    }
}

module.exports = ethSend
