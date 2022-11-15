import React, { Component } from 'react';
import MessageList from './MessageList'
import UserInput from './UserInput'
import Header from './Header'
import {Button, FormControl, FormGroup, ControlLabel, HelpBlock} from 'react-bootstrap';


class ChatWindow extends Component {

    constructor(props) {
      super(props);
      this.username = this.props.user;
      this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
      this.props.socket.on('incoming_message', message => {
        this.props.messageRecieved(message);
      });
      this.props.socket.on('syncMessages', messageList => {
        this.props.syncMessages(messageList);
      })
    }

    handleChange(e) {
      this.username = e.target.value;
    }

    handleSubmit(e, username) {
      e.preventDefault();
      this.props.addUser(username);
    }

    render() {
      let messageList = this.props.messageList || [];
      let classList = [
        "sc-chat-window",
        (this.props.isOpen ? "opened" : "closed"), 
      ];
      let chatWindow = [];
      if (this.props.user === "Unknown User") {
        chatWindow.push( 
          <form id="chatLogin" 
                onSubmit={(e) => {
                  e.preventDefault();
                  this.props.addUser(this.username);
                }}>
        <FormGroup
          controlId="formBasicText"
        >
          <ControlLabel>Please Enter A Chat Username</ControlLabel>
          <FormControl
            type="text"
            // value={this.username}
            placeholder="Username"
            onChange={this.handleChange}
          />
          {/* <FormControl.Feedback /> */}
              <Button bsStyle="primary" bsSize="small" onClick={(e) => {
                  e.preventDefault();
                  this.props.addUser(this.username);
                }
              }>Submit</Button>
          <HelpBlock>You will be able to chat upon entering your name.</HelpBlock>
        </FormGroup>
      </form>
        )
      }
      else {
        chatWindow.push(
            <MessageList
              messages={messageList}
              author={this.props.user}
              imageUrl={this.props.agentProfile.imageUrl}
            />
        )
      }
      return (
        <div className={classList.join(' ')}>
          <Header
            teamName={this.props.agentProfile.teamName}
            imageUrl={this.props.agentProfile.imageUrl}
            onClose={this.props.onClose}
          />
          {chatWindow}
          <UserInput
            socket={this.props.socket}
            author={this.props.user}
            onSubmit={this.props.onUserInputSubmit.bind(this)}
            inputActive={this.props.inputActive}
            changeInputActive={this.props.changeInputActive}
          />
        </div>
      );
    }
}

export default ChatWindow;
