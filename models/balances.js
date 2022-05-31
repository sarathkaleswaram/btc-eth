const mongoose = require('mongoose')
const Schema = mongoose.Schema

const balanceSchema = new Schema({
    currency: { type: String, required: true },
    address: { type: String, required: true, unique: true },
    platform: { type: String },
    contractAddress: { type: String },
    balance: { type: String, required: true },
    updatedDate: { type: Date, required: true }
})

module.exports = mongoose.model('balance', balanceSchema)