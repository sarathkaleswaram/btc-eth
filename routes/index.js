var Routes = {}

// Pug
Routes.pugPage = require('./pug/pug-page')
Routes.pugRequests = require('./pug/pug-requests')
Routes.pugTransactions = require('./pug/pug-transactions')

// Bitcoin
Routes.btcCreate = require('./btc/btc-create-account')
Routes.btcBalance = require('./btc/btc-get-balance')
Routes.btcGetTx = require('./btc/btc-get-tx')
Routes.btcPrivateKeyToAddress = require('./btc/btc-privateKey-to-account')
Routes.btcSend = require('./btc/btc-send')
Routes.btcExchangeRates = require('./btc/btc-rates')

// Ethereum
Routes.ethCreate = require('./eth/eth-create-account')
Routes.ethBalance = require('./eth/eth-get-balance')
Routes.ethGetTx = require('./eth/eth-get-tx')
Routes.ethPrivateKeyToAddress = require('./eth/eth-privateKey-to-account')
Routes.ethSend = require('./eth/eth-send')
Routes.ethExchangeRates = require('./eth/eth-rates')
// Ethereum ERC20 Token
Routes.ethTokenBalance = require('./eth/eth-token-get-balance')
Routes.ethTokenSend = require('./eth/eth-token-send')
Routes.ethTokenExchangeRates = require('./eth/eth-token-rates')

// Ripple
Routes.xrpCreate = require('./xrp/xrp-create-account')
Routes.xrpBalance = require('./xrp/xrp-get-balance')
Routes.xrpGetTx = require('./xrp/xrp-get-tx')
Routes.xrpPrivateKeyToAddress = require('./xrp/xrp-privateKey-to-account')
Routes.xrpSend = require('./xrp/xrp-send')
Routes.xrpExchangeRates = require('./xrp/xrp-rates')
// Ripple Token
Routes.createToken = require('./xrp/create-token')
Routes.xrpTokenBalance = require('./xrp/xrp-token-get-balance')
Routes.xrpTokenTrustSet = require('./xrp/xrp-token-trustset')
Routes.xrpTokenSend = require('./xrp/xrp-token-send')

module.exports = Routes
