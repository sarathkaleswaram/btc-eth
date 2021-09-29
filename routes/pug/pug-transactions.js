var transactions = require('../../models/transactions')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'debug'

var pugTransactions = function (req, res) {
    logger.debug('pugTransactions')

    transactions.find({}).sort({ timeStamp: -1 }).then((transactions) => {
        logger.debug('Transactions length:', transactions.length)
        var totals = {
            btc: transactions.filter(tx => tx.type === 'btc').reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0),
            eth: transactions.filter(tx => tx.type === 'eth').reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0),
            grt: transactions.filter(tx => tx.type === 'grt').reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0),
            jan: transactions.filter(tx => tx.type === 'jan').reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0),
            satx: transactions.filter(tx => tx.type === 'satx').reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0),
        }
        logger.debug('Totals', totals)
        res.render('transactions', { transactions: transactions, totals: totals, moment: require('moment') })
    }, error => {
        logger.error(error)
        res.render('transactions', { error: true, message: error.toString() })
    })

}

module.exports = pugTransactions