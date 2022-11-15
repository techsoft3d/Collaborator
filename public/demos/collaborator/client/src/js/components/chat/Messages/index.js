import React, { Component } from 'react'
import TextMessage from './TextMessage'
// import chatIconUrl from '../icons/chat-icon.svg'


class Message extends Component {

  render () {
    let contentClassList = [
      "sc-message--content",
      (this.props.message.author === this.props.author ? "sent" : "received")
    ];
    let authorClassList = [
      "sc-message--author",
      (this.props.message.author === this.props.author ? "sent" : "received")
    ];
    return (
      <div className="sc-message">
        <div className={contentClassList.join(" ")}>
          <TextMessage {...this.props.message} />
        </div>
        <div className={authorClassList.join(" ")}>
          {this.props.message.author}
        </div>
      </div>)
  }
}

export default Message