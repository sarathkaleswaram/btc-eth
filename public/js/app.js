$(document).ready(function () {
    window.WebSocket = window.WebSocket || window.MozWebSocket
    var wsUrl = `ws://${window.location.host}`
    var connection = new WebSocket(wsUrl)
    var urlParams = new URLSearchParams(window.location.search)
    var address = urlParams.get('address')

    if (!window.WebSocket) {
        appendWsError()
    }

    connection.onopen = function () {
        console.log('Websocket connected.')
        connection.send(JSON.stringify({ address: address, status: 'connected' }))
    }

    connection.onerror = function (error) {
        appendWsError()
    }

    $(window).on('unload', function () {
        connection.send(JSON.stringify({ address: address, status: 'closed', ercToken: urlParams.get('ercToken') || undefined }))
    })

    connection.onmessage = function (message) {
        console.log(message.data)
        try {
            var message = JSON.parse(message.data)
            console.log(message)
            if (message.address === address) {
                if (message.type === 'submitted') {
                    console.log('Got submitted message')
                    $('#websocket-submitted-message').append(`
                        <div class='alert alert-primary'>
                            <strong>${message.title}</strong>
                            <p>${message.template}</p>
                            <p>${message.message}</p>
                        </div>
                    `)
                    setTimeout(function () {
                        window.location.replace(message.callbackUrl)
                    }, 3000)
                }
                if (message.type === 'confirmed') {
                    console.log('Got confirmed message')
                    $('#websocket-submitted-message').remove()
                    $('#websocket-confirmed-message').append(`
                        <div class='alert alert-success'>
                            <strong>${message.title}</strong>
                            <p>${message.message}</p>
                        </div>
                    `)
                    setTimeout(function () {
                        window.location.replace(message.callbackUrl)
                    }, 2000)
                }
            }
        } catch (e) {
            console.log(e)
            return
        }
    }

    function appendWsError() {
        $('#websocket-error').prepend(`
            <div class='alert alert-warning'>
                <strong>Unable to make WebSocket Connection.</strong>
                <p>Please submit transaction and close this Tab. Once transaction is confirmed, we will credit the amount.</p>
            </div>
        `)
    }

    $('#copy-clipboard').click(function () {
        var temp = $('<input>')
        $('body').append(temp)
        temp.val(address).select()
        document.execCommand('copy')
        temp.remove()
        alert('Copied address: ' + address)
    })
})