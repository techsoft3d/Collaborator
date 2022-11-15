import { connect } from 'react-redux';
import React, { Component } from 'react';
import ChatWindow from './ChatWindow';
import launcherIcon from './icons/logo-no-bg.png';
import launcherIconActive from './icons/close-icon.png';
import {showChat, changeInputActive, messageSubmit, messageRecieved, syncMessages} from '../../actions/chatActions';
import {addUser} from '../../actions/userActions';

class Launcher extends Component {

  handleClick() {
    this.props.showChat();
  }

  render() {
    const classList = [
      'sc-launcher',
      (this.props.isOpen ? 'opened' : ''),
    ];
    return (
      <div>
        <div>
        </div>
        <div className={classList.join(' ')} onClick={this.handleClick.bind(this)}>
          <MessageCount count={this.props.newMessagesCount} isOpen={this.props.isOpen} />
          <img className={"sc-open-icon"} src={launcherIconActive} alt='activeIcon' />
          <img className={"sc-closed-icon"} src={launcherIcon} alt='closedIcon' />
        </div>
        <ChatWindow
          socket = {this.props.socket}
          user = {this.props.userName}
          addUser = {this.props.addUser}
          messageList={this.props.messageList}
          onUserInputSubmit={this.props.messageSubmit}
          messageRecieved={this.props.messageRecieved}
          syncMessages={this.props.syncMessages}
          agentProfile={this.props.agentProfile}
          isOpen={this.props.isOpen}
          onClose={this.handleClick.bind(this)}
          inputActive={this.props.inputActive}
          changeInputActive={this.props.changeInputActive}
        />
      </div>
    );
  }
}

const MessageCount = (props) => {
  if (props.count === 0 || props.isOpen === true) { return null }
  return (
    <div className={"sc-new-messsages-count"}>
      {props.count}
    </div>
  )
}

const mapStateToProps = (state) => {
  return {
    socket: state.hc.socket,
    isOpen: state.chat.isOpen,
    newMessagesCount: state.chat.newMessagesCount,
    messageList: state.chat.messageList,
    inputActive: state.chat.inputActive,
    userName: state.users.username,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showChat: () => {
      dispatch(showChat());
    },
    addUser: (username) => {
      dispatch(addUser(username));
    },
    changeInputActive: (focused) => {
      dispatch(changeInputActive(focused));
    },
    messageSubmit: (message, socket) => {
      dispatch(messageSubmit(message, socket));
    },
    messageRecieved: (message) => {
      dispatch(messageRecieved(message));
    },
    syncMessages: (messageList) => {
      dispatch(syncMessages(messageList));
    }
  };
};


export default connect(mapStateToProps, mapDispatchToProps)(Launcher);