import React from "react";
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';
import {
    initViewer, calcStats, updateUsersConnected, markupViewCreated,
    updateCamera, selectionChange, updateExplode, syncStates, sendStateToServer, updateStatusBar
} from "../actions/viewActions";
import ContextMenu from "./ContextMenu";
import axios from 'axios';

const VERSION = process.env.REACT_APP_HWP_VERSION;
const URL = process.env.REACT_APP_STREAM_CACHE_API;

class Viewer extends React.Component {

    constructor(props) {
        super(props);
        this.cameraCallback = this.cameraChange.bind(this);
    }

    componentWillMount() {
        this.props.socket.on('userConnectChange', numUsersConnected => {
            this.props.updateUsersConnected(numUsersConnected);
        });
    }

    // Once the element is in the browser DOM, initialize the viewer and set up sockets
    componentDidMount() {
        let initModel = 'moto';
        new Promise((resolve) => {

                let webViewer = new window.Communicator.WebViewer({
                    containerId: "canvas",
                    endpointUri: "client/public/models/moto.scs",
                    enginePath: process.env.REACT_APP_HWP_ENGINE_PATH
                });

                webViewer.start();
                webViewer.setClientTimeout(60, 55);

                let hlSettings = webViewer.getView().getHiddenLineSettings();
                hlSettings.setBackgroundColor(new window.Communicator.Color(114, 114, 114));
                resolve(webViewer);

                window.onbeforeunload = function () {
                };
            })
                
        .then((viewer) => {
                this.props.initViewer(viewer, initModel);

                // Storing the callback in its own function to avoid registering a bound callback 
                // (more difficult to unregister that in HC)
                let camCallback = this.cameraCallback;
                let selectionCallback = this.selectionChanged.bind(this);
                let syncCallback = this.syncViewer.bind(this);
                let explodeCallback = this.explodeChange.bind(this);
                let markupViewCallback = this.viewCreated.bind(this);
                let newRedlineCallback = this.redlineCreated.bind(this);
                let updateRedlineCallback = this.redlineUpdate.bind(this);
                let measurementCallback = this.measurementCreated.bind(this);
                viewer.setCallbacks({
                    camera: camCallback,
                    selectionArray: selectionCallback,
                    explode: explodeCallback,
                    viewCreated: markupViewCallback,
                    redlineCreated: newRedlineCallback,
                    redlineUpdated: updateRedlineCallback,
                    measurementCreated: measurementCallback,
                });
                window.addEventListener("resize", this.resizeCanvas.bind(this));


                // INITIALIZE SOCKETS //
                // Often, these sockets will be triggered as a result of another connected users HC callback.
                // As such, if any actions in that socket will trigger a HC callback, disable that callback
                // to avoid an endless cycle of callbacks between clients

                // First user to connect will initialize the server state with their local client state
                this.props.socket.on('initServerState', () => {
                });


                // For new subsequent connections, pull state from server to sync all sessions
                this.props.socket.on('syncStates', (state) => {
                    let serverState = JSON.parse(state);
                    this.props.syncStates(serverState);

                    this.props.viewer.unsetCallbacks({
                        modelStructureReady: syncCallback,
                        camera: camCallback,
                        selectionArray: selectionCallback
                    });

                    // Make sure canvas is not offscreen before switching to model
                    this.props.changeTab(1);

                    // Sync current model
                    this.props.viewer.model.clear().then(() => {
                        // Once model is switched, sync camera, selection, markup, etc
                        var camObj = JSON.parse(serverState.camera);
                        var c = window.Communicator.Camera.construct(camObj);
                        this.props.viewer.getView().setCamera(c);
                        this.props.viewer.resizeCanvas();
                    

                        // Selection sync
                        if (serverState.selection !== null)
                            this.props.viewer.getSelectionManager().loadSelectionData(JSON.parse(serverState.selection));
                        else {
                            this.props.viewer.getSelectionManager().clear();
                        }

                        // Draw mode sync
                        this.props.viewer.getView().setDrawMode(window.Communicator.DrawMode[serverState.drawMode]);
                        this.props.updateStatusBar(serverState.drawMode);

                        // Further syncs (i.e. Markup, Explode Mag, Measurements, etc go here)
                        // Any feature to be synced should be tracked on the server side state and updated in the sockets

                        // Reenable callbacks
                        this.props.viewer.setCallbacks({
                            modelStructureReady: syncCallback,
                            camera: camCallback,
                            selectionArray: selectionCallback
                        });
                    });

                });

                // Actions to perform when home is clicked
                this.props.socket.on('goHome', () => {
                    this.props.viewer.unsetCallbacks({ camera: camCallback });
                    this.props.viewer.getView().resetCamera().then(() => {
                        this.props.viewer.getModel().resetNodesVisibility();
                        this.props.viewer.getExplodeManager().setMagnitude(0);
                        this.props.viewer.getMeasureManager().removeAllMeasurements();
                    });
                    // Could put this in promise, but want to make sure all other callbacks from connected sockets finish.
                    setTimeout(() => this.props.viewer.setCallbacks({ camera: camCallback }), 450);
                });

                this.props.socket.on('updateCamera', (camera) => {
                    this.props.viewer.unsetCallbacks({ camera: camCallback });
                    var camObj = JSON.parse(camera);
                    var c = window.Communicator.Camera.construct(camObj);
                    this.props.viewer.getView().setCamera(c);
                    this.props.viewer.setCallbacks({ camera: camCallback });
                });

                this.props.socket.on('updateDrawMode', drawMode => {
                    this.props.viewer.getView().setDrawMode(window.Communicator.DrawMode[drawMode]);
                    this.props.updateStatusBar(drawMode);
                });

                this.props.socket.on('modelChanged', model => {
                    // Make sure canvas is not offscreen before switching to model
                    this.props.changeTab(1);
                    window.setTimeout(() => {
                        // Avoid resyncing due to intentional model switch by disabling callback
                        this.props.viewer.unsetCallbacks({ modelStructureReady: syncCallback });
                        this.props.viewer.model.clear().then(() => {
                            this.props.viewer.model.loadSubtreeFromScsFile(this.props.viewer.model.getAbsoluteRootNode(), `client/public/models/${model}.scs`).then( () =>{
                                this.props.viewer.resizeCanvas();
                                this.props.viewer.setCallbacks({ modelStructureReady: syncCallback });
                            })
                           
                        });
                    }, 100);
                });

                this.props.socket.on('updateSelection', selection => {
                    this.props.viewer.unsetCallbacks({ selectionArray: selectionCallback });
                    if (selection !== null)
                        this.props.viewer.getSelectionManager().loadSelectionData(JSON.parse(selection));
                    else {
                        this.props.viewer.getSelectionManager().clear();
                    }
                    this.props.viewer.setCallbacks({ selectionArray: selectionCallback });
                });

                this.props.socket.on('measurementCreated', measurement => {
                    this.props.viewer.unsetCallbacks({ measurementCreated: measurementCallback });
                    this.props.viewer.getMeasureManager().loadData(JSON.parse(measurement), this.props.viewer).then(result => {
                        this.props.viewer.setCallbacks({ measurementCreated: measurementCallback });
                    })
                });

                this.props.socket.on('explodeUpdate', mag => {
                    this.props.viewer.unsetCallbacks({ explode: explodeCallback });
                    this.props.viewer.getExplodeManager().setMagnitude(mag).then((obj) => {
                        this.props.viewer.setCallbacks({ explode: explodeCallback });
                    });
                });

                this.props.socket.on('viewCreated', (markupView) => {
                    let viewer = this.props.viewer;
                    var markupViewObj = JSON.parse(markupView);
                    this.props.markupViewCreated(markupViewObj.uniqueId);
                    var MM = viewer.getMarkupManager();
                    viewer.unsetCallbacks({ viewCreated: markupViewCallback });
                    MM.loadMarkupData({ views: [markupViewObj] }).then((loaded) => {
                        MM.activateMarkupView(markupViewObj.uniqueId);
                        MM.refreshMarkup();
                        viewer.setCallbacks({ viewCreated: markupViewCallback });
                    });
                });

                this.props.socket.on('handleRedline', (redlineItem, className, updateExisting) => {
                    var markupObj = JSON.parse(redlineItem);
                    this.props.viewer.unsetCallbacks({ redlineCreated: newRedlineCallback, });

                    var markupClass = this.ClassForString(className);
                    if (markupClass) {
                        var newMarkup = markupClass.construct(markupObj, viewer);
                        if (newMarkup) {
                            var MM = this.props.viewer.getMarkupManager();
                            if (updateExisting) {
                                let ind = -1;
                                let markupItems = MM.getActiveMarkupView().getMarkup();
                                for (let i = 0; i < markupItems.length; i++) {
                                    // Access private variable directly cause markup serialization is buggy AF
                                    if (markupItems[i]._uniqueId === newMarkup._uniqueId) {
                                        ind = i;
                                        break;
                                    }
                                }
                                MM.getActiveMarkupView().removeMarkup(markupItems[ind]);
                            }
                            MM.getActiveMarkupView().addMarkupItem(newMarkup);
                            MM.refreshMarkup();
                        }
                    }
                    this.props.viewer.setCallbacks({ redlineCreated: newRedlineCallback, });
                });

                this.props.socket.on('loadSavedView', (id) => {
                    this.props.viewer.unsetCallbacks({ camera: camCallback });
                    let MM = this.props.viewer.getMarkupManager();
                    MM.activateMarkupViewWithPromise(id, 400).then(result => {
                        this.props.viewer.setCallbacks({ camera: camCallback });
                    });
                });

                // Decrease the frequency the stats are calculated to save performance
                // Originally this was tied to the camera callback, but it kills performance. 
                window.setInterval(() => this.props.calcStats(viewer), 100);
            });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.resizeCanvas.bind(this));
    }


    // Class functions for callbacks.

    resizeCanvas() {
        this.props.viewer.resizeCanvas();
    }

    cameraChange(camera) {
        this.props.updateCamera(camera);
    }

    selectionChanged(selection) {
        if (selection.length > 0) {
            let selectedNodes = this.props.viewer.getSelectionManager().exportSelectionData();
            this.props.selectionChange(JSON.stringify(selectedNodes));
        }
        else
            this.props.selectionChange(null);
    }

    syncViewer() {
        this.props.socket.emit('syncViewer');
    }

    explodeChange() {
        let mag = this.props.viewer.getExplodeManager().getMagnitude();
        this.props.updateExplode(mag);
    }

    viewCreated(view) {
        this.props.markupViewCreated(view.getUniqueId());
        this.props.socket.emit('viewCreated', JSON.stringify(view.toJson()));
    }

    redlineCreated(redlineItem) {
        let view = this.props.viewer.getMarkupManager().getActiveMarkupView();
        if (view.getMarkup().length > 1) {
            let className = redlineItem.getClassName();
            this.props.socket.emit('handleRedline', JSON.stringify(redlineItem.toJson()), className, false);
        }
    }

    redlineUpdate(redlineItem) {
        let className = redlineItem.getClassName();
        this.props.socket.emit('handleRedline', JSON.stringify(redlineItem.toJson()), className, true);
    }

    measurementCreated(measurement) {
        let measureArray = this.props.viewer.getMeasureManager().exportMarkup();
        this.props.socket.emit('measurementCreated', JSON.stringify(measureArray));
    }

    // helper function for creating redline programaticly
    ClassForString(className) {
        var arr = className.split(".");
        var fn = window || this;
        for (var i = 0, len = arr.length; i < len; i++) {
            fn = fn[arr[i]];
        }

        if (typeof fn !== "function") {
            return null;
        }
        return fn;
    }


    render() {
        return (
            <div style={{ height: 100 + "%" }}>
                <div id="codeEditor">
                    <Button bsStyle="primary" bsSize="xsmall" id="runCustomCode"
                        onClick={() => {
                            this.props.socket.emit('runCustomCode');
                        }}
                    >Run Code</Button>
                    <Button bsStyle="primary" bsSize="xsmall" id="closeCustomCode"
                        onClick={() => {
                            this.props.socket.emit('showEditor', false);
                        }}
                    >Close Editor</Button>
                </div>
                <div id="canvas" />
                <div id="root">
                    <ContextMenu camCallback={this.cameraCallback} />
                </div>
                <div id="snapshotModal" className="snap-modal">
                    <span className="closeSnap">&times;</span>
                    <div className="snap-modal-content" id="snapshotImg"></div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        viewer: state.hc.hwv,
        socket: state.hc.socket,
        numUsers: state.hc.numUsers,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        initViewer: (viewer, model) => {
            dispatch(initViewer(viewer, model));
        },
        calcStats: (viewer) => {
            dispatch(calcStats(viewer));
        },
        updateCamera: (camera) => {
            dispatch(updateCamera(camera));
        },
        selectionChange: (selection) => {
            dispatch(selectionChange(selection));
        },
        updateExplode: (mag) => {
            dispatch(updateExplode(mag));
        },
        syncStates: (states) => {
            dispatch(syncStates(states));
        },
        sendStateToServer: () => {
            dispatch(sendStateToServer());
        },
        updateStatusBar: (drawMode) => {
            dispatch(updateStatusBar(drawMode));
        },
        updateUsersConnected: (numUsers) => {
            dispatch(updateUsersConnected(numUsers));
        },
        markupViewCreated: (id) => {
            dispatch(markupViewCreated(id));
        },
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Viewer);