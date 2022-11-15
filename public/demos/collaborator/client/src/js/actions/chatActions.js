export const showChat = () => ({
    type: 'SHOW_CHAT',
})

export const changeInputActive = (focus) => ({
    type: 'INPUT_ACTIVE',
    payload: focus,
})

export const messageSubmit = (message, socket) => ({
    type: 'MESSAGE_SUBMIT',
    payload: {
        message: message,
        socket: socket
    }
})

export const messageRecieved = (message) => ({
    type: 'MESSAGE_RECIEVED',
    payload: message
})

export const syncMessages = (messageList) => ({
    type: 'SYNC_MESSAGES',
    payload: messageList
})