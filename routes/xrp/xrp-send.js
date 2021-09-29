const addressCodec = require('ripple-address-codec')
const keypairs = require('ripple-keypairs')
var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth-xrp')
logger.level = 'debug'

var xrpSend = async function (req, res) {
    try {
        logger.debug('xrpSend body:', req.body)
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount

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

        if (server.rippleApi.isConnected()) {
            send(sourceAddress, privateKey, destinationAddress, amount, res)
        } else {
            server.rippleApi.connect().then(() => {
                send(sourceAddress, privateKey, destinationAddress, amount, res)
            }).catch(error => {
                logger.debug(error)
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

async function send(sourceAddress, privateKey, destinationAddress, amount, res) {
    try {
        var rippleApi = server.rippleApi
        const preparedTx = await rippleApi.prepareTransaction({
            TransactionType: 'Payment',
            Account: sourceAddress,
            Amount: rippleApi.xrpToDrops(amount),
            Destination: destinationAddress
        }, {
            // Expire this transaction if it doesn't execute within ~5 minutes:
            maxLedgerVersionOffset: 75 // 5
        })
        logger.debug('Prepared Tx:', preparedTx)

        const { signedTransaction, id } = rippleApi.sign(preparedTx.txJSON, privateKey)
        const result = await rippleApi.submit(signedTransaction)
        logger.debug('Result:', result)

        if (result.resultCode !== 'tesSUCCESS') {
            logger.error(result.resultMessage || result)
            res.json({
                result: 'error',
                message: result.resultMessage || result,
            })
            return
        }

        const url = `${server.xrpExplorerUrl}/transactions/${id}`
        logger.debug({ transactionHash: id, link: url })
        res.json({
            result: 'success',
            transactionHash: id,
            link: url
        })
    } catch (error) {
        logger.error(error)
        res.json({
            result: 'error',
            message: error,
        })
        return
    }
}

module.exports = xrpSend
