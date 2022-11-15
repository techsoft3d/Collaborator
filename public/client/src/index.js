import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import store from './js/store';
import App from './js/App';

import "./css/bootstrap/css/bootstrap.min.css";
import "./css/App.css";
import "./css/jquery-ui.min.css";

// Use Redux store to manage the state of the React application
ReactDOM.render(
    <Provider store={store}>
        <App/>
    </Provider>, 
    document.getElementById('app'));

