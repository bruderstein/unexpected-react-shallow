import React, { PropTypes, Component } from 'react';
import ChildComponent from './ChildComponent';

export default class MyComponent extends Component {

    constructor(props) {
        super();
        this.state = { clickCount: 0 };
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        this.setState({
            clickCount: this.state.clickCount + 1
        });
    }

    render() {

        return (
            <div className="my-component">
                <ChildComponent id={this.props.id} data={this.props.data} onClick={this.onClick}>
                    {this.state.clickCount}
                </ChildComponent>
            </div>
        );
    }
}