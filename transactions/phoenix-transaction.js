const request = require('request')
var server = require('../server')
const { logger } = require('../utils/logger')
var { checkTxAndCallback } = require('./callback')

var dbPendingPhoenixTx = function (address, blocknumber) {
    var web3 = server.web3
    var url = `${server.phoenixExplorerUrl}/api?&module=account&action=txlist&address=${address}&startblock=${blocknumber}&sort=asc`
    logger.verbose('Running Phoenix Explorer API: ' + url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        try {
            if (error) {
                logger.error('Error: ' + error)
                return
            }
            if (body.status === '0') logger.error(body.message)
            if (body.status === '1') {
                logger.debug(`Txs PHOENIX length: ${body.result.length}, for address: ${address}`)
                body.result.forEach(tx => {
                    if (tx.to === address.toLowerCase()) {
                        logger.info(`Got PHOENIX tx from: ${tx.from}, amount: ${tx.value}, hash: ${tx.hash}`)
                        // calculate transaction fees = gas used * gas price
                        var gasUsed = parseInt(tx.gasUsed), gasPrice = parseInt(tx.gasPrice)
                        var fees = gasUsed * gasPrice
                        // check transaction hash with db before making callback and save
                        checkTxAndCallback('phoenix', address, tx.from, web3.utils.fromWei(tx.value.toString(), 'ether'), new Date(tx.timeStamp * 1000), tx.hash, tx.blockHash, tx.blockNumber, web3.utils.fromWei(fees.toString(), 'ether'))
                    }
                })
            }
        } catch (error) {
            logger.error('Error: ' + error)
        }
    })
}

exports.dbPendingPhoenixTx = dbPendingPhoenixTx