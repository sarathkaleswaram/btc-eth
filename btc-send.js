const bitcore = require("bitcore-lib");
const request = require("request");

// Sender Details
var fromAddress = "17hFoVScNKVDfDTT6vVhjYwvCu6iDEiXC4";
var fromPrivateKey = "L1Kzcyy88LyckShYdvoLFg1FYpB5ce1JmTYtieHrhkN65GhVoq73";
// Send Ether Amount
var sendAmount = 0.10;
// Receiver Details
var toAddress = "15yQViNBTUjP4yxrmQiPCBusc8CaSkSbDv"; // private key = L2VmnFeD8ckaYeKR93A1jsBQC7xp1CzNzc5VscWagQAMESTkiD4w

async function transferFund(sendersData, receiverData, amountToSend) {
    return new Promise(async (resolve, reject) => {
        validateAddress(sendersData.address, function (isAddressValid) {
            if (isAddressValid == 0) {
                return reject("Destination address invalid");
            } else {
                validatePrivateKey(sendersData.privateKey, function (isPkValid) {
                    if (isPkValid == 0) {
                        return reject("Private Key invalid");
                    } else {
                        convertPK(sendersData.privateKey, function (convertedAddress) {
                            // get Unspent transaction output
                            getUTXO(convertedAddress, function (result, feeAmt, amountToSend) {
                                if (result == 1) {
                                    return reject("No UTXO");
                                } else if (result == 2) {
                                    return reject("Source offline");
                                } else if (result == 3) {
                                    return reject("Insufficient funds to pay fee");
                                } else {
                                    buildTX(result, feeAmt, amountToSend, sendersData.privateKey, receiverData.address, function (payloadTx) {
                                        // broadcast transaction
                                        pushTX(payloadTx, function (txdone) {
                                            if (txdone !== 1) {
                                                console.log("TX ID: " + txdone);
                                                resolve(txdone);
                                            } else {
                                                return reject("Broadcast failed try later");
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
            }
        });
    });
}

function validateAddress(output, result) {
    addressValue = output.replace(/[^\w\s]/gi, '');
    if (bitcore.Address.isValid(addressValue)) {
        result(1);
    } else {
        result(0);
    }
}

function convertPK(pkeyValue, result) {
    var address = new bitcore.PrivateKey(pkeyValue).toAddress();
    result(address);
}

function validatePrivateKey(wif, result) {
    pkeyValue = wif.replace(/[^\w\s]/gi, '');
    if (bitcore.PrivateKey.isValid(pkeyValue)) {
        result(1);
    } else {
        result(0);
    }
}

function getUTXO(address, callback) {
    request({
        url: "https://chain.so/api/v2/get_tx_unspent/btc/" + address,
        json: true
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (body.data.txs.length < 1) {
                //no utxos
                console.log("no utxo");
                var err = 1;
                callback(err);
            }
            var status = body.status;
            var num = body.data.txs.length;
            var utxos = [];
            var totalSats = 0;
            var txSize = 44;
            //loop through all UTXOs
            for (i = 0; i < num; i++) {
                var convertSats = body.data.txs[i].value * 100000000;
                convertSats = parseInt(convertSats);

                var utxo = {
                    "txId": body.data.txs[i].txid,
                    "outputIndex": body.data.txs[i].output_no,
                    "address": address,
                    "script": body.data.txs[i].script_hex,
                    "satoshis": convertSats
                };
                utxos.push(utxo);
                totalSats = totalSats + convertSats;
                //calc tx size for fee
                txSize = txSize + 180;
            }; //end utxo loop
            getBestFee(function (bestHourFee) {
                var fee = txSize * bestHourFee;
                totalSats = totalSats - fee;
                console.log(totalSats);
                console.log(fee);
                if (totalSats < 1) {
                    //not enough funds to send
                    var err = 3;
                    callback(err);
                } else {
                    callback(utxos, fee, totalSats);
                }
            });
        } else {
            //err or no response from api
            console.log("no response from api");
            var error = 2;
            callback(error);
        }
    });
}

//build transaction
function buildTX(utxo, fee, total, pkeyValue, output, callback) {
    var transaction = new bitcore.Transaction()
        .from(utxo)
        .to(output, total)
        .sign(pkeyValue);

    //payload to push tx
    var txjson = transaction.toString();
    var pload = {
        "tx": txjson
    };
    callback(pload);
}


//push transaction
function pushTX(pload, callback) {
    request({
        url: "https://api.blockcypher.com/v1/btc/main/txs/push",
        method: "POST",
        json: true,
        headers: { "content-type": "application/json" },
        body: pload
    }, function (err, response, body) {
        if (err) {
            //no response or error POST to chainso
            callback(1);
        } else {
            console.log(JSON.stringify(body));
            completeTxId = body.tx.hash;
            console.log("done");
            callback(completeTxId);
        }
    });
}

function getBestFee(bestFee) {
    var findfee = "https://bitcoinfees.21.co/api/v1/fees/recommended";
    request({
        url: findfee,
        json: true
    }, function (error, response, body) {
        if (!body.hourFee) {
            //no response from api use 150 sats per byte
            var fee = 150;
            bestFee(fee);
        }
        if (body.hourFee) {
            var fee = body.hourFee;
            fee = fee * 0.5;
            fee = Math.ceil(fee);
            bestFee(fee);
        }
    });
}

transferFund({ address: fromAddress, privateKey: fromPrivateKey }, { address: toAddress }, sendAmount)
    .then(data => console.log(data))
    .catch(error => console.error(error));
