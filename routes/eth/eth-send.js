const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
var server = require('../../server')
const { logger } = require('../../utils/logger')

var ethSend = async function (req, res) {
    try {
        logger.debug('ethSend body:', req.body)
        var web3 = server.web3
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var gas = req.body.gas
        var account

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!web3.utils.isAddress(sourceAddress)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!web3.utils.isAddress(destinationAddress)) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = web3.eth.accounts.privateKeyToAccount(privateKey)
        } catch (error) {
            logger.error('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }
        try {
            amount = parseFloat(amount)
        } catch (error) {
            logger.error('Invalid amount')
            res.json({
                result: 'error',
                message: 'Invalid amount',
            })
            return
        }
        if (gas && typeof gas !== 'string') {
            logger.error('Invalid gas value')
            res.json({
                result: 'error',
                message: 'Invalid gas value. Pass as string',
            })
            return
        }

        var nonce = await web3.eth.getTransactionCount(sourceAddress)
        web3.eth.getBalance(sourceAddress, async (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            let balance = web3.utils.fromWei(result ? result.toString() : '', 'ether')
            logger.verbose('Source Account Balance: ' + balance + ' ETH')
            logger.verbose(balance + ' < ' + amount)
            if (parseFloat(balance) < amount) {
                logger.error('Insufficient funds')
                res.json({
                    result: 'error',
                    message: 'Insufficient funds',
                })
                return
            }

            getCurrentGasPrices(res, gas, function (gasPrice) {
                let details = {
                    'to': destinationAddress,
                    'value': web3.utils.toHex(web3.utils.toWei(amount.toString(), 'ether')),
                    'gas': 21000,
                    // 'gasPrice': gasPrices.low * 1000000000,
                    'gasPrice': web3.utils.toHex(web3.utils.toWei(gasPrice, 'ether')),
                    'nonce': nonce,
                    'chainId': getChainId()
                }

                const transaction = new EthereumTx(details, { chain: server.ethNetwork })
                var privateKeySplit = privateKey.split('0x')
                try {
                    var privateKeyHex = Buffer.from(privateKeySplit[1], 'hex')
                    transaction.sign(privateKeyHex)
                } catch (error) {
                    logger.error('Failed to sign Transaction')
                    logger.error('Error: ' + error)
                    res.json({
                        result: 'error',
                        message: 'Failed to sign Transaction',
                    })
                    return
                }

                const serializedTransaction = transaction.serialize()
                web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
                    if (error) {
                        logger.error('Error: ' + error)
                        res.json({
                            result: 'error',
                            message: error.toString(),
                        })
                        return
                    }
                    const url = `${server.etherscanExplorerUrl}/tx/${id}`
                    logger.verbose('Send Tx', { transactionHash: id, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: id,
                        link: url
                    })
                })
            })
        })
    } catch (error) {
        logger.error('ethSend catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getCurrentGasPrices(res, gas, callback) {
    if (gas) {
        callback(gas.toString())
        return
    }
    request({
        url: `http://localhost:${server.port}/eth/fees`,
        json: true
    }, function (error, response, body) {
        try {
            if (error || body.result === 'error') {
                logger.error('Failed to get fees')
                res.json({
                    result: 'error',
                    message: 'Failed to get fees',
                })
                return
            }
            callback(body.fees[server.defaultFees])
        } catch (error) {
            logger.error('Error: ' + error)
            res.json({
                result: 'error',
                message: error.toString(),
            })
        }
    })
}

// function getCurrentGasPrices(res, callback) {
//     request({
//         url: 'https://ethgasstation.info/json/ethgasAPI.json',
//         json: true
//     }, function (error, response, body) {
//         try {
//             if (error || !body.safeLow || !body.average || !body.fast) {
//                 logger.error('Failed to get fees')
//                 res.json({
//                     result: 'error',
//                     message: 'Failed to get fees',
//                 })
//                 return
//             }
//             let prices = {
//                 low: body.safeLow / 10,
//                 medium: body.average / 10,
//                 high: body.fast / 10
//             }
//             callback(prices)
//         } catch (error) {
//             logger.error('Error: ' + error)
//             res.json({
//                 result: 'error',
//                 message: error.toString(),
//             })
//         }
//     })
// }

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
