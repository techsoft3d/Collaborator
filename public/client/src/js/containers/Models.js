import React, { Component } from 'react';
import { connect } from 'react-redux';
import moto from "../../img/image_data/moto.png";
import microengine from "../../img/image_data/microengine.png";
import landinggear from "../../img/image_data/landinggear.png";
import hotelfloorplan from "../../img/image_data/HotelFloorplan.png";
import arboleda from "../../img/image_data/arboleda.png";

class Models extends Component {

    handleSelection(e) {
        e.preventDefault();
        let model = e.target.id;
        if (model !== "modelThumbnails") {
            this.props.socket.emit('changeModel', model);
        }
    }

    render() {
        return (
            <div id="modelThumbnails" onClick = {this.handleSelection.bind(this)}>
                <a href="" className="thumbnail">
                    <img id="moto" alt="moto" src={moto}></img>
                </a>
                <a href="" className="thumbnail">
                    <img id="microengine" alt="microengine" src={microengine}></img>
                </a>
                <a href="" className="thumbnail" >
                    <img id="landing-gear-main-shaft" alt="landing-gear-main-shaft" src={landinggear}></img>
                </a>
                <a href="" className="thumbnail" >
                    <img id="HotelFloorplan" alt="HotelFloorplan" src={hotelfloorplan}></img>
                </a>
                <a href="" className="thumbnail" >
                    <img id="arboleda" alt="arboleda" src={arboleda}></img>
                </a>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        viewer: state.hc.hwv,
        socket: state.hc.socket,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {

    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Models);