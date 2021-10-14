const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common')
var server = require('../../server')
var sharABI = require('../../bep20-abi/shar')
var inrtABI = require('../../bep20-abi/inrt')
var busdABI = require('../../bep20-abi/busd')

const log4js = require('log4js')
var logger = log4js.getLogger('crypto')
logger.level = 'debug'

var bnbTokenSend = async function (req, res) {
    try {
        logger.debug('bnbTokenSend params:', req.params, 'body:', req.body)
        var bscWeb3 = server.bscWeb3
        var bepToken = req.params.bepToken
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var account, contractAddress, abi

        if (!sourceAddress || !privateKey || !destinationAddress || !amount || !bepToken) {
            logger.error('Invalid arguments')
            res.json({
                result: 'error',
                message: 'Invalid arguments',
            })
            return
        }

        var index = server.bepTokens.findIndex(x => x.bepToken === bepToken.toLowerCase())
        if (index >= 0) {
            bepToken = server.bepTokens[index].bepToken.toLowerCase()
            contractAddress = server.bepTokens[index].contractAddress
        }
        if (!contractAddress) {
            logger.error('Unknown BEP Token.')
            res.json({
                result: 'error',
                message: 'Unknown BEP Token.',
            })
            return
        }
        if (!bscWeb3.utils.isAddress(sourceAddress)) {
            logger.error('Invalid sourceAddress')
            res.json({
                result: 'error',
                message: 'Invalid sourceAddress',
            })
            return
        }
        if (!bscWeb3.utils.isAddress(destinationAddress)) {
            logger.error('Invalid destinationAddress')
            res.json({
                result: 'error',
                message: 'Invalid destinationAddress',
            })
            return
        }
        try {
            account = bscWeb3.eth.accounts.privateKeyToAccount(privateKey)
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

        if (bepToken === 'shar') {
            abi = sharABI
        } else if (bepToken === 'inrt') {
            abi = inrtABI
        } else if (bepToken === 'busd') {
            abi = busdABI
        }

        var contract = new bscWeb3.eth.Contract(abi, contractAddress)
        // Get nonce
        var nonce = await bscWeb3.eth.getTransactionCount(sourceAddress)
        // Get bepToken balance
        contract.methods.balanceOf(sourceAddress).call().then(function (amountResult) {
            // get token decimals
            contract.methods.decimals().call().then(function (decimalsResult) {
                // calculate amount for custome token decimals
                var value = parseInt(amountResult), decimals = parseInt(decimalsResult)
                var balance = value / 10 ** decimals
                logger.debug('Source Account Balance: ', balance + ' ' + bepToken.toUpperCase())
                logger.debug(balance, ' < ', amount)
                if (parseFloat(balance) < amount) {
                    logger.error('Insufficient funds')
                    res.json({
                        result: 'error',
                        message: 'Insufficient funds',
                    })
                    return
                }
                // convert amount
                var sendingAmount = (amount * (10 ** decimals)).toString()
                logger.debug('Sending Amount in Wei: ', sendingAmount)
                // tx
                var rawTransaction = {
                    'from': sourceAddress,
                    'gas': 5000000,
                    'gasPrice': 18e9,
                    'to': contractAddress,
                    'value': '0x0',
                    'data': contract.methods.transfer(destinationAddress, sendingAmount).encodeABI(),
                    'nonce': nonce,
                    'chainId': getChainId()
                }

                const common = Common.default.forCustomChain('mainnet', {
                    name: 'bnb',
                    networkId: getChainId(),
                    chainId: getChainId()
                }, 'petersburg');

                const transaction = new EthereumTx(rawTransaction, { common })
                var privateKeySplit = privateKey.split('0x')
                try {
                    var privateKeyHex = Buffer.from(privateKeySplit[1], 'hex')
                    transaction.sign(privateKeyHex)
                } catch (error) {
                    logger.error('Failed to sign Transaction')
                    logger.error(error)
                    res.json({
                        result: 'error',
                        message: 'Failed to sign Transaction',
                    })
                    return
                }

                const serializedTransaction = transaction.serialize()
                bscWeb3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (err, id) => {
                    if (err) {
                        logger.error(err)
                        res.json({
                            result: 'error',
                            message: err.toString(),
                        })
                        return
                    }
                    const url = `${server.bscscanExplorerUrl}/tx/${id}`
                    logger.debug({ transactionHash: id, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: id,
                        link: url
                    })
                })
            }, error => {
                logger.error(error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            })
        }, error => {
            logger.error(error)
            res.json({
                result: 'error',
                message: error.toString(),
            })
            return
        })
    } catch (error) {
        logger.error('bnbTokenSend catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

function getChainId() {
    switch (server.network) {
        case 'mainnet':
            return 56
        default:
            return 97
    }
}

module.exports = bnbTokenSend
