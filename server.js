const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const compression = require('compression')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Web3 = require('web3')
const path = require('path')
const log4js = require('log4js')
const WebSocket = require('ws')
const CronJob = require('cron').CronJob
var routes = require('./routes')
var requests = require('./models/requests')
var { checkPendingRequests } = require('./transactions')
var { btcWsOnMessage } = require('./transactions/btc-transaction')
var { makeTimeoutCallback } = require('./transactions/callback')

// Logger
var logger = log4js.getLogger('btc-eth')
logger.level = 'trace'

// mainnet or testnet
const isMainnet = false // true, false

// Networks
const network = isMainnet ? 'mainnet' : 'testnet'
const ethNetwork = isMainnet ? 'mainnet' : 'ropsten'
const etherscanAPINetwork = isMainnet ? 'api' : 'api-ropsten'
const etherscanSubdomain = isMainnet ? '' : ethNetwork + '.'
const btcChain = isMainnet ? 'main' : 'test3'
const btcWsNetwork = isMainnet ? 'ws' : 'testnet-ws'
const btcExplorerPath = isMainnet ? 'btc' : 'btc-testnet'

// Bitcoin Blockcypher URL
const btcAPI = `https://api.blockcypher.com/v1/btc/${btcChain}`
const btcWsAPI = `wss://${btcWsNetwork}.smartbit.com.au/v1/blockchain`
const btcExplorerUrl = `https://live.blockcypher.com/${btcExplorerPath}`

// web3 API
const ethInfuraApiKey = isMainnet ? '3c4d6cb30db54dd1b10bd5fc3cb422b8' : '605567f94946494a81e52ac8ca2784de'
const web3HttpUrl = `https://${ethNetwork}.infura.io/v3/${ethInfuraApiKey}`

// etherscan API
const etherscanApiKey = '1R2ACZ69YGQQ4DVH8SPUEXAZTWV3G415IM'
const etherscanAPI = `https://${etherscanAPINetwork}.etherscan.io/api?&apikey=${etherscanApiKey}`
const etherscanExplorerUrl = `https://${etherscanSubdomain}etherscan.io`

// Game Callback URL
const gameCallbackURL = isMainnet ? 'https://api.jackpotvilla.com/transaction/crypto' : 'http://testapi.jackpotvilla.com/transaction/crypto'

// Bitcoin ws connection
var btcWebsocket = new WebSocket(btcWsAPI)
btcWebsocket.on('error', e => logger.error('BTC websocket connection error:', e))
btcWebsocket.on('open', function () {
    logger.debug('BTC Websocket connected')
    btcWsOnMessage()
})

// ETH Tokens
var erc20Tokens = [
    {
        ercToken: 'jan',
        contractAddress: '0xAf80e6612D9C2E883122e7F2292Ee6C34176ad4F'
    },
    {
        ercToken: 'grt',
        contractAddress: '0xb83Cd8d39462B761bb0092437d38b37812dd80A2'
    },
    {
        ercToken: 'satx',
        contractAddress: '0xe96F2c381E267a96C29bbB8ab05AB7d3527b45Ab'
    }
]
var testERC20Tokens = [
    {
        ercToken: 'shar',
        contractAddress: '0x3d64cd48f4dBa0979a64C320C353198c7a28348E'
    }
]

var ercTokens = isMainnet ? erc20Tokens : testERC20Tokens
// Exports
exports.network = network
exports.ethNetwork = ethNetwork
exports.etherscanAPI = etherscanAPI
exports.etherscanExplorerUrl = etherscanExplorerUrl
exports.btcAPI = btcAPI
exports.btcExplorerUrl = btcExplorerUrl
exports.btcWebsocket = btcWebsocket
exports.web3 = new Web3(new Web3.providers.HttpProvider(web3HttpUrl))
exports.ercTokens = ercTokens
exports.gameCallbackURL = gameCallbackURL

// Mongodb
var mongoUrl = `mongodb://127.0.0.1:27017/${isMainnet ? 'btc_eth_live' : 'btc_eth_test'}`
mongoose.connect(mongoUrl, { useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true })
    .then(() => {
        logger.info('Mongodb Connected!')
        checkPendingRequests()
    })
    .catch(err => logger.error(err))

// Cron Job runs every 5 mins
var job = new CronJob('*/5 * * * *', function () {
    checkPendingRequests()
})
job.start()

// Express
const app = express()
const port = isMainnet ? 8001 : 8000

app.use(cors())
app.use(compression())
app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// Public files
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Pug Page
app.get('/', routes.pugPage)
app.get('/requests', routes.pugRequests)
app.get('/transactions', routes.pugTransactions)

// Bitcoin
app.get('/btc/create', routes.btcCreate)
app.get('/btc/balance/:address', routes.btcBalance)
app.post('/btc/privatekey-to-address', routes.btcPrivateKeyToAddress)
app.post('/btc/send', routes.btcSend)
app.get('/btc/rates', routes.btcExchangeRates)

// Ethereum
app.get('/eth/create', routes.ethCreate)
app.get('/eth/balance/:address', routes.ethBalance)
app.post('/eth/privatekey-to-address', routes.ethPrivateKeyToAddress)
app.post('/eth/send', routes.ethSend)
app.get('/eth/rates', routes.ethExchangeRates)
// ERC20 Token
app.get('/eth/ercToken/:ercToken/balance/:address', routes.ethTokenBalance)
app.post('/eth/ercToken/:ercToken/send', routes.ethTokenSend)
app.get('/eth/ercToken/:ercToken/rates', routes.ethTokenExchangeRates)

// 404
app.get('/*', (_, res) => {
    res.json({ result: 'error', message: 'Invalid Request' })
})
app.post('/*', (_, res) => {
    res.json({ result: 'error', message: 'Invalid Request' })
})

// Http
var server = app.listen(port, () => {
    logger.info(`Http Server running on port ${port}`)
})
// Websocket
var wss = new WebSocket.Server({ server })
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        message = JSON.parse(message)
        if (message.status === 'Connected') {
            logger.trace(`Address: ${message.address} is connected through Websocket`)
        }
        // user QR window timeout
        if (message.status === 'Timeout') {
            logger.trace(`Address: ${message.address} window timeout`)
            // make timeout callback
            makeTimeoutCallback(message.address)
        }
    })
})
wss.on('listening', function listen() {
    logger.info(`Websocket server running on port ${port}`)
})
// export wss
exports.wss = wss