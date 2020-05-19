const mongoose = require('mongoose')
const Schema = mongoose.Schema

const transactionSchema = new Schema({
    type: { type: String, required: true },
    address: { type: String, required: true },
    from: { type: String, required: true },
    amount: { type: String, required: true },
    timeStamp: { type: Date, required: true },
    transactionHash: { type: String, required: true },
    blockHash: { type: String, required: true },
    blockNumber: { type: Number, required: true },
    fee: { type: String, required: true },
    createdDate: { type: Date, required: true }
})

module.exports = mongoose.model('transaction', transactionSchema)