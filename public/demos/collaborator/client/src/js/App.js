import React, { Component } from 'react';
import Header from './components/Header';
import StatusBar from './containers/StatusBar';
import Toolbar from './containers/Toolbar';
import Viewer from "./containers/Viewer";
import ModelTree from './containers/ModelTree';
import Models from './containers/Models';
import MarkupViews from "./containers/MarkupViews";
import { Tab, Tabs } from 'react-bootstrap';
import Chat from './components/Chat';

let tabSrc = 'about:blank';

export default class App extends Component {

    constructor(props) {
        super(props);
        // Use React internal state to manage tabs (could tie into Redux store, but unnecessary)
        this.state = {key: 1};
    }

    setSRC = () => {
        // Only load the doc source when the tab is active - avoids prompting credentials on app load
        if (document.getElementById('docs').src === 'about:blank') {
            tabSrc = "https://docs.techsoft3d.com/communicator/latest/build/overview-technical-overview.html";
            document.getElementById('docs').src = tabSrc;
        }
    }

    // Function to allow Models.js and MarkupViews.js to programmtically change the tab
    // App will switch to viewer tab upon selection of a model or markup view
    handleSelection(tabKey){
        this.setState({ key : tabKey })
     }

	render() {
        return (
            <div id="container">
                <div id="header"></div>
                    <Header/>
                <div id="ui">
                    {/* Overriding default onSelect behavior to allow programatic changing of active tab */}
                    <Tabs id="pageTabs" defaultActiveKey={1} activeKey={this.state.key} 
                     onSelect={(eventKey) => this.handleSelection(eventKey)} >
                        <Tab eventKey={1} title="Viewer">
                            <Toolbar />
                            <Viewer changeTab={this.handleSelection.bind(this)}/>
                            <ModelTree />
                        </Tab>
                        <Tab eventKey={2} title="Model Library">
                            <Models />
                        </Tab>
                        {/* <Tab eventKey={3} title="Markup Views">
                            <MarkupViews changeTab={this.handleSelection.bind(this)}/>
                        </Tab> */}
                        {/* Set docs page on entering tab */}
                        <Tab eventKey={4} onEntering = {() => this.setSRC()} title="Documentation">
                            <iframe id="docs" title="doc" src={tabSrc}>
                            </iframe>
                        </Tab>
                    </Tabs>
                </div>
                <div id="footer">
                    <StatusBar/>
                </div>
                <div id="chat">
                    <Chat/>
                </div>
            </div>
        );
  }
}
