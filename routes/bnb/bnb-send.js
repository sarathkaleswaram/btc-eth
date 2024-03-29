const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var bnbSend = async function (req, res) {
    try {
        var bscWeb3 = server.bscWeb3
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var gas = req.body.gas
        var account

        logger.debug('bnbSend sourceAddress: '+ sourceAddress + " destinationAddress: " + destinationAddress + " amount: " + amount + " gas: " + gas)

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!bscWeb3.utils.isAddress(sourceAddress)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!bscWeb3.utils.isAddress(destinationAddress)) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = bscWeb3.eth.accounts.privateKeyToAccount(privateKey)
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

        var nonce = await bscWeb3.eth.getTransactionCount(sourceAddress)
        bscWeb3.eth.getBalance(sourceAddress, async (error, result) => {
            if (error) {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            }
            let balance = bscWeb3.utils.fromWei(result ? result.toString() : '', 'ether')
            logger.verbose('Source Account Balance: ' + balance + ' BNB')
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
                    'value': bscWeb3.utils.toHex(bscWeb3.utils.toWei(amount.toString(), 'ether')),
                    // gas or gasLimit
                    'gas': 100000,
                    // 'gasPrice': getGasPrice(),
                    'gasPrice': bscWeb3.utils.toHex(bscWeb3.utils.toWei(gasPrice, 'ether')),
                    'nonce': nonce
                }
    
                // const privateKey = ''
                // const account = bscWeb3.eth.accounts.privateKeyToAccount('0x' + privateKey)
                // bscWeb3.eth.accounts.wallet.add(account)
                // bscWeb3.eth.sendTransaction({
                //     from: '',
                //     to: '',
                //     value: '1000000000',
                //     gas: 5000000,
                //     gasPrice: 18e9,
                // }, function(error, transactionHash) {
                //   if (error) {
                //     console.log(error)
                //     } else {
                //     console.log(transactionHash)
                //    }
                // })
    
                const common = Common.default.forCustomChain('mainnet', {
                    name: 'bnb',
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
                bscWeb3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
                    if (error) {
                        logger.error('Error: ' + error)
                        res.json({
                            result: 'error',
                            message: error.toString(),
                        })
                        return
                    }
                    const url = `${server.bscscanExplorerUrl}/tx/${id}`
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
        logger.error('bnbSend catch Error:', error)
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
        url: `http://localhost:${server.port}/bnb/fees`,
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
            return 56
        default:
            return 97
    }
}

function getGasPrice() {
    switch (server.network) {
        case 'mainnet':
            return 5e9
        default:
            return 10e9
    }
}

module.exports = bnbSend
