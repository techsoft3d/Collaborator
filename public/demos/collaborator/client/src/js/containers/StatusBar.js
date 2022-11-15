import React, {Component} from 'react';
import {connect} from 'react-redux';
import {calcStats} from '../actions/viewActions'


class StatusBar extends Component {

    render() {
        return (
            <table id="statusbar">
                <tbody>
                    <tr>
                        <td>Communicator Status: {this.props.status}</td>
                        <td>Users Connected: {this.props.numUsers}</td>
                        <td>Frames Per Second: {this.props.framerate} </td>
                        <td>Number of Triangles: {this.props.numTri} </td>
                        <td>Render Mode: {this.props.drawMode}</td>
                    </tr>
                </tbody>
            </table>
        );
    }

}

const mapStateToProps = (state) => {
    return {
        socket: state.hc.socket,
        viewer: state.hc.hwv,
        drawMode: state.hc.renderMode,
        status: state.hc.status,
        view: state.hc.view, 
        numTri: state.hc.numTri,
        framerate: state.hc.framerate,
        numUsers: state.hc.numUsers
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        calcStats: (viewer) => {
            dispatch(calcStats(viewer));
        },
    };
};


export default connect(mapStateToProps, mapDispatchToProps)(StatusBar);