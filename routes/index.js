var Routes = { }

// Bitcoin
Routes.btcCreate = require('./btc-create-account')
Routes.btcBalance = require('./btc-get-balance')
Routes.btcPrivateKeyToAddress = require('./btc-privateKey-to-account')
Routes.btcSend = require('./btc-send')
// // Ethereum
Routes.ethCreate = require('./eth-create-account')
Routes.ethBalance = require('./eth-get-balance')
Routes.ethPrivateKeyToAddress = require('./eth-privateKey-to-account')
Routes.ethSend = require('./eth-send')

module.exports = Routes
