const request = require('request')
var server = require('../../server')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var btcGetTx = function (req, res) {
    try {
        logger.debug('btcGetTx params:', req.params)
        var tx = req.params.tx

        if (!tx) {
            logger.error('Tx is empty')
            res.json({
                result: 'error',
                message: 'Tx is empty',
            })
            return
        }
        request({
            url: `${server.btcAPI}/txs/${tx}`,
            json: true
        }, function (error, response, body) {
            try {
                if (error) {
                    logger.error(error)
                    res.json({
                        result: 'error',
                        message: error.toString(),
                    })
                    return
                }
                if (body.error) {
                    logger.error(body.error)
                    res.json({
                        result: 'error',
                        message: body.error,
                    })
                    return
                }
                logger.debug(body)
                res.json({
                    result: 'success',
                    Tx: body
                })                
            } catch (error) {
                logger.error('btcGetTx sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })                
            }
        })
    } catch (error) {
        logger.error('btcGetTx catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = btcGetTx