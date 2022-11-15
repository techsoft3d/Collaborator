
const userReducer = (state = {
    username: "Unknown User"
}, action) => {
    switch (action.type) {
        case 'ADD_USER':
            state = {
                ...state,
                username: action.payload
            }
            break;
        default:
    }
    return state
}

export default userReducer