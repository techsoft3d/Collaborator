import React, {Component} from 'react';
import { connect } from 'react-redux';
import {markupViewSaved} from '../actions/viewActions'
import { setTimeout } from 'timers';

class ContextMenu extends Component {
    state = {
        visible: false,
    };

    constructor(props) {
        super(props);
        this._activeItemId = null;
        this.socketsOn = false;
        this.editorOn = false;
        this.contextSet = false;
        this.editorCallback = () => this.props.socket.emit('updateEditor', this.codeEditor.getValue());
    }

    componentDidMount() {

        let canvas = document.getElementById('canvas');
        document.addEventListener('click', this._handleClick);
        document.addEventListener('scroll', this._handleScroll);
        canvas.oncontextmenu = (e) => {
            e.stopPropagation();
            return false;
        }
        canvas.ontouchstart = (e) => {
            this._handleClick(e);
        };
        canvas.ontouchend = (event) => {
            if (this.contextSet) {
                this.resetDefaultOperators();
                this.contextSet = false;
            }
        };
    };

    componentDidUpdate() {
        if (this.props.status === "Online" && this.socketsOn === false) {
            let contextCallback = this._handleContextMenuDesktop.bind(this);
            this.props.viewer.setCallbacks({contextMenu: contextCallback});
            this.socketsOn = true;
            const cameraCallback = this.props.camCallback
            this.isoZoomHelper = new IsolateZoomHelper(this.props.viewer);
            this.props.socket.on('isolate', (nodes) => {
                this.isoZoomHelper.isolateNodes(nodes, cameraCallback);
            });

            this.props.socket.on('zoom', (nodes) => {
                this.isoZoomHelper.fitNodes(nodes, cameraCallback);
            });

            this.props.socket.on('hide', (nodes, visibility) => {
                this.props.viewer.getModel().setNodesVisibility(nodes, visibility);
            });

            this.props.socket.on('showAll', (nodes) => {
                this.isoZoomHelper.showAll(cameraCallback);
            });

            this.props.socket.on('saveMarkupView', () => {
                let _this = this;
                let viewId = this.props.viewId;
                let ind = -1;
                for (let i = 0; i < this.props.views.length; i++) {
                    if (this.props.views[i].viewId === viewId) {
                        ind = i;
                        break;
                    }
                }
                let canvasSize = this.props.viewer.getView().getCanvasSize();
                let config = new window.Communicator.SnapshotConfig(canvasSize.x, canvasSize.y);
                this.props.viewer.takeSnapshot(config).then(function (image) {
                    let viewData = {
                        viewId: viewId,
                        viewImg: image,
                        index: ind
                    }
                    _this.props.markupViewSaved(viewData);
                });
            })


            this.props.socket.on('showEditor', (editorOn) => {
                let elemId = document.getElementById('codeEditor');
                elemId.style.display = (editorOn === false) ? 'none' : 'block';
                setTimeout(() => this.codeEditor.refresh(), 1);
            });

            this.props.socket.on('updateEditor', (text) => {
                this.codeEditor.off('change', this.editorCallback);
                this.codeEditor.setValue(text);
                this.codeEditor.on('change', this.editorCallback);
            });

            this.props.socket.on('runCustomCode', () => {
                // Need this outside of socket
                this.runCustomCode();
            });

            let elemId = document.getElementById('codeEditor');
            elemId.style.display = 'none';
            this.codeEditor = window.CodeMirror(elemId, {
                value: "// Custom Commands can be run here\nlet viewer = this.props.viewer;\n\n\n\n",
                mode: "javascript",
                theme: "monokai",
                lineNumbers: true
            });
            this.codeEditor.on('change', this.editorCallback);
        }
    }

    componentWillUnmount() {
        document.removeEventListener('click', this._handleClick);
        document.removeEventListener('scroll', this._handleScroll);
    }

    resetDefaultOperators() {
        let OM = this.props.viewer.getOperatorManager();
        OM.clear();
        OM.push(window.Communicator.OperatorId.Navigate);
        OM.push(window.Communicator.OperatorId.Select);
    }

    runCustomCode() {
        let code = this.codeEditor.getValue();
        // eslint-disable-next-line
        let Communicator = window.Communicator;
        try {
            // eslint-disable-next-line
            eval(code);
        }
        catch (error) {
            console.log("Code did not run sucessfully. " + error);
        }
    }

    _handleContextMenuDesktop(mousePos, mod) {

        this.contextSet = true;
        this.setState({ visible: true });

        let canvas = document.getElementById('canvas');
        let footer = document.getElementById('statusbar');

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const canvasH = canvas.offsetHeight;
        const footerH = footer.offsetHeight;
        const rootW = this.root.offsetWidth;
        const rootH = this.root.offsetHeight;

        const canvasOffsetH = screenH-(canvasH+footerH);

        const clickX = mousePos.x;
        const clickY = mousePos.y + canvasOffsetH;

        const right = (screenW - clickX) > rootW;
        const left = !right;
        const top = (screenH - clickY) > rootH;
        const bottom = !top;

        if (right) {
            this.root.style.left = `${clickX + 5}px`;
        }

        if (left) {
            this.root.style.left = `${clickX - rootW - 5}px`;
        }

        if (top) {
            this.root.style.top = `${clickY + 5}px`;
        }

        if (bottom) {
            this.root.style.top = `${clickY - rootH - 5}px`;
        }
    };


    _handleClick = (event) => {
        const { visible } = this.state;
        const wasOutside = !(event.target.contains === this.root);
        if (wasOutside && visible) {
            this.setState({ visible: false, });
        }
    };

    _handleScroll = () => {
        const { visible } = this.state;

        if (visible) this.setState({ visible: false, });
    };

    getContextItemIds = function (includeSelected, includeClicked) {
        var selectedItemIds = includeSelected ? this.props.viewer.getSelectionManager().getResults().map(function (item) {
            return item.getNodeId();
        }) : [];
        if (selectedItemIds.length === 0 || (selectedItemIds.indexOf(this._activeItemId) === -1 && includeClicked)) {
            selectedItemIds.push(this._activeItemId);
        }
        return selectedItemIds;
    };

    _isVisible = function (activeItemId) {
        var selectionItems = this._viewer.getSelectionManager().getResults();
        if (this._activeItemId != null) {
            return this._viewer.getModel().getNodeVisibility(this._activeItemId);
        }
        else {
            return this._viewer.getModel().getNodeVisibility(selectionItems[0].getNodeId());
        }
    };


    render() {
        const { visible } = this.state;
        const cameraCallback = this.props.camCallback;

        return (visible || null) &&
            <div ref={ref => { this.root = ref }} className="contextMenu">
                <div className="contextMenu--option"
                onClick={ () => {
                    if (this._activeItemId != null || this.props.viewer.getSelectionManager().getResults().length > 0) {
                        let selected = this.getContextItemIds(true, true);
                        this.isoZoomHelper.isolateNodes(selected, cameraCallback);
                        this.props.socket.emit('isolate', selected);
                    }
                }
                }>Isolate</div>
                <div className="contextMenu--option"
                onClick={() => {
                    if (this._activeItemId != null || this.props.viewer.getSelectionManager().getResults().length > 0) {
                        let selected = this.getContextItemIds(true, true);
                        this.isoZoomHelper.fitNodes(selected, cameraCallback);
                        this.props.socket.emit('zoom', selected);
                    }
                }
                }>Zoom</div>
                <div className="contextMenu--option"
                onClick={() => {
                    let selectionItems = this.props.viewer.getSelectionManager().getResults();
                    if (this._activeItemId != null || selectionItems.length > 0) {
                        let selected = this.getContextItemIds(true, true);
                        let isVisible = !this.props.viewer.getModel().getNodeVisibility(selectionItems[0].getNodeId())
                        this.props.socket.emit('hide', selected, isVisible);
                    }
                }
                }>Hide</div>
                <div className="contextMenu--separator" />
                <div className="contextMenu--option"
                onClick={() => {
                        //this.isoZoomHelper.showAll();
                        this.props.socket.emit('showAll');
                }
                }>Show All</div>
                <div className="contextMenu--separator" />
                <div className="contextMenu--option"
                onClick={(e) => {
                    this.props.socket.emit('saveMarkupView');
                }
                }>Save Markup View</div>
                <div className="contextMenu--option"
                onClick={() => {
                    this.props.socket.emit('showEditor', true);
                }
                }>Custom Script</div>
                <div className="contextMenu--separator" />
                <div className="contextMenu--option"
                onClick={() => {
                    this.setState({ visible: false, });
                }
                }>Close Menu</div>
            
            </div>
    };
}

class IsolateZoomHelper {
    constructor(viewer) {
        this._viewer = viewer;
        this._camera = null;
        this._cameraSet = false;
        this._deselectOnIsolate = true;
        this._deselectOnZoom = true;
        this._isolateStatus = false;
    }
    _setCamera(camera) {
        if (!this._cameraSet) {
            this._camera = camera;
            this._cameraSet = true;
        }
    };
    _getCamera() {
        this._cameraSet = false;
        return this._camera;
    };
    setDeselectOnIsolate(deselect) {
        this._deselectOnIsolate = deselect;
    };
    getIsolateStatus() {
        return this._isolateStatus;
    };
    isolateNodes(nodeIds, cameraCallback) {
        this._viewer.unsetCallbacks({ camera: cameraCallback });
        this._setCamera(this._viewer.getView().getCamera());
        this._viewer.getView().isolateNodes(nodeIds).then( () => {
            this._viewer.setCallbacks({ camera: cameraCallback });    
            if (this._deselectOnIsolate) {
                this._viewer.getSelectionManager().clear();
            }
            this._isolateStatus = true;
        });
    };
    fitNodes(nodeIds, cameraCallback) {
        this._viewer.unsetCallbacks({ camera: cameraCallback });
        this._setCamera(this._viewer.getView().getCamera());
        this._viewer.getView().fitNodes(nodeIds).then( () => {
            this._viewer.setCallbacks({ camera: cameraCallback });    
            if (this._deselectOnZoom) {
                this._viewer.getSelectionManager().clear();
            }
        })
    };
    showAll(cameraCallback) {
        this._viewer.unsetCallbacks({ camera: cameraCallback });
        this._viewer.getModel().resetNodesVisibility();
        if (this._cameraSet) {
            this._viewer.getView().setCamera(this._getCamera(), 400);
        }
        this._isolateStatus = false;
        this._updatePinVisibility();
        setTimeout(() => this._viewer.setCallbacks({ camera: cameraCallback }), 450);
    };
    _updatePinVisibility() {
        // window.Communicator.Markup.NoteText.setIsolateActive(this._isolateStatus);
        // window.Communicator.Markup.NoteText.updatePinVisibility();
    };
}


const mapStateToProps = (state) => {
    return {
        viewer: state.hc.hwv,
        socket: state.hc.socket,
        status: state.hc.status,
        viewId: state.hc.markupViewId,
        views: state.hc.markupViews,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        markupViewSaved: (viewData) => {
            dispatch(markupViewSaved(viewData));
        }
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);