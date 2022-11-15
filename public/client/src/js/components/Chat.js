import React, { Component } from 'react';
import Launcher from './chat/Launcher';
import '../../css/chatStyles';

export default class Chat extends Component {

    render() {
        return (
        <div>
            <Launcher
                agentProfile={{
                    teamName: 'HOOPS Chat',
                    imageUrl: 'https://pbs.twimg.com/profile_images/552907541408014336/FxSdwq0-_400x400.png'
                }}
            />
        </div>
        )
    }
}