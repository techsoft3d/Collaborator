const chatReducer = (state = {
    messageList: [],
    newMessagesCount: 0,
    isOpen: false,
    inputActive: false,
}, action) => {
    switch (action.type) {
        case 'SHOW_CHAT':
            state = {
                ...state, 
                isOpen: !state.isOpen,
                newMessagesCount: (state.isOpen ? 0 : state.newMessagesCount)
            };
            break;
        case 'INPUT_ACTIVE':
            state = {
                ...state,
                inputActive: action.payload,
            }
            break;
        case 'MESSAGE_SUBMIT':
            action.payload.socket.emit('chat_message', action.payload.message);
            state = {
                ...state, 
                messageList: [...state.messageList, action.payload.message] // payload will be "message"
            }
            break;
        case 'MESSAGE_RECIEVED':
            state = {
                ...state,
                messageList: [...state.messageList, action.payload], // payload will be "message"
                newMessagesCount: ++state.newMessagesCount
            }
            break;
        case 'SYNC_MESSAGES':
            state = {
                ...state,
                messageList: [...state.messageList, ...action.payload], // payload will be "message"
            }
            break;
        default:
            break;
    }
    return state;
}

export default chatReducer