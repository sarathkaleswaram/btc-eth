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
const RippleAPI = require('ripple-lib').RippleAPI
var routes = require('./routes')
var { checkPendingRequests } = require('./transactions')
// var { btcWsOnMessage } = require('./transactions/btc-transaction')
var { makeTimeoutCallback } = require('./transactions/callback')

// Logger
var logger = log4js.getLogger('crypto')
logger.level = 'trace'

// mainnet or testnet
const isMainnet = process.env.IN_MAIN_NET || false // true, false

// Networks
const network = isMainnet ? 'mainnet' : 'testnet'
const ethNetwork = isMainnet ? 'mainnet' : 'ropsten'
const etherscanAPINetwork = isMainnet ? 'api' : 'api-ropsten'
const etherscanSubdomain = isMainnet ? '' : ethNetwork + '.'
const bscscanAPINetwork = isMainnet ? 'api' : 'api-testnet'
const btcChain = isMainnet ? 'main' : 'test3'
const btcWsNetwork = isMainnet ? 'ws' : 'testnet-ws'
const btcExplorerPath = isMainnet ? 'btc' : 'btc-testnet'

// Bitcoin Blockcypher URL
const btcAPI = `https://api.blockcypher.com/v1/btc/${btcChain}`
const btcWsAPI = `wss://${btcWsNetwork}.smartbit.com.au/v1/blockchain`
const btcExplorerUrl = `https://live.blockcypher.com/${btcExplorerPath}`

// ETH web3 API
const ethInfuraApiKey = isMainnet ? process.env.ETH_INFURA_API_KEY  : '605567f94946494a81e52ac8ca2784de'
const ethWeb3HttpUrl = `https://${ethNetwork}.infura.io/v3/${ethInfuraApiKey}`

// etherscan API
const etherscanApiKey = process.env.ETHER_SCAN_API_KEY
const etherscanAPI = `https://${etherscanAPINetwork}.etherscan.io/api?&apikey=${etherscanApiKey}`
const etherscanExplorerUrl = `https://${etherscanSubdomain}etherscan.io`

// BSC 
const bscscanApiKey = process.env.BSC_SCAN_API_KEY
const bscscanAPI = `https://${bscscanAPINetwork}.bscscan.com/api?&apikey=${bscscanApiKey}`
const bscscanExplorerUrl = isMainnet ? 'https://bscscan.com' : 'https://testnet.bscscan.com'
const bscWeb3HttpUrl = isMainnet ? 'https://bsc-dataseed1.binance.org:443' : 'https://data-seed-prebsc-1-s1.binance.org:8545'

// ripple API
const rippleRpcUrl = isMainnet ? 'https://s1.ripple.com:51234' : 'https://s.altnet.rippletest.net:51234'
const rippleWsUrl = isMainnet ? 'wss://s1.ripple.com' : 'wss://s.altnet.rippletest.net'
const xrpExplorerUrl = isMainnet ? 'https://livenet.xrpl.org' : 'https://testnet.xrpl.org'

// Game Callback URL
const jackpotCallbackURL = isMainnet ? 'https://api.jackpotvilla.com/transaction/crypto' : 'http://testapi.jackpotvilla.com/transaction/crypto'
const slotstitanCallbackURL = isMainnet ? 'https://api.slotstitan.com/transaction/crypto' : 'http://testapi.slotstitan.com/transaction/crypto'

// Bitcoin ws connection
// var btcWebsocket = new WebSocket(btcWsAPI)
// btcWebsocket.on('error', e => logger.error('BTC websocket connection error:', e))
// btcWebsocket.on('open', function () {
//     logger.debug('BTC Websocket connected')
//     btcWsOnMessage()
// })

// Ripple ws connection
const rippleApi = new RippleAPI({
    server: rippleWsUrl
})
rippleApi.on('connected', () => {
    logger.debug('Ripple Websocket connected')
})
rippleApi.on('disconnected', (code) => {
    logger.warn('Ripple Websocket disconnected, code:', code)
})
rippleApi.connect().then().catch(e => logger.error('Ripple websocket connection error:', e))

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
    },
    {
        ercToken: 'usdt',
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    },
]
var testERC20Tokens = [
    {
        ercToken: 'shar',
        contractAddress: '0x3d64cd48f4dBa0979a64C320C353198c7a28348E'
    }
]

// BSC - BEP20 Tokens
var bep20Tokens = [
    {
        bepToken: 'inrt',
        contractAddress: '0x90ED4BB7B18376D63175C93d4726Edd19Fd794Ce'
    },
    {
        bepToken: 'busd',
        contractAddress: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
    },
]
var testBEP20Tokens = [
    {
        bepToken: 'shar',
        contractAddress: '0x90ED4BB7B18376D63175C93d4726Edd19Fd794Ce'
    }
]

// XRP token
var liveXrpTokens = [
    {
        name: 'inrte',
        currency: '494E525465000000000000000000000000000000',
        issuer: 'rLTiYszrPm2RCREw9hfLXbwivau9Bx35Ui'
    },
    {
        name: 'csc',
        currency: 'CSC',
        issuer: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr'
    },
]
var testXrpTokens = [
    {
        name: 'sha',
        currency: 'SHA',
        issuer: 'rJSd4PtTvmRsudjQF5E2wS3yhq1Vfu3Jk2'
    },
]

// tokens
var ercTokens = isMainnet ? erc20Tokens : testERC20Tokens
var bepTokens = isMainnet ? bep20Tokens : testBEP20Tokens
var xrpTokens = isMainnet ? liveXrpTokens : testXrpTokens

// Exports
// btc
exports.network = network
exports.btcAPI = btcAPI
exports.btcExplorerUrl = btcExplorerUrl
exports.btcWebsocket = undefined// btcWebsocket
// eth
exports.ethNetwork = ethNetwork
exports.etherscanAPI = etherscanAPI
exports.etherscanExplorerUrl = etherscanExplorerUrl
exports.web3 = new Web3(new Web3.providers.HttpProvider(ethWeb3HttpUrl))
exports.ercTokens = ercTokens
// bnb
exports.bscWeb3 = new Web3(new Web3.providers.HttpProvider(bscWeb3HttpUrl))
exports.bscscanAPI = bscscanAPI
exports.bscscanExplorerUrl = bscscanExplorerUrl
exports.bepTokens = bepTokens
// xrp
exports.rippleRpcUrl = rippleRpcUrl
exports.rippleWsUrl = rippleWsUrl
exports.rippleApi = rippleApi
exports.xrpExplorerUrl = xrpExplorerUrl
exports.xrpTokens = xrpTokens
// game
exports.jackpotCallbackURL = jackpotCallbackURL
exports.slotstitanCallbackURL = slotstitanCallbackURL

// Mongodb
var mongoUser = process.env.MONGO_USER
var mongoPass = process.env.MONGO_PASS || 'hello123'
var mongoHost = process.env.MONGO_HOST || '127.0.0.1'
var mongoPort = process.env.MONGO_PORT || '27017'
var mongoUserPass = mongoUser ? (mongoUser + ':' + mongoPass + '@') : ''

var mongoUrl = `mongodb://${mongoUserPass}${mongoHost}:${mongoPort}/${isMainnet ? 'btc_eth_live' : 'btc_eth_test'}?authSource=admin&w=1`
mongoose.set('debug', true)
mongoose.connect(mongoUrl, { useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true })
    .then(() => {
        logger.info('Mongodb Connected!')
        checkPendingRequests()
    })
    .catch(error => logger.error(error))

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
app.get('/btc/tx/:tx', routes.btcGetTx)

// Ethereum
app.get('/eth/create', routes.ethCreate)
app.get('/eth/balance/:address', routes.ethBalance)
app.post('/eth/privatekey-to-address', routes.ethPrivateKeyToAddress)
app.post('/eth/send', routes.ethSend)
app.get('/eth/rates', routes.ethExchangeRates)
app.get('/eth/tx/:tx', routes.ethGetTx)
// ERC20 Token
app.get('/eth/ercToken/:ercToken/balance/:address', routes.ethTokenBalance)
app.post('/eth/ercToken/:ercToken/send', routes.ethTokenSend)
app.get('/eth/ercToken/:ercToken/rates', routes.ethTokenExchangeRates)

// Binance
app.get('/bnb/create', routes.bnbCreate)
app.get('/bnb/balance/:address', routes.bnbBalance)
app.post('/bnb/privatekey-to-address', routes.bnbPrivateKeyToAddress)
app.post('/bnb/send', routes.bnbSend)
app.get('/bnb/rates', routes.bnbExchangeRates)
app.get('/bnb/tx/:tx', routes.bnbGetTx)
// BEP20 Token
app.get('/bnb/bepToken/:bepToken/balance/:address', routes.bnbTokenBalance)
app.post('/bnb/bepToken/:bepToken/send', routes.bnbTokenSend)
app.get('/bnb/bepToken/:bepToken/rates', routes.bnbTokenExchangeRates)

// Ripple
app.get('/xrp/create', routes.xrpCreate)
app.get('/xrp/balance/:address', routes.xrpBalance)
app.post('/xrp/privatekey-to-address', routes.xrpPrivateKeyToAddress)
app.post('/xrp/send', routes.xrpSend)
app.get('/xrp/rates', routes.xrpExchangeRates)
app.get('/xrp/tx/:tx', routes.xrpGetTx)
// Ripple Token
app.post('/xrp/create-token', routes.createToken)
app.get('/xrp/xrpToken/:xrpToken/balance/:address', routes.xrpTokenBalance)
app.post('/xrp/xrpToken/:xrpToken/trustset', routes.xrpTokenTrustSet)
app.post('/xrp/xrpToken/:xrpToken/send', routes.xrpTokenSend)

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