import React, { Component } from 'react';
import { connect } from 'react-redux';


class MarkupViews extends Component {

    handleSelection(e) {
        e.preventDefault();
        this.props.changeTab(1);
        this.props.socket.emit('loadSavedView', e.target.id);
    }

    render() {
        let viewshtml = [];
        if (this.props.views.length > 0) {
            for (let i = 0; i < this.props.views.length; ++i) {
                viewshtml.push(<a href="" id={this.props.views[i].viewId} className="thumbnail">
                                    <img id={this.props.views[i].viewId}
                                         alt={this.props.views[i].viewId} 
                                         src={this.props.views[i].viewImg.src}>
                                    </img>
                                </a>);
            }
        }
        else
            viewshtml = null;
        return (
            <div id="modelThumbnails" onClick={this.handleSelection.bind(this)}>                
                {viewshtml}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        viewer: state.hc.hwv,
        socket: state.hc.socket,
        views: state.hc.markupViews,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {

    };
};

export default connect(mapStateToProps, mapDispatchToProps)(MarkupViews);