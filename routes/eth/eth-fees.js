const request = require('request')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var ethTxFees = function (req, res) {
    try {
        logger.debug('ethTxFees')
        request({
            // url: 'https://ethgasstation.info/json/ethgasAPI.json',
            url: `${server.etherscanAPI.replace('-ropsten', '')}&module=gastracker&action=gasoracle`,
            json: true
        }, function (error, response, body) {
            try {
                if (error || body.error) {
                    logger.error(body.error || error)
                    res.json({
                        result: 'error',
                        message: body.error || error.toString(),
                    })
                    return
                }
                var fees = {
                    low: server.web3.utils.fromWei(body.result.SafeGasPrice, 'gwei'),
                    medium: server.web3.utils.fromWei(body.result.ProposeGasPrice, 'gwei'),
                    high: server.web3.utils.fromWei(body.result.FastGasPrice, 'gwei'),
                }
                logger.debug('Fees', fees)
                res.json({
                    result: 'success',
                    fees
                })
            } catch (error) {
                logger.error('ethTxFees sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            }
        })
    } catch (error) {
        logger.error('ethTxFees catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = ethTxFees