var Routes = {}

// Pug
Routes.pugPage = require('./pug-page')
Routes.pugRequests = require('./pug-requests')
Routes.pugTransactions = require('./pug-transactions')
// Bitcoin
Routes.btcCreate = require('./btc-create-account')
Routes.btcBalance = require('./btc-get-balance')
Routes.btcPrivateKeyToAddress = require('./btc-privateKey-to-account')
Routes.btcSend = require('./btc-send')
Routes.btcExchangeRates = require('./btc-rates')
// Ethereum
Routes.ethCreate = require('./eth-create-account')
Routes.ethBalance = require('./eth-get-balance')
Routes.ethPrivateKeyToAddress = require('./eth-privateKey-to-account')
Routes.ethSend = require('./eth-send')
Routes.ethExchangeRates = require('./eth-rates')
// Ethereum ERC20 Token
Routes.ethTokenBalance = require('./eth-token-get-balance')
Routes.ethTokenSend = require('./eth-token-send')
Routes.ethTokenExchangeRates = require('./eth-token-rates')

module.exports = Routes
