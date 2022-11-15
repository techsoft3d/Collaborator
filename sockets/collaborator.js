module.exports = function(io) {
    var usersConnected = 0;
    let sessionHost = false;

    let state = {
        camera: {},
        selection: null,
        drawMode: "--",
        model: "--",
        messages: [],
        expMag: 0,
        editor: false
    }

    const connections = {};

    const collaborator = io.of('/collaborator');

    collaborator.on('connection', socket => {
        usersConnected += 1;
        connections[socket.id] = `User ${usersConnected}`;
        console.log(connections[socket.id]);
        console.log("Collaborator User Connected: " + usersConnected + " total users connected");
        // First person to launch the session, pull client viewer state to initialize the server state
        socket.on('initServerState', sessionData => {
            let viewerStateObj = JSON.parse(sessionData);
            state = {
                ...state,
                camera: viewerStateObj.camera,
                selection: viewerStateObj.selection,
                drawMode: viewerStateObj.renderMode,
                model: viewerStateObj.model,
            }
            console.log("init server state");
        });

        collaborator.emit('userConnectChange', usersConnected );
        
        socket.on('syncViewer', () => {
            console.log('syncViewer');
            // Check to make sure server state is initialized before sending current state to additional users
            if (Object.keys(state.camera).length !== 0) {
                // Set the newly connected client viewer state equal to the values stored on the server 
                // (which should be updated to the existing session values). Then perform HC actions. 
                new Promise( (resolve) => {socket.emit('syncStates', JSON.stringify(state)); resolve(true)}).then( () => {
                    //socket.emit('modelChanged', state.model);
                    socket.emit('updateCamera', state.camera);
                    socket.emit('updateSelection', state.selection);
                    socket.emit('updateDrawMode', state.drawMode);
                    socket.emit('syncMessages', state.messages); 
                    console.log(state.editor);
                    socket.emit('showEditor', state.editor);
                    //socket.emit('explodeUpdate', state.expMag);
                });
            }
            // First person to launch the session, pull client viewer state to initialize the server state
            else if (usersConnected === 1 && sessionHost === false) {
                sessionHost = true;
                socket.emit('initServerState');
            }
        });

        socket.on('goHome', () => {
            collaborator.emit('goHome');
        })

        socket.on('cameraChange', camera => {
            socket.broadcast.emit('updateCamera', camera);
            state = {
                ...state,
                camera: camera
            }
        });

        socket.on('disableCameraCallback', () => {
            collaborator.emit('disableCameraCallback');
        });

        socket.on('enableCameraCallback', () => {
            collaborator.emit('enableCameraCallback');
        });

        socket.on('selectionChange', selection => {
            socket.broadcast.emit('updateSelection', selection);
            state = {
                ...state,
                selection: selection
            }
        });

        socket.on('drawModeChange', drawMode => {
            collaborator.emit('updateDrawMode', drawMode);
            state = {
                ...state,
                drawMode: drawMode
            }
        });

        socket.on('changeModel', model => {
            collaborator.emit('modelChanged', model);
            state = {
                ...state, 
                model: model,
            }
        });

        socket.on('chat_message', message => {
            socket.broadcast.emit('incoming_message', message)
            state = {
                ...state, 
                messages: [...state.messages, message]
            }
        });

        socket.on('redlineUpdated', redlineItem => {
            socket.broadcast.emit('redlineUpdated', redlineItem );
        });

        socket.on('viewCreated',  markupView => {
            socket.broadcast.emit('viewCreated', markupView );
        });

        socket.on('handleRedline', (redlineItem, className, update) => {
            socket.broadcast.emit('handleRedline', redlineItem, className, update);
        });

        socket.on('isolate', nodes => {
            socket.broadcast.emit('isolate', nodes);
        });

        socket.on('zoom', nodes => {
            socket.broadcast.emit('zoom', nodes);
        });

        socket.on('hide', (nodes, visibility) => {
            collaborator.emit('hide', nodes, visibility);
        });

        socket.on('showAll', () => {
            collaborator.emit('showAll');
        });

        socket.on('saveMarkupView', () => {
            collaborator.emit('saveMarkupView');
        })

        socket.on('loadSavedView', (id) => {
            collaborator.emit('loadSavedView', id);
        })

        socket.on('explode', mag => {
            socket.broadcast.emit('explodeUpdate', mag);
            state = {
                ...state,
                expMag: mag,
            }
        });

        socket.on('showEditor', (editorOn) => {
            collaborator.emit('showEditor', editorOn);
            state = {
                ...state,
                editor: editorOn
            }
        });

        socket.on('updateEditor', (text) => {
            socket.broadcast.emit('updateEditor', text);
        });

        socket.on('runCustomCode', () => {
            collaborator.emit('runCustomCode');
        });

        socket.on('disconnect', () => {
            if( usersConnected > 1 ){
                usersConnected -= 1;
                collaborator.emit('userConnectChange', usersConnected );
            }
            else if (usersConnected <= 1) {
                usersConnected = 0;
                sessionHost = false;
                state = {
                    camera: {},
                    selection: null,
                    drawMode: "--",
                    model: "--",
                    messages: [],
                }
            }
            console.log("Collaborator User Disconnected: " + usersConnected + " total users connected");
         });
    });
};
