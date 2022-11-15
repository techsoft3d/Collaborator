import React, { Component } from 'react';
import SendIcon from './icons/SendIcon';


class UserInput extends Component {

  handleKey(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
      this._submitText(event);
    }
  }

  _submitText(event) {
    event.preventDefault();
    const text = this.userInput.textContent;
    if (text && text.length > 0) {
      this.props.onSubmit({
        author: this.props.author,
        type: 'text',
        data: { text }
      }, this.props.socket);
      this.userInput.innerHTML = '';
    }
  }

  render() {
    return (
      <form className={`sc-user-input ${(this.props.inputActive ? 'active' : '')}`}>
        <div
          role="button"
          tabIndex="0"
          onFocus={() => this.props.changeInputActive(true)}
          onBlur={() => this.props.changeInputActive(false)}
          ref={(e) => { this.userInput = e; }}
          onKeyDown={this.handleKey.bind(this)}
          contentEditable="true"
          placeholder="Write a reply..."
          className="sc-user-input--text"
        >
        </div>
        <div className="sc-user-input--buttons">
          <div className="sc-user-input--button"></div>
          <div className="sc-user-input--button">
            <SendIcon onClick={this._submitText.bind(this)} />
          </div>
        </div>
      </form>
    );
  }
}

export default UserInput;
