import React, { Component } from 'react';
import { connect } from 'react-redux';
import { calcStats } from '../actions/viewActions';
import '../../css/TreeControl.css';
import {Treebeard} from 'react-treebeard';
import treeStyle from '../../css/treeStyling';

class ModelTree extends Component {

    constructor(props) {
        super(props);
        this.initialized = false;
        this.tree = {
            name: "Model Tree",
            hcID: null,
            toggled: false,
            children: [],
        };
        this.state = {cursor: this.tree};
        this.onToggle = this.onToggle.bind(this);
    }
    
    onToggle(node, toggled) {
        // eslint-disable-next-line
        if (this.state.cursor) { this.state.cursor.active = false; }
        var _this = this;
        let viewer = this.props.viewer;
        viewer.unsetCallbacks({ selection: _this.handleSelection});
        if (node.hcID) //&& !viewer.getSelectionManager().contains(node.hcID)) 
            viewer.selectPart(node.hcID);
        viewer.setCallbacks({ selection: _this.handleSelection});
        node.active = true;
        if (node.children) { node.toggled = toggled; }
        this.setState({ cursor: node });
    }

    componentDidMount() {
        this._size = new window.Communicator.Point2(200, 700);
        this._elementId = "modelTree";
    }

    componentDidUpdate() {
        if (this.props.status === "Online" && !this.initialized) {
            this._initEvents();
            this.initialized = true;
        }
    }

    _initEvents = function() {
        var _this = this;
        this.props.viewer.setCallbacks({
            modelStructureReady: function() {
                let model = _this.props.viewer.getModel();
                let firstChild = model.getNodeChildren(model.getRootNode());
                _this.tree = {
                    ..._this.tree, 
                    children: _this.buildTree(firstChild[0])
                };
            },
            modelSwitched: function () {
                _this.onToggle(_this.tree, false);
                let model = _this.props.viewer.getModel();
                let firstChild = model.getNodeChildren(model.getRootNode());
                _this.tree = {
                    ..._this.tree,
                    children: _this.buildTree(firstChild[0])
                };
            },
            selection: _this.handleSelection
        });
    };

    handleSelection = (selection) => {
        if (selection.getType() !== window.Communicator.SelectionType.None) {
            this.searchTree(this.tree, selection.getSelection().getNodeId());
        }
    }

    buildTree = (uniqueId) => {
        if (uniqueId != null) {
            let childNames = [];
            var children = this.props.viewer.getModel().getNodeChildren(uniqueId);
            if (children.length > 0) {
                for (let i = 0; i < children.length; ++i){
                    childNames[i] = { 
                        name: this.props.viewer.getModel().getNodeName(children[i]),
                        hcID: children[i], 
                        children: this.buildTree(children[i])
                    };
                }
                return childNames;
            }
            return null;
        }
    }

    searchTree = (node, desiredNode) => {
        if (node.hcID === desiredNode) {
            return node;
        } else if (node.children != null) {
            var i;
            var result = null;
            for (i = 0; result == null && i < node.children.length; i++) {
                result = this.searchTree(node.children[i], desiredNode);
            }
            return result;
        }
        return null;
    }

    render() {
        return (
            <div id = "modelTree">
                <Treebeard
                    data={this.tree}
                    onToggle={this.onToggle}
                    style={treeStyle}
                />
            </div>
        );
    }

}

const mapStateToProps = (state) => {
    return {
        socket: state.hc.socket,
        viewer: state.hc.hwv,
        status: state.hc.status,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        calcStats: (viewer) => {
            dispatch(calcStats(viewer));
        },
    };
};


export default connect(mapStateToProps, mapDispatchToProps)(ModelTree);

