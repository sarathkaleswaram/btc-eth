$(document).ready(function () {
    window.WebSocket = window.WebSocket || window.MozWebSocket
    var wsUrl = `ws://${window.location.host}`
    var connection = new WebSocket(wsUrl)

    var address = $('#copy-address').text().trim()

    if (!window.WebSocket) {
        appendWsError()
    }

    connection.onopen = function () {
        console.log('Websocket connected.')
        connection.send(address)
    }

    connection.onerror = function (error) {
        appendWsError()
    }

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
            console.log('This doesn\'t look like a valid JSON: ', message.data)
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