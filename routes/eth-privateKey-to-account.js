var server = require('../server')

var ethPrivateKeyToAddress = function (req, res) {
    try {
        console.log('\nethPrivateKeyToAddress body:', req.body)
        var web3 = server.web3
        var privateKey = req.body.privateKey
        var account

        if (!privateKey) {
            console.log('PrivateKey is empty')
            res.json({
                result: 'error',
                message: 'PrivateKey is empty',
            })
            return
        }
        try {
            account = web3.eth.accounts.privateKeyToAccount(privateKey)
        } catch (error) {
            console.log('Invalid PrivateKey')
            res.json({
                result: 'error',
                message: 'Invalid PrivateKey',
            })
            return
        }

        res.json({
            result: 'success',
            address: account.address,
            privateKey: account.privateKey
        })
    } catch (error) {
        console.error('ethPrivateKeyToAddress catch Error:', error)
        res.json({
            result: 'error',
            message: error,
        })
    }
}

module.exports = ethPrivateKeyToAddress