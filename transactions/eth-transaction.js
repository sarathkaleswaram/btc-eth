const request = require('request')
var transactions = require('../models/transactions')
var server = require('../server')
var { checkTxAndCallback, makeSubmittedCallback } = require('./callback')

const log4js = require('log4js')
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

var dbPendingEthTx = function (address, blocknumber) {
    var web3 = server.web3
    var url = `${server.etherscanAPI}&module=account&action=txlist&address=${address}&startblock=${blocknumber}&sort=asc`
    logger.debug('Running Etherscan API: ', url)
    request({
        url: url,
        json: true
    }, function (error, response, body) {
        if (error) {
            logger.error(error)
            return
        }
        if (body.status === '0') logger.error(body.message)
        if (body.status === '1') {
            logger.debug('Txs length:', body.result.length)
            body.result.forEach(tx => {
                if (tx.to === address.toLowerCase()) {
                    logger.debug('Got tx from: ', tx.from, ', amount: ', tx.value, ', hash:', tx.hash)
                    // check transaction hash with db before making callback and save
                    checkTxAndCallback('eth', tx.to, tx.from, web3.utils.fromWei(tx.value.toString(), 'ether'), new Date(tx.timeStamp * 1000), tx.hash, tx.blockHash, tx.blockNumber, web3.utils.fromWei(tx.gas.toString(), 'ether'))
                }
            })
        }
    })
    // var web3 = server.web3
    // web3.eth.getBlockNumber().then(async (end) => {
    //     logger.debug('Get blocks from:', start, '-', end)
    //     for (let i = start; i < end; i++) {
    //         let block = await web3.eth.getBlock(i)
    //         logger.debug(`[*] Searching block ${i}`)
    //         if (block && block.transactions) {
    //             logger.debug(`Checking ${block.transactions.length} transactions of block ${i}`)
    //             for (let txhash of block.transactions) {
    //                 let transaction = await web3.eth.getTransaction(txhash)
    //                 if (address === transaction.to.toLowerCase()) {
    //                     logger.debug(`[+] Transaction found on block ${lastBlockNumber}`)
    //                     logger.debug(transaction)
    //                     logger.debug({ address: transaction.from, value: web3.utils.fromWei(transaction.value, 'ether'), timestamp: new Date() })
    //                 }
    //             }
    //         }
    //     }
    // })
}

var subscribeEthPendingTx = function () {
    const subscription = server.web3ws.eth.subscribe('pendingTransactions', (err, res) => {
        if (err) logger.error(err)
    })
    logger.debug('Subscribed to ETH live pending transactions...')
    subscription.on('data', async (txHash) => {
        if (server.ethAccounts.length) {
            logger.trace('ETH getting all pending tx:', txHash, ', Checking with Accounts length:', server.ethAccounts.length, ', Accounts:', server.ethAccounts, ' Token address length:', server.ethErcTokenAccounts.length, ', Address:', server.ethErcTokenAccounts)
            try {
                let tx = await server.web3.eth.getTransaction(txHash)
                if (tx && tx.to) {
                    if (server.ethAccounts.includes(tx.to)) {
                        logger.debug('Got ETH tx from: ', tx.from, ', amount: ', tx.value, ', hash:', tx.hash)
                        var index = server.ercToken.findIndex(x => x.contractAddress === tx.to)
                        // remove from array
                        server.ethAccounts.splice(server.ethAccounts.findIndex(x => x === tx.to), 1)
                        // ERC20 Transaction
                        if (index >= 0) {
                            // reciverAddress will be lowercase, get address format from array
                            var recieverAddress = '0x' + tx.input.substr(34, 40)
                            var recieverIndex = server.ethErcTokenAccounts.findIndex(x => x.toLowerCase() === recieverAddress.toLowerCase())
                            var to = server.ethErcTokenAccounts[recieverIndex]
                            // amount will be in hex
                            var amountHex = '0x' + tx.input.substr(76)
                            var amount = server.web3.utils.hexToNumberString(amountHex)
                            server.ethErcTokenTxHashes.push(tx.hash)
                            makeSubmittedCallback('eth', tx.from, to, tx.hash, server.web3.utils.fromWei(amount, 'ether'), server.ercToken[index].ercToken)
                        } else {
                            // Normal Transaction
                            server.ethTxHashes.push(tx.hash)
                            makeSubmittedCallback('eth', tx.from, tx.to, tx.hash, server.web3.utils.fromWei(tx.value.toString(), 'ether'))
                        }
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        }
    })
}

// var getEthERCTokenLogs = function () {
//     var contractSubscription = server.web3ws.eth.subscribe('logs', {
//         address: [
//             '0x90ED4BB7B18376D63175C93d4726Edd19Fd794Ce'
//         ],
//     }, function (err, res) {
//         if (err) logger.error(err)
//     })
//     contractSubscription.on("data", function (data) {
//         logger.debug(data)
//     })
// }

var getEthTxByHashes = function () {
    logger.debug('ETH pending hashes length:', server.ethTxHashes.length)
    var web3 = server.web3
    server.ethTxHashes.forEach(async txHash => {
        logger.debug('Getting ETH transaction for hash:', txHash)
        var tx = await web3.eth.getTransaction(txHash)
        logger.debug('ETH pending hash blocknumber:', tx.blockNumber, ', blockHash:', tx.blockHash)
        if (tx.blockNumber !== null) {
            logger.debug('ETH confirmed tx:', tx)
            // get block
            var block = await web3.eth.getBlock(tx.blockNumber)
            var timeStamp = block ? new Date(block.timestamp * 1000) : new Date()
            var fee = web3.utils.fromWei((tx.gas * parseInt(tx.gasPrice)).toString(), 'ether')
            // remove from arrays
            server.ethTxHashes.splice(server.ethTxHashes.findIndex(x => x === txHash), 1)
            // check transaction hash with db before making callback and save
            checkTxAndCallback('eth', tx.to, tx.from, web3.utils.fromWei(tx.value.toString(), 'ether'), timeStamp, tx.hash, tx.blockHash, tx.blockNumber, fee)
        }
    })
}

var formatAddress = function (data) {
    var web3 = server.web3
    var step1 = web3.utils.hexToBytes(data)
    for (var i = 0; i < step1.length; i++)
        if (step1[0] == 0) step1.splice(0, 1)
    return web3.utils.bytesToHex(step1)
}

var getEthErcTokenTxByHashes = function () {
    logger.debug('ETH ERC Token pending hashes length:', server.ethErcTokenTxHashes.length)
    var web3 = server.web3
    server.ethErcTokenTxHashes.forEach(async txHash => {
        logger.debug('Getting ETH ERC Token transaction for hash:', txHash)
        // get tx receipt
        var txReceipt = await web3.eth.getTransactionReceipt(txHash)
        logger.debug('ETH ERC Token pending txReceipt:', txReceipt)
        if (txReceipt !== null) {
            // get block, tx
            var block = await web3.eth.getBlock(txReceipt.blockNumber)
            var tx = await web3.eth.getTransaction(txHash)
            var fee = web3.utils.fromWei((tx.gas * parseInt(tx.gasPrice)).toString(), 'ether')
            var timeStamp = block ? new Date(block.timestamp * 1000) : new Date()
            // get token tx details
            var from = tx.from
            var recieverAddress = formatAddress(txReceipt.logs[0].topics['2'])
            var amount = web3.utils.hexToNumberString(txReceipt.logs[0].data)
            var recieverIndex = server.ethErcTokenAccounts.findIndex(x => x.toLowerCase() === recieverAddress.toLowerCase())
            var to = server.ethErcTokenAccounts[recieverIndex]
            var tokenIndex = server.ercToken.findIndex(x => x.contractAddress === txReceipt.logs[0].address)
            // remove from arrays
            server.ethErcTokenTxHashes.splice(server.ethErcTokenTxHashes.findIndex(x => x === txHash), 1)
            server.ethErcTokenAccounts.splice(server.ethErcTokenAccounts.findIndex(x => x === to), 1)
            if (to) {
                // check transaction hash with db before making callback and save
                checkTxAndCallback('eth', to, from, web3.utils.fromWei(amount.toString(), 'ether'), timeStamp, tx.hash, tx.blockHash, tx.blockNumber, fee, server.ercToken[tokenIndex].ercToken)
            } else {
                logger.warn('To Address is empty')
            }
        }
    })
}

exports.dbPendingEthTx = dbPendingEthTx
exports.subscribeEthPendingTx = subscribeEthPendingTx
exports.getEthTxByHashes = getEthTxByHashes
exports.getEthErcTokenTxByHashes = getEthErcTokenTxByHashes