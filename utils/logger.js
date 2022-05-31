const { createLogger, format, transports } = require('winston')

const { combine, timestamp, colorize, printf, json } = format

// ------------------------------------ logger start ------------------------------------
const printFormat = printf((info) => {
    let { level, message, timestamp, ...args } = info
    return `\x1b[30m[${timestamp}]\x1b[0m - ${level}: ${message} ${Object.keys(args).length ? '\x1b[33m: ' + JSON.stringify(args) + '\x1b[0m' : ''}`
})

const fileFormat = printf(({ level, message = '', timestamp, ...args }) => {
    return `[${timestamp}] - ${level}: ${message} ${Object.keys(args).length ? ': ' + JSON.stringify(args) : ''}`
})

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'silly', // https://github.com/winstonjs/winston#logging
    transports: [
        new transports.Console({
            format: combine(
                timestamp(),
                colorize(),
                printFormat,
            ),
        }),
        new transports.File({
            filename: 'logs/crypto.log',
            format: combine(
                timestamp(),
                fileFormat
            ),
        }),
    ],
})
// ------------------------------------ logger end ------------------------------------

// --------------------------------- access log start ----------------------------------
const accessFormat = combine(
    printf(({ message }) => {
        if (message) {
            return message.split(' ms ')[0].replace(/\u001b\[.*?m/g, '') + ' ms'
        }
    })
)

const accessLogger = createLogger({
    transports: [
        new transports.Console({
            format: combine(
                printf(({ message }) => {
                    return message
                })
            ),
        }),
        new transports.File({
            filename: 'logs/crypto.log',
            format: accessFormat
        }),
    ]
})

const accessStream = {
    write: (text) => {
        accessLogger.info(text.slice(0, -2))
    }
}
// --------------------------------- access log end ----------------------------------

exports.logger = logger
exports.accessStream = accessStream