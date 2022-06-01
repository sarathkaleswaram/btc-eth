const addressCodec = require('ripple-address-codec')
const keypairs = require('ripple-keypairs')
var server = require('../../server')
const { logger } = require('../../utils/logger')
var submit_and_verify = require('../../libs/submit-and-verify.js').submit_and_verify

var xrpTokenTrustSet = async function (req, res) {
    try {
        logger.debug('xrpTokenTrustSet body:', req.body)
        var address = req.body.address
        var privateKey = req.body.privateKey
        var limitAmount = req.body.limitAmount
        var xrpToken = req.params.xrpToken
        var issuerAddress, currency

        if (!address || !privateKey || !limitAmount || !xrpToken) {
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
        if (!addressCodec.isValidClassicAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
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
            limitAmount = parseFloat(limitAmount)
        } catch (error) {
            logger.error('Invalid limitAmount')
            res.json({
                result: 'error',
                message: 'Invalid limitAmount',
            })
            return
        }

        if (server.rippleApi.isConnected()) {
            sendTrustSet(address, privateKey, limitAmount, issuerAddress, currency, res)
        } else {
            server.rippleApi.connect().then(() => {
                sendTrustSet(address, privateKey, limitAmount, issuerAddress, currency, res)
            }).catch(error => {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            })
        }
    } catch (error) {
        logger.error('xrpTokenTrustSet catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

async function sendTrustSet(address, privateKey, limitAmount, issuerAddress, currency, res) {
    try {
        var rippleApi = server.rippleApi

        const preparedTx = await rippleApi.prepareTransaction({
            TransactionType: 'TrustSet',
            Account: address,
            LimitAmount: {
                currency: currency,
                issuer: issuerAddress,
                value: limitAmount.toString()
            }
        }, {
            maxLedgerVersionOffset: 10
        })
        logger.verbose('Prepared Tx:', preparedTx)
        const { signedTransaction, id } = rippleApi.sign(preparedTx.txJSON, privateKey)
        const resultCode = await submit_and_verify(rippleApi, signedTransaction)
        logger.verbose('Result:', resultCode)

        if (resultCode !== 'tesSUCCESS') {
            logger.error(resultCode)
            res.json({
                result: 'error',
                message: `Error sending TrustSet transaction with resultCode: ${resultCode}`
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
        logger.error('sendTrustSet catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
        return
    }
}

module.exports = xrpTokenTrustSet
