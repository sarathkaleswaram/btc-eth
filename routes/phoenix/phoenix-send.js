const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var phoenixSend = async function (req, res) {
    try {
        var phoenixWeb3 = server.phoenixWeb3
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var gas = req.body.gas
        var account

        logger.debug('phoenixSend sourceAddress: '+ sourceAddress + " destinationAddress: " + destinationAddress + " amount: " + amount + " gas: " + gas)

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!phoenixWeb3.utils.isAddress(sourceAddress)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!phoenixWeb3.utils.isAddress(destinationAddress)) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = phoenixWeb3.eth.accounts.privateKeyToAccount(privateKey)
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

        var nonce = await phoenixWeb3.eth.getTransactionCount(sourceAddress)
        phoenixWeb3.eth.getBalance(sourceAddress, async (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            let balance = phoenixWeb3.utils.fromWei(result ? result.toString() : '', 'ether')
            logger.verbose('Source Account Balance: ' + balance + ' PHOENIX')
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
                    'value': phoenixWeb3.utils.toHex(phoenixWeb3.utils.toWei(amount.toString(), 'ether')),
                    // gas or gasLimit
                    'gas': 100000,
                    // 'gasPrice': getGasPrice(),
                    'gasPrice': phoenixWeb3.utils.toHex(phoenixWeb3.utils.toWei(gasPrice, 'ether')),
                    'nonce': nonce
                }
    
                const common = Common.default.forCustomChain('mainnet', {
                    name: 'phoenix',
                    networkId: 13381,
                    chainId: 13381
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
                phoenixWeb3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
                    if (error) {
                        logger.error('Error: ' + error)
                        res.json({
                            result: 'error',
                            message: error.toString(),
                        })
                        return
                    }
                    const url = `${server.phoenixExplorerUrl}/tx/${id}`
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
        logger.error('phoenixSend catch Error:', error)
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
        url: `http://localhost:${server.port}/phoenix/fees`,
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

module.exports = phoenixSend
