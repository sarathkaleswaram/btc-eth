const request = require('request')
const EthereumTx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common')
var server = require('../../server')
const { logger } = require('../../utils/logger')
var sharABI = require('../../bep20-abi/shar')
var inrtABI = require('../../bep20-abi/inrt')
var zinrABI = require('../../bep20-abi/zinr')
var dogeABI = require('../../bep20-abi/doge')
var adaABI = require('../../bep20-abi/ada')
var busdABI = require('../../bep20-abi/busd')
var eosABI = require('../../bep20-abi/eos')
var bchABI = require('../../bep20-abi/bch')

var bnbTokenSend = async function (req, res) {
    try {
        var bscWeb3 = server.bscWeb3
        var bepToken = req.params.bepToken
        var sourceAddress = req.body.sourceAddress
        var privateKey = req.body.privateKey
        var destinationAddress = req.body.destinationAddress
        var amount = req.body.amount
        var account, contractAddress, abi
        
        logger.debug('bnbTokenSend bepToken: ' + bepToken + " sourceAddress: " + sourceAddress + " destinationAddress: " + destinationAddress + " amount: " + amount)

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
        } else if (bepToken === 'zinr') {
            abi = zinrABI
        } else if (bepToken === 'doge') {
            abi = dogeABI
        } else if (bepToken === 'ada') {
            abi = adaABI
        } else if (bepToken === 'busd') {
            abi = busdABI
        } else if (bepToken === 'eos') {
            abi = eosABI
        } else if (bepToken === 'bch') {
            abi = bchABI
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
                logger.verbose('Source Account Balance: ' + balance + ' ' + bepToken.toUpperCase())
                logger.verbose(balance + ' < ' + amount)
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
                logger.verbose('Sending Amount in Wei: ' + sendingAmount)
                // tx
                var rawTransaction = {
                    'from': sourceAddress,
                    // gas or gasLimit
                    'gas': 100000,
                    'gasPrice': getGasPrice(),
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
                }, 'petersburg')

                const transaction = new EthereumTx(rawTransaction, { common })
                var privateKeySplit = privateKey.split('0x')
                try {
                    var privateKeyHex = Buffer.from(privateKeySplit[1], 'hex')
                    transaction.sign(privateKeyHex)
                } catch (error) {
                    logger.error('Failed to sign Transaction')
                    logger.error('Error: ' + error)
                    res.json({
                        result: 'error',
                        message: 'Failed to sign Transaction',
                    })
                    return
                }

                const serializedTransaction = transaction.serialize()
                bscWeb3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'), (error, id) => {
                    if (error) {
                        logger.error('Error: ' + error)
                        res.json({
                            result: 'error',
                            message: error.toString(),
                        })
                        return
                    }
                    const url = `${server.bscscanExplorerUrl}/tx/${id}`
                    logger.verbose('Send Tx', { transactionHash: id, link: url })
                    res.json({
                        result: 'success',
                        transactionHash: id,
                        link: url
                    })
                })
            }, error => {
                logger.error('Error: ' + error)
                res.json({
                    result: 'error',
                    message: error.toString(),
                })
                return
            })
        }, error => {
            logger.error('Error: ' + error)
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

function getGasPrice() {
    switch (server.network) {
        case 'mainnet':
            return 5e9
        default:
            return 10e9
    }
}

module.exports = bnbTokenSend
