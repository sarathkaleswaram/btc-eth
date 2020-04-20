const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
var server = require('../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var ethSend = async function (req, res) {
    try {
        logger.debug('\nethSend body:', req.body)
        var web3 = server.web3
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var account

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.debug('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!web3.utils.isAddress(sourceAddress)) {
            logger.debug('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!web3.utils.isAddress(destinationAddress)) {
            logger.debug('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = web3.eth.accounts.privateKeyToAccount(privateKey)
        } catch (error) {
            logger.debug('Invalid PrivateKey')
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

        var nonce = await web3.eth.getTransactionCount(sourceAddress)
        web3.eth.getBalance(sourceAddress, async (error, result) => {
            if (error) {
                logger.error(error)
                res.json({
                    result: 'error',
                    message: error,
                })
                return
            }
            let balance = web3.utils.fromWei(result, 'ether')
            logger.debug('Source Account Balance: ', balance + ' ETH')
            logger.debug(balance, ' < ', amount)
            if (parseFloat(balance) < amount) {
                logger.debug('Insufficient funds')
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
                    logger.debug('Failed to sign Transaction')
                    logger.error(error)
                    res.json({
                        result: 'error',
                        message: 'Failed to sign Transaction',
                    })
                    return                    
                }

                const serializedTransaction = transaction.serialize()
                web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
                    if (err) {
                        logger.debug(err)
                        res.json({
                            result: 'error',
                            message: err,
                        })
                        return
                    }
                    const url = `${server.etherscanExplorerUrl}/tx/${id}`
                    logger.debug({ transactionHash: id, link: url })
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
            logger.error('Failed to get fees')
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
