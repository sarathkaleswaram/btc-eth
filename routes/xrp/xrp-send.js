const request = require('request')
const addressCodec = require('ripple-address-codec')
const keypairs = require('ripple-keypairs')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var xrpSend = async function (req, res) {
    try {
        logger.debug('xrpSend body:', req.body)
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var gas = req.body.gas

        if (!sourceAddress || !privateKey || !destinationAddress || !amount) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        if (!addressCodec.isValidClassicAddress(sourceAddress)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!addressCodec.isValidClassicAddress(destinationAddress)) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            keypairs.deriveKeypair(privateKey)
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

        if (server.rippleApi.isConnected()) {
            send(sourceAddress, privateKey, destinationAddress, amount, gas, res)
        } else {
            server.rippleApi.connect().then(() => {
                send(sourceAddress, privateKey, destinationAddress, amount, gas, res)
            }).catch(error => {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            })
        }
    } catch (error) {
        logger.error('xrpSend catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function send(sourceAddress, privateKey, destinationAddress, amount, gas, res) {
    getCurrentGasPrices(res, gas, async function (feePrice) {
        try {
            var rippleApi = server.rippleApi
            const preparedTx = await rippleApi.prepareTransaction({
                TransactionType: 'Payment',
                Account: sourceAddress,
                Amount: rippleApi.xrpToDrops(amount),
                Fee: feePrice ? rippleApi.xrpToDrops(feePrice) : undefined,
                Destination: destinationAddress
            }, {
                // Expire this transaction if it doesn't execute within ~5 minutes:
                maxLedgerVersionOffset: 75 // 5
            })
            logger.verbose('Prepared Tx:', preparedTx)

            const { signedTransaction, id } = rippleApi.sign(preparedTx.txJSON, privateKey)
            const result = await rippleApi.submit(signedTransaction)
            logger.verbose('Result:', result)

            if (result.resultCode !== 'tesSUCCESS') {
                logger.error(result.resultMessage || result)
                res.json({
                    result: 'error',
                    message: result.resultMessage || result,
                })
                return
            }

            const url = `${server.xrpExplorerUrl}/transactions/${id}`
            logger.verbose('Send Tx', { transactionHash: id, link: url })
            res.json({
                result: 'success',
                transactionHash: id,
                link: url
            })
        } catch (error) {
            logger.error('send catch Error:', error)
            res.json({
                result: 'error',
                message: error,
            })
            return
        }
    })
}

function getCurrentGasPrices(res, gas, callback) {
    if (gas) {
        callback(gas.toString())
        return
    }
    request({
        url: `http://localhost:${server.port}/xrp/fees`,
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

module.exports = xrpSend
