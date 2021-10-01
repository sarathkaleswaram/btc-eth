const addressCodec = require('ripple-address-codec')
const keypairs = require('ripple-keypairs')
var server = require('../../server')
var submit_and_verify = require('../../libs/submit-and-verify.js').submit_and_verify

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var createToken = async function (req, res) {
    try {
        logger.debug('createToken body:', req.body)

        if (server.rippleApi.isConnected()) {
            createXrpToken(req, res)
        } else {
            server.rippleApi.connect().then(() => {
                createXrpToken(req, res)
            }).catch(error => {
                logger.debug(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            })
        }
    } catch (error) {
        logger.error('createToken catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

async function createXrpToken(req, res) {
    var { issuerAddress, issuerPrivateKey, recipientAddress, recipientPrivateKey, currencyCode, limitAmount, domain } = req.body
    var rippleApi = server.rippleApi

    if (!issuerAddress || !issuerPrivateKey || !recipientAddress || !recipientPrivateKey || !currencyCode || !limitAmount) {
        logger.error('Invalid arguments')
        res.json({
            result: 'error',
            message: 'Invalid arguments',
        })
        return
    }
    if (!addressCodec.isValidClassicAddress(issuerAddress)) {
        logger.error('Invalid issuerAddress')
        res.json({
            result: 'error',
            message: 'Invalid issuerAddress',
        })
        return
    }
    if (!addressCodec.isValidClassicAddress(recipientAddress)) {
        logger.error('Invalid recipientAddress')
        res.json({
            result: 'error',
            message: 'Invalid recipientAddress',
        })
        return
    }
    try {
        keypairs.deriveKeypair(issuerPrivateKey)
    } catch (error) {
        logger.error('Invalid issuerPrivateKey')
        res.json({
            result: 'error',
            message: 'Invalid issuerPrivateKey',
        })
        return
    }
    try {
        keypairs.deriveKeypair(recipientPrivateKey)
    } catch (error) {
        logger.error('Invalid recipientPrivateKey')
        res.json({
            result: 'error',
            message: 'Invalid recipientPrivateKey',
        })
        return
    }
    if (currencyCode.length !== 3) {
        logger.error('Invalid currencyCode, should be 3 char')
        res.json({
            result: 'error',
            message: 'Invalid currencyCode, should be 3 char',
        })
        return
    }
    try {
        limitAmount = parseInt(limitAmount)
    } catch (error) {
        logger.error('Invalid limitAmount')
        res.json({
            result: 'error',
            message: 'Invalid limitAmount',
        })
        return
    }

    try {
        // to generate address with test coins credited
        // await rippleApi.generateFaucetWallet()    

        if (domain) {
            var domainHex = Buffer.from(domain, 'utf8').toString('hex')
            // Configure issuer (cold address) settings 
            const cold_settings_tx = {
                TransactionType: 'AccountSet',
                Account: issuerAddress,
                TransferRate: 0,
                TickSize: 5,
                Domain: domainHex,
                SetFlag: 8 // enable Default Ripple
                // Flags: (rippleApi.txFlags.AccountSet.DisallowXRP |
                //          rippleApi.txFlags.AccountSet.RequireDestTag)
            }
            const cst_prepared = await rippleApi.prepareTransaction(
                cold_settings_tx,
                { maxLedgerVersionOffset: 10 }
            )
            const cst_signed = rippleApi.sign(cst_prepared.txJSON, issuerPrivateKey)
            logger.degub('Sending cold address AccountSet transaction...')
            const cst_result = await submit_and_verify(rippleApi, cst_signed.signedTransaction)
            if (cst_result == 'tesSUCCESS') {
                logger.degub(`Transaction succeeded: ${server.xrpExplorerUrl}/transactions/${cst_signed.id}`)
            } else {
                logger.error('Error issuer AccountSet cst_result:', cst_result)
                throw `Error sending issuer AccountSet transaction: ${cst_result}`
            }

            // Configure hot address settings
            const hot_settings_tx = {
                TransactionType: 'AccountSet',
                Account: recipientAddress,
                Domain: domainHex,
                SetFlag: 2 // enable Require Auth so we can't use trust lines that users
                // make to the hot address, even by accident.
                // Flags': (rippleApi.txFlags.AccountSet.DisallowXRP |
                //          rippleApi.txFlags.AccountSet.RequireDestTag)
            }

            const hst_prepared = await rippleApi.prepareTransaction(
                hot_settings_tx,
                { maxLedgerVersionOffset: 10 }
            )
            const hst_signed = rippleApi.sign(hst_prepared.txJSON, recipientPrivateKey)
            logger.debug('Sending hot address AccountSet transaction...')
            const hst_result = await submit_and_verify(rippleApi, hst_signed.signedTransaction)
            if (hst_result == 'tesSUCCESS') {
                logger.info(`Transaction succeeded: ${server.xrpExplorerUrl}/transactions/${hst_signed.id}`)
            } else {
                logger.error('Error recipient AccountSet hst_result:', hst_result)
                throw `Error sending recipient AccountSet transaction: ${hst_result}`
            }
        }

        // Create trust line from hot to cold address
        const trust_set_tx = {
            TransactionType: 'TrustSet',
            Account: recipientAddress,
            LimitAmount: {
                currency: currencyCode,
                issuer: issuerAddress,
                value: limitAmount.toString()
            }
        }
        const ts_prepared = await rippleApi.prepareTransaction(
            trust_set_tx,
            { maxLedgerVersionOffset: 10 }
        )
        const ts_signed = rippleApi.sign(ts_prepared.txJSON, recipientPrivateKey)
        logger.debug('Creating trust line from hot address to issuer...')
        const ts_result = await submit_and_verify(rippleApi, ts_signed.signedTransaction)
        if (ts_result == 'tesSUCCESS') {
            logger.info(`Transaction succeeded: ${server.xrpExplorerUrl}/transactions/${ts_signed.id}`)
        } else {
            logger.error('Error TrustSet ts_result:', ts_result)
            throw `Error sending TrustSet transaction: ${ts_result}`
        }

        // Check balances 
        logger.debug('Getting hot address balances...')
        const hot_balances = await rippleApi.request('account_lines', {
            account: recipientAddress,
            ledger_index: 'validated'
        })
        logger.debug(hot_balances)

        logger.debug('Getting cold address balances...')
        const cold_balances = await rippleApi.request('gateway_balances', {
            account: issuerAddress,
            ledger_index: 'validated',
            hotwallet: [recipientAddress]
        })
        logger.debug(JSON.stringify(cold_balances, null, 2))

        res.json({
            result: 'success',
            transactionHash: ts_signed.id,
            link: `${server.xrpExplorerUrl}/transactions/${ts_signed.id}`
        })
    } catch (error) {
        logger.error('createXrpToken catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = createToken
