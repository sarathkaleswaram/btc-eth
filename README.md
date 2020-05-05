# BTC, ETH - Payment Gateway

### Create and Send Transactions

## Links

### Bitcoin
https://www.blockcypher.com/dev/bitcoin/?javascript#restful-resources

https://sochain.com/api#networks-supported

### Ethereum
https://infura.io/

https://web3js.readthedocs.io/en/v1.2.6/


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
```

### API Error 
```json
{
    "result": "error",
    "message": "Insufficient funds"
}
```