
import React, { PropTypes, Component } from 'react/addons';
import MyComponent from './components/MyComponent';
import ChildComponent from './components/ChildComponent';
import Unexpected from 'unexpected';

import UnexpectedReactShallow from '../src/unexpected-react-shallow';

const expect = Unexpected.clone()
    .installPlugin(UnexpectedReactShallow);

const TestUtils = React.addons.TestUtils;

if (!global.document) {
    global.document =  {};
}

describe('MyComponent', function () {

    let renderer;

    beforeEach(() => {

        renderer = TestUtils.createRenderer();
    });

    it('renders the initial 0 clicks', function () {

        var element = <MyComponent id={123} />;
        renderer.render(element);
        expect(renderer, 'to have rendered',
            <div className="my-component">
                <ChildComponent id={123}>
                    {0}
                </ChildComponent>
            </div>
        );


    });

});
