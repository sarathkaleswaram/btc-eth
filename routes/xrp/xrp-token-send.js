const addressCodec = require('ripple-address-codec')
const keypairs = require('ripple-keypairs')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var xrpTokenSend = async function (req, res) {
    try {
        //logger.debug('xrpTokenSend body:', req.body)
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var xrpToken = req.params.xrpToken
        var issuerAddress, currency
        logger.debug('xrpTokenSend sourceAddress: '+ sourceAddress + " destinationAddress: " + destinationAddress + " amount: " + amount + " xrpToken: " + xrpToken)

        if (!sourceAddress || !privateKey || !destinationAddress || !amount || !xrpToken) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }
        var index = server.xrpTokens.findIndex(x => x.name === xrpToken.toLowerCase())
        if (index >= 0) {
            xrpToken = xrpToken.toLowerCase()
            issuerAddress = server.xrpTokens[index].issuer
            currency = server.xrpTokens[index].currency
        }
        if (!issuerAddress || !currency) {
            logger.error('Unknown XRP Token')
            res.json({
                result: 'error',
                message: 'Unknown XRP Token',
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
            sendToken(sourceAddress, privateKey, destinationAddress, amount, issuerAddress, currency, res)
        } else {
            server.rippleApi.connect().then(() => {
                sendToken(sourceAddress, privateKey, destinationAddress, amount, issuerAddress, currency, res)
            }).catch(error => {
                logger.debug(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            })
        }
    } catch (error) {
        logger.error('xrpTokenSend catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

async function sendToken(sourceAddress, privateKey, destinationAddress, amount, issuerAddress, currency, res) {
    try {
        var rippleApi = server.rippleApi

        const preparedTx = await rippleApi.prepareTransaction({
            TransactionType: 'Payment',
            Account: sourceAddress,
            Amount: {
                currency: currency,
                value: amount.toString(),
                issuer: issuerAddress
            },
            Destination: destinationAddress
        }, {
            maxLedgerVersionOffset: 10
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
                info: 'Either TrustSet is not done OR amount limit exceeded'
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
        logger.error('sendToken catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
        return
    }
}

module.exports = xrpTokenSend
