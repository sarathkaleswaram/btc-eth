const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var maticSend = async function (req, res) {
    try {
        var polygonWeb3 = server.polygonWeb3
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var gas = req.body.gas
        var account

        logger.debug('maticSend sourceAddress: '+ sourceAddress + " destinationAddress: " + destinationAddress + " amount: " + amount + " gas: " + gas)

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!polygonWeb3.utils.isAddress(sourceAddress)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!polygonWeb3.utils.isAddress(destinationAddress)) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = polygonWeb3.eth.accounts.privateKeyToAccount(privateKey)
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

        // var nonce = await polygonWeb3.eth.getTransactionCount(sourceAddress)
        polygonWeb3.eth.getBalance(sourceAddress, async (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            let balance = polygonWeb3.utils.fromWei(result ? result.toString() : '', 'ether')
            logger.verbose('Source Account Balance: ' + balance + ' MATIC')
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
                    'value': polygonWeb3.utils.toHex(polygonWeb3.utils.toWei(amount.toString(), 'ether')),
                    'gas': 21000,
                    // 'gasPrice': gasPrices.low * 1000000000,
                    'gasPrice': polygonWeb3.utils.toHex(polygonWeb3.utils.toWei(gasPrice, 'ether')),
                    // 'nonce': nonce,
                    'chainId': getChainId()
                }

                const transaction = new EthereumTx(details, { chain: server.polygonNetwork })
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
                polygonWeb3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
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
            return

            getCurrentGasPrices(res, gas, function (gasPrice) {
                let details = {
                    'to': destinationAddress,
                    'value': polygonWeb3.utils.toHex(polygonWeb3.utils.toWei(amount.toString(), 'ether')),
                    // gas or gasLimit
                    'gas': 100000,
                    // 'gasPrice': getGasPrice(),
                    'gasPrice': polygonWeb3.utils.toHex(polygonWeb3.utils.toWei(gasPrice, 'ether')),
                    // 'nonce': nonce
                }
    
                const common = Common.default.forCustomChain('mainnet', {
                    name: 'matic',
                    networkId: getChainId(),
                    chainId: getChainId()
                }, 'petersburg')
    
                const transaction = new EthereumTx(details, { common })
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
                polygonWeb3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
                    if (error) {
                        logger.error('Error: ' + error)
                        res.json({
                            result: 'error',
                            message: error.toString(),
                        })
                        return
                    }
                    const url = `${server.polygonscanExplorerUrl}/tx/${id}`
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
        logger.error('maticSend catch Error:', error)
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
    if (server.network !== 'mainnet') {
        // testnet need 10 Gwei minimum
        callback('0.00000001')
        return
    }
    request({
        url: `http://localhost:${server.port}/matic/fees`,
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

function getChainId() {
    switch (server.network) {
        case 'mainnet':
            return 137
        default:
            return 80001
    }
}

module.exports = maticSend
