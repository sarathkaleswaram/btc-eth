const request = require('request')
const { logger } = require('../../utils/logger')
var server = require('../../server')
var sharABI = require('../../bep20-abi/shar')
var inrtABI = require('../../bep20-abi/inrt')
var zinrABI = require('../../bep20-abi/zinr')
var dogeABI = require('../../bep20-abi/doge')
var adaABI = require('../../bep20-abi/ada')
var busdABI = require('../../bep20-abi/busd')
var eosABI = require('../../bep20-abi/eos')
var bchABI = require('../../bep20-abi/bch')

var bnbTokenBalance = function (req, res) {
    try {
        logger.debug('bnbTokenBalance params:', req.params)
        var bscWeb3 = server.bscWeb3
        var address = req.params.address
        var bepToken = req.params.bepToken
        var contractAddress, abi

        if (!address) {
            logger.error('Address is empty')
            res.json({
                result: 'error',
                message: 'Address is empty',
            })
            return
        }
        if (!bscWeb3.utils.isAddress(address)) {
            logger.error('Invalid address')
            res.json({
                result: 'error',
                message: 'Invalid address',
            })
            return
        }
        if (!bepToken) {
            logger.error('Token is empty')
            res.json({
                result: 'error',
                message: 'Token is empty',
            })
            return
        }
        var index = server.bepTokens.findIndex(x => x.bepToken === bepToken.toLowerCase())
        if (index >= 0) {
            bepToken = bepToken.toLowerCase()
            contractAddress = server.bepTokens[index].contractAddress
        }
        if (!contractAddress) {
            logger.error('Unknown BEP Token')
            res.json({
                result: 'error',
                message: 'Unknown BEP Token',
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

        // Get bepToken balance
        contract.methods.balanceOf(address).call().then(function (amountResult) {
            // get token decimals
            contract.methods.decimals().call().then(function (decimalsResult) {
                // calculate amount for custome token decimals
                var value = parseInt(amountResult), decimals = parseInt(decimalsResult)
                var amount = value / 10 ** decimals
                var balance = amount + ' ' + bepToken.toUpperCase()
                logger.debug('BNB - BEP20 Token Balance:', balance)
                res.json({
                    result: 'success',
                    address: address,
                    balance: balance
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
        logger.error('bnbTokenBalance catch Error:', error)
        res.json({
            result: 'error',
            message: error.toString(),
        })
    }
}

module.exports = bnbTokenBalance