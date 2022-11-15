import React, {Component} from 'react';
import ts3dlogo from "../../img/ts3d_logo.png";
import hclogo from "../../img/hc.png";


export default class Header extends Component {

    render() {
        return (
            <header id="logo-head">
            <span id="ts3dlogo">
                <img alt="logo" src={ts3dlogo}></img>
            </span>
            <span id="hclogo">
                <img alt="hc" src={hclogo} ></img>
            </span>
            </header>
        );
    }

}