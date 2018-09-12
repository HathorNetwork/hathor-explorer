import React from 'react';


class HathorAlert extends React.Component {
  render() {
    return (
      <div id={this.props.id} className={`hathor-alert alert alert-${this.props.type} alert-dismissible fade col-10 col-sm-3`} role="alert">
        {this.props.text}
        <button type="button" className="close" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    );
  }
}

export default HathorAlert;