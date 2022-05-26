# BTC, ETH - (ERC20) - Payment Gateway

## Links

### Bitcoin
https://www.blockcypher.com/dev/bitcoin/?javascript#restful-resources

https://sochain.com/api#networks-supported

### Ethereum
https://infura.io/

https://web3js.readthedocs.io/en/v1.2.6/

https://medium.com/@codetractio/inside-an-ethereum-transaction-fa94ffca912f

### Binance Smart Chain
https://docs.binance.org/smart-chain/wallet/metamask.html

https://gist.github.com/sarathkaleswaram/a69c51df416e71d541062e5d9191d44e

https://docs.binance.org/smart-chain/developer/BEP20.html

https://vittominacori.github.io/bep20-generator/create-token/

### Ripple
https://xrpl.org/docs.html

https://xrpl.org/xrp-testnet-faucet.html

### Exchange Rate API
https://min-api.cryptocompare.com/documentation

https://www.coingecko.com/en/api

## Install and run
```sh
npm install
npm start
```
### Docker 
```sh
docker build . -t btc-eth-xrp-api
docker-compose down; docker-compose up -d
```

Open link by passing params
```
type
address
token
timestamp
callback
```

### Create and Send Transactions

## API

Networks two types 
1. mainnet
2. testnet

Update in server.js 
```js
const isMainnet = false // true, false
```

### Bitcoin
```json
GET: /btc/create
Response:
{
    "result": "success",
    "address": "mzoSPDUVCERaF8wWf8zrwdyVh6WmV1GNj5",
    "privateKey": "5cfc0b8079885d2f14928617e1dcaf465536adc085440bcc72e591c4ae286408"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /btc/balance/:address
Response: 
{
    "result": "success",
    "address": "mzoSPDUVCERaF8wWf8zrwdyVh6WmV1GNj5",
    "balance": "0 BTC"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /btc/privatekey-to-address
body: 
{
	"privateKey": "5cfc0b8079885d2f14928617e1dcaf465536adc085440bcc72e591c4ae286408"
}
Response:
{
    "result": "success",
    "address": "mzoSPDUVCERaF8wWf8zrwdyVh6WmV1GNj5",
    "privateKey": "5cfc0b8079885d2f14928617e1dcaf465536adc085440bcc72e591c4ae286408"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /btc/send
body: 
{
	"sourceAddress": "mvTCUx2LZFqnAao1xhK8U6coyJQPSpUbm6",
	"privateKey": "cd546366333e84fa4e8e1fb922b328ef5c5a310358b3b5658d4e2634ae637bdd",
	"destinationAddress": "n3fT9kMiLBXWGWDuGgCwyqe12jk2zTuq1b",
	"amount": 0.010
}
Response:
{
    "result": "success",
    "transactionHash": "bfd1fc353af445b8143afc6635300a6e416901b9e696da840ca0a1354fe17a55",
    "link": "https://live.blockcypher.com/btc-testnet/tx/bfd1fc353af445b8143afc6635300a6e416901b9e696da840ca0a1354fe17a55"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /btc/rates
Response: 
{
    "result": "success",
    "data": {
        "AUD": 13582.23,
        "EUR": 8095.39,
        "GBP": 7107.14,
        "BGN": 26540.33,
        "HRK": 58550.78,
        "CZK": 224316,
        "DKK": 54153.15,
        "HUF": 3152855.7,
        "INR": 684300.04,
        "PLN": 37373.36,
        "RON": 40314.16,
        "SEK": 119044.78,
        "USD": 8738.96
    }
}
```

### Ethereum
```json
GET: /eth/create'
Response:
{
    "result": "success",
    "address": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
    "privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /eth/balance/:address
Response:
{
    "result": "success",
    "address": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
    "balance": "0 ETH"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /eth/privatekey-to-address
body:
{
	"privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9"
}
Response:
{
    "result": "success",
    "address": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
    "privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /eth/send
body:
{
	"sourceAddress": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
	"privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9",
	"destinationAddress": "0x1bdE485751FC4552e9d727f22038945D3D2ddaD9",
	"amount": 1.10
}
Response:
{
    "result": "success",
    "transactionHash": "0x8514cc130412ae0764ec6660ea3e885f2dcfdde70847a9717f576fa9406686f8",
    "link": "https://ropsten.etherscan.io/tx/0x8514cc130412ae0764ec6660ea3e885f2dcfdde70847a9717f576fa9406686f8"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /eth/rates
Response: 
{
    "result": "success",
    "data": {
        "AUD": 293.74,
        "EUR": 174.56,
        "GBP": 153.23,
        "BGN": 571.94,
        "HRK": 1261.77,
        "CZK": 4838.84,
        "DKK": 1167,
        "HUF": 67944.04,
        "INR": 14746.67,
        "PLN": 808.72,
        "RON": 868.77,
        "SEK": 2565.42,
        "USD": 188.48
    }
}
```

### ERC20 Token API
- Available tokens:
    - Live: JAN, GRT, SATX, USDT, SHIB, MATIC, DAI, SAND, LINK, MKR
    - Test: SHAR
```json
GET: /eth/ercToken/:token/balance/:address
Response:
{
    "result": "success",
    "address": "0xe75F5C9C9177fC3553Db4332F419b91d2A3D6Edc",
    "balance": "160.73000000000000002 SHAR"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /eth/ercToken/:token/send
body:
{
	"sourceAddress": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
	"privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9",
	"destinationAddress": "0x1bdE485751FC4552e9d727f22038945D3D2ddaD9",
	"amount": 10
}
Response:
{
    "result": "success",
    "transactionHash": "0x8514cc130412ae0764ec6660ea3e885f2dcfdde70847a9717f576fa9406686f8",
    "link": "https://ropsten.etherscan.io/tx/0x8514cc130412ae0764ec6660ea3e885f2dcfdde70847a9717f576fa9406686f8"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /eth/ercToken/:token/rates
Response: 
{
    "result": "success",
    "data": {
        "AUD": 0.00290575,
        "EUR": 0.00172937,
        "GBP": 0.00153558,
        "CZK": 0.04771592,
        "DKK": 0.01289692,
        "HUF": 0.613377,
        "INR": 0.141817,
        "PLN": 0.00789246,
        "SEK": 0.01844144,
        "USD": 0.0018679
    }
}
```

### Binance
```json
GET: /bnb/create'
Response:
{
    "result": "success",
    "address": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
    "privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /bnb/balance/:address
Response:
{
    "result": "success",
    "address": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
    "balance": "0 BNB"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /bnb/privatekey-to-address
body:
{
	"privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9"
}
Response:
{
    "result": "success",
    "address": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
    "privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /bnb/send
body:
{
	"sourceAddress": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
	"privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9",
	"destinationAddress": "0x1bdE485751FC4552e9d727f22038945D3D2ddaD9",
	"amount": 1.10
}
Response:
{
    "result": "success",
    "transactionHash": "0xafa24d0ca326981113e1c4eaea3c5f24e6a510c863e9d5a37542ab62cd46fa3b",
    "link": "https://testnet.bscscan.com/tx/0xafa24d0ca326981113e1c4eaea3c5f24e6a510c863e9d5a37542ab62cd46fa3b"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /bnb/rates
Response: 
{
    "result": "success",
    "data": {
        "AUD": 640.22,
        "EUR": 409.35,
        "GBP": 346.68,
        "BGN": 798.94,
        "HRK": 3420.15,
        "CZK": 10425.58,
        "DKK": 3326.7,
        "HUF": 171660.66,
        "INR": 37800.08,
        "PLN": 1863.9,
        "RON": 1796.86,
        "SEK": 4460.42,
        "USD": 475.08,
        "CAD": 587.31
    }
}
```

### BEP20 Token API
- Available tokens:
    - Live: INRT, ZINR, DOGE, ADA, BUSD, EOS, BCH
    - Test: SHAR
```json
GET: /bnb/bepToken/:token/balance/:address
Response:
{
    "result": "success",
    "address": "0xe75F5C9C9177fC3553Db4332F419b91d2A3D6Edc",
    "balance": "1000 SHAR"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /bnb/bepToken/:token/send
body:
{
	"sourceAddress": "0x7405e4BeD34470647E8012DE5677FB99330Bd726",
	"privateKey": "0x4611fb35ed2de79f8c480b670ed714f5f5ee111cf026a5e3ad2c412801b7a7b9",
	"destinationAddress": "0x1bdE485751FC4552e9d727f22038945D3D2ddaD9",
	"amount": 10
}
Response:
{
    "result": "success",
    "transactionHash": "0xd1db98fddf89e4e93d775ffbb67dec4e9ad4b5c183423574df3c6c3abbe409ab",
    "link": "https://testnet.bscscan.com/tx/0xd1db98fddf89e4e93d775ffbb67dec4e9ad4b5c183423574df3c6c3abbe409ab"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /bnb/bepToken/:token/rates
Response: 
{
    "result": "success",
    "data": {
        "AUD": 1.35,
        "EUR": 0.863105,
        "GBP": 0.73174,
        "CZK": 21.92,
        "DKK": 6.42,
        "HUF": 310.41,
        "INR": 75.44,
        "PLN": 3.95,
        "SEK": 8.65,
        "USD": 1,
        "CAD": 1.24
    }
}
```

### Ripple
```json
GET: /xrp/create
Response:
{
    "result": "success",
    "address": "rJ3KHntGgiYjxFxesUbM1S4sWkMeeZ9V9x",
    "privateKey": "shCtJaKdcV9Q6b9JjW1oj6gurvoJ3"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /xrp/balance/:address
Response: 
{
    "result": "success",
    "address": "rJYNf78FeT4XTtiv2DYmYWVjQGbtgT3JwW",
    "balance": "21.999976 XRP"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /xrp/privatekey-to-address
body: 
{
	"privateKey": "shCtJaKdcV9Q6b9JjW1oj6gurvoJ3"
}
Response:
{
    "result": "success",
    "address": "rJ3KHntGgiYjxFxesUbM1S4sWkMeeZ9V9x",
    "privateKey": "shCtJaKdcV9Q6b9JjW1oj6gurvoJ3"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /xrp/send
body: 
{
	"sourceAddress": "r48A5QEjUfvwuLYRGPrZuTmtbfYNzJShjQ",
	"privateKey": "ss3mpHJs2q8cudY9rbS8MgUBa8P88",
	"destinationAddress": "rJ3KHntGgiYjxFxesUbM1S4sWkMeeZ9V9x",
	"amount": 10
}
Response:
{
    "result": "success",
    "transactionHash": "30635B5D3946DCE85A8B4748BB195D2A8CF7F8A8B53A47A14E0CE07433F59AF7",
    "link": "https://testnet.xrpl.org/transactions/30635B5D3946DCE85A8B4748BB195D2A8CF7F8A8B53A47A14E0CE07433F59AF7"
}
-------------------------------------------------------------------------------------------------------------------------------------
GET: /xrp/rates
Response: 
{
    "result": "success",
    "data": {
        "AUD": 1.316,
        "EUR": 0.8172,
        "GBP": 0.706,
        "BGN": 1.663,
        "HRK": 6.948,
        "CZK": 20.79,
        "DKK": 4.868,
        "HUF": 329.13,
        "INR": 76.03,
        "PLN": 3.802,
        "RON": 4.279,
        "SEK": 9.118,
        "USD": 0.9491,
        "CAD": 1.205
    }
}
```

### XRP Token API
- Available tokens:
    - Live: INRTE, CSC
    - Test: SHA
```json
GET: /xrp/xrpToken/:token/balance/:address
Response:
{
    "result": "success",
    "address": "rhEW6Sy9m84jJaYS4MWUHtFD519BaB64ak",
    "balance": "100 SHA"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /xrp/xrpToken/:token/trustset
body:
{
	"address": "raS7ykHyH3QBS9SncHiZYc1dR5aS9mB9pD",
	"privateKey": "spkGNWRJ3YkebS2LiFwxNeFieDvTq",
	"limitAmount": 1000000
}
Response:
{
    "result": "success",
    "transactionHash": "2E1A5BFDA7270F6CDCC00606509D1A91F5CC2E5E96EFFB29F9F1E61E7A7C857C",
    "link": "https://testnet.xrpl.org/transactions/2E1A5BFDA7270F6CDCC00606509D1A91F5CC2E5E96EFFB29F9F1E61E7A7C857C"
}
-------------------------------------------------------------------------------------------------------------------------------------
POST: /xrp/xrpToken/:token/send
body:
{
	"sourceAddress": "rKwXKnSd8DfmMgzAASbDZP141cFmRkQ3cC",
	"privateKey": "shsJcgAfwwQnPqDUKNScDnQdszzyW",
	"destinationAddress": "raS7ykHyH3QBS9SncHiZYc1dR5aS9mB9pD",
	"amount": 10
}
Response:
{
    "result": "success",
    "transactionHash": "AAE9A792E66CB45966700C67C7C3075816F7C4F4D3E3BB907C8AE840293D5E21",
    "link": "https://testnet.xrpl.org/transactions/AAE9A792E66CB45966700C67C7C3075816F7C4F4D3E3BB907C8AE840293D5E21"
}
```

### API Error 
```json
{
    "result": "error",
    "message": "Insufficient funds"
}
```