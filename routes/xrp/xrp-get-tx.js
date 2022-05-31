var server = require('../../server')
const { logger } = require('../../utils/logger')

var xrpGetTx = function (req, res) {
    try {
        logger.debug('xrpGetTx params:', req.params)
        var tx = req.params.tx

        if (!tx) {
            logger.error('Tx is empty')
            res.json({
                result: 'error',
                message: 'Tx is empty',
            })
            return
        }

        if (server.rippleApi.isConnected()) {
            getTransaction(tx, res)
        } else {
            server.rippleApi.connect().then(() => {
                getTransaction(tx, res)
            }).catch(error => {
                logger.debug(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
            })
        }
    } catch (error) {
        logger.error('xrpGetTx catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getTransaction(tx, res) {
    server.rippleApi.getTransaction(tx).then((transaction) => {
        logger.debug(transaction)
        res.json({
            result: 'success',
            Tx: transaction
        })
    }).catch(error => {
        logger.error(error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    })
}

module.exports = xrpGetTx