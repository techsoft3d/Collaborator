import { createStore, applyMiddleware, combineReducers } from 'redux';
import hc from './reducers/hcReducer';
import chat from "./reducers/chatReducer";
import users from "./reducers/userReducer";
import promiseMiddleware from 'redux-promise-middleware';


export default createStore(
    combineReducers({hc, chat, users}),
    applyMiddleware(promiseMiddleware())
);
