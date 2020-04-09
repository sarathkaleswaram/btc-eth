const bitcore = require('bitcore-lib')
var server = require('../server')

var btcPrivateKeyToAddress = function (req, res) {
    try {
        console.log('\nbtcPrivateKeyToAddress body:', req.body)
        var pKey = req.body.privateKey

        if (!pKey) {
            console.log('PrivateKey is empty')
            res.json({
                result: 'error',
                message: 'PrivateKey is empty',
            })
            return
        }
        if (!bitcore.PrivateKey.isValid(pKey, server.network)) {
            console.log('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }

        var privateKey = new bitcore.PrivateKey(pKey, server.network)
        var wif = privateKey.toWIF()
        var address = privateKey.toAddress()

        console.log({ address: address.toString(), privateKey: privateKey.toString() })

        res.json({
            result: 'success',
            address: address.toString(),
            privateKey: privateKey.toString()
        })
    } catch (error) {
        console.error('btcPrivateKeyToAddress catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = btcPrivateKeyToAddress