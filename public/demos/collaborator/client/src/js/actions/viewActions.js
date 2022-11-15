export function sendStateToServer() {
    return {
        type: "SEND_STATE_TO_SERVER", 
    }
}

export function initViewer(viewer, model) {
    return {
        type: "INIT",
        payload: {
            viewer: viewer,
            model: model
        }
    };
}

export function updateUsersConnected(numUsers) {
    return {
        type: "USER_CONNECTED",
        payload: numUsers
    }
}

export function updateStatusBar(drawMode) {
    return {
        type: "UPDATE_STATUS_BAR",
        payload: drawMode
    };
}

export function setDrawMode(drawMode) {
    return {
        type: "DRAW_MODE_CHANGE",
        payload: drawMode
    };
}

export function selectionChange(selection) {
    return {
        type: "SELECTION_CHANGE",
        payload: selection
    };
}

export function calcStats(viewer) {
    return {
        type: "CALC_STATS",
        payload: viewer.getStatistics(false).then((stats) => {
                return(stats);
        })
    }
}

export function updateCamera(camera) {
    return {
        type: "CAMERA_CHANGE",
        payload: camera
    }
}

export function updateExplode(mag) {
    return {
        type: "UPDATE_EXPLODE",
        payload: mag
    }
}

export function syncStates(serverState) {
    return {
        type: "SYNC_STATES",
        payload: serverState
    }
}

export function markupViewCreated(id) {
    return {
        type: "VIEW_CREATED",
        payload: id
    }
}

export function markupViewSaved(viewData) {
    return {
        type: "VIEW_SAVED",
        payload: viewData,
    }
}



