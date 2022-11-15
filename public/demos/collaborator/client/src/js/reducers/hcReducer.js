import io from 'socket.io-client';

var socket = io('/collaborator');

const viewReducer = (state = {
    socket: socket,
    numUsers: 0,
    status: "Connecting...",
    hwv: {},
    renderMode: "--",
    numTri: "--", 
    framerate: "--",
    model: "moto",
    camera: {},
    selection: null,
    explodeMag: 0,
    markupViewId: null,
    markupViews: [],
    markupList: [],
}, action) => {
        switch (action.type) {
            case "SEND_STATE_TO_SERVER":
                // Need to remove the viewer and socket objects, since they have circular references and cannot be sent over socket.io
                let stateData = {
                    ...state, 
                    hwv: {},
                    socket: {},
                    camera: JSON.stringify(state.hwv.getView().getCamera().forJson()),
                }
                socket.emit('initServerState', JSON.stringify(stateData));
                break;
            case "INIT":
                state = {
                    ...state,
                    status: "Online",
                    hwv: action.payload.viewer,
                    renderMode: window.Communicator.DrawMode[action.payload.viewer.getView().getDrawMode()], 
                    model: action.payload.model,
                };
                break;
            case "USER_CONNECTED":
                state = {
                    ...state,
                    numUsers: action.payload,
                }
                break;
            case "UPDATE_STATUS_BAR":
                state = {
                    ...state,
                    renderMode: action.payload
                }
                break;
            case "DRAW_MODE_CHANGE":
                socket.emit('drawModeChange', action.payload);
                state = {
                    ...state,
                    renderMode: action.payload,
                };
                break;
            case "CALC_STATS_FULFILLED":
                state = {
                    ...state,
                    numTri: action.payload.triangle_count,
                    framerate: Math.round(action.payload.frames_per_second),
                }
                break;
            case "CAMERA_CHANGE":
                socket.emit('cameraChange', JSON.stringify(action.payload.forJson()));
                state = {
                    ...state, 
                    camera: action.payload,
                }
                break;
            case "SELECTION_CHANGE":
                socket.emit('selectionChange', action.payload);
                state = {
                    ...state,
                    selection: action.payload,
                }
                break;
            case "UPDATE_EXPLODE":
                socket.emit('explode', action.payload);
                state = {
                    ...state,
                    explodeMag: action.payload,
                }
                break;
            case "SYNC_STATES":
                state = {
                    ...state,
                    camera: action.payload.camera,
                    selection: action.payload.selection,
                    renderMode: action.payload.drawMode,
                    model: action.payload.model,
                    explodeMag: action.payload.expMag,
                }
                break;

            case "VIEW_CREATED":
                state = {
                    ...state,
                    markupViewId: action.payload,
                }
                break;
            case "VIEW_SAVED":
                let viewsArr;
                if (action.payload.index !== -1) {
                    state.markupViews[action.payload.index].viewImg = action.payload.viewImg;
                    viewsArr = [...state.markupViews];
                }
                else {
                    viewsArr = [...state.markupViews, action.payload]
                }
                state = {
                    ...state,
                    markupViews: viewsArr
                }
                break;
            default:
                break;
        }
    return state;
};

export default viewReducer;