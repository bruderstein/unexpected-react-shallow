import React, { PropTypes, Component } from 'react';

export default class ChildComponent extends Component {

    render() {
        return <div className="child" id={this.props.id || 'default' } />;
    }
}