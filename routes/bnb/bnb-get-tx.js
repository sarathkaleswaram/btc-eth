const request = require('request')
var server = require('../../server')
const { logger } = require('../../utils/logger')

var bnbGetTx = function (req, res) {
    try {
        logger.debug('bnbGetTx params:', req.params)
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
            url: `${server.bscscanAPI}&module=transaction&action=getstatus&txhash=${tx}`,
            json: true
        }, function (error, response, body) {
            try {
                if (error) {
                    logger.error('Error: ' + error)
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
                logger.debug('Tx', body)
                res.json({
                    result: 'success',
                    Tx: body
                })                
            } catch (error) {
                logger.error('bnbGetTx sub catch Error:', error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })                
            }
        })
    } catch (error) {
        logger.error('bnbGetTx catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = bnbGetTx