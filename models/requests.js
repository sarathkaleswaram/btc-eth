const mongoose = require('mongoose')
const Schema = mongoose.Schema

const requestSchema = new Schema({
    type: { type: String, required: true },
    address: { type: String, required: true, unique: true },
    contractAddress: { type: String },
    token: { type: String, required: true },
    timestamp: { type: String, required: true },
    callback: { type: String, required: true },
    blocknumber: { type: Number, required: true },
    status: { type: String, required: true },
    createdDate: { type: Date, required: true }
})

module.exports = mongoose.model('request', requestSchema)