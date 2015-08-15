var Unexpected = require('unexpected');
var UnexpectedReactShallow = require('../src/unexpected-react-shallow');
var React = require('react/addons');

var expect = Unexpected.clone();

var ES5Component = React.createClass({
    displayName: 'ES5Component',
    render() { return null;}
});

class ClassComponent extends React.Component {
    render() { return null;}
}


describe('unexpected-react-shallow', () => {

    var testExpect;
    var renderer, renderer2;

    beforeEach(function () {
        renderer = React.addons.TestUtils.createRenderer();
        renderer2 = React.addons.TestUtils.createRenderer();

        testExpect = Unexpected.clone()
            .installPlugin(UnexpectedReactShallow);
    });

    it('identifies a ReactElement', () => {

        renderer.render(<div />);
        var element = renderer.getRenderOutput();

        testExpect(element, 'to be a', 'ReactElement');
    });

    it('identifies a ShallowRenderer', () => {

        testExpect(renderer, 'to be a', 'ReactShallowRenderer');
    });

    describe('inspect', () => {

        it('outputs a tag element with no props', () => {

            renderer.render(<div />);
            expect(() => testExpect(renderer, 'to equal', ''), 'to throw',
                "expected <div /> to equal ''");
        });

        it('outputs a tag element with string  props', () => {

            renderer.render(<div className="test"/>);
            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected <div className="test" /> to equal 1');
        });

        it('outputs a tag element with number props', () => {

            renderer.render(<div id={42} />);
            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected <div id={42} /> to equal 1');
        });

        it('outputs a tag element with boolean props', () => {

            renderer.render(<div disabled={true} />);
            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected <div disabled={true} /> to equal 1');
        });

        it('outputs a tag element with null props', () => {

            renderer.render(<div className={null} />);
            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected <div className={null} /> to equal 1');
        });

        it('outputs a tag element with an undefined prop', () => {

            renderer.render(<div className={undefined} />);
            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected <div className={undefined} /> to equal 1');
        });

        it('outputs a tag with a single string child', () => {

            renderer.render(<div className="test">some content</div>);
            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected\n' +
                '<div className="test">\n' +
                '  some content\n' +
                '</div>\n' +
                'to equal 1');
        });

        it('outputs an ES5 createClass component props and no children', () => {

            renderer.render(<div><ES5Component className="test">some content</ES5Component></div>);

            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ES5Component className="test">\n' +
                '    some content\n' +
                '  </ES5Component>\n' +
                '</div>\n' +
                'to equal 1')
        });

        it('outputs an ES5 class component props and children', () => {

            renderer.render(<div><ClassComponent className="test">some content</ClassComponent></div>);

            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent className="test">\n' +
                '    some content\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                'to equal 1');
        });

        it('outputs a set of deep nested components', () => {

            renderer.render(
                <div>
                    <ClassComponent className="test">
                        <ClassComponent some={1} more={true} props="yeah">
                          some content
                        </ClassComponent>
                        <ClassComponent some={1} more={true} props="yeah">
                          some different content
                        </ClassComponent>
                    </ClassComponent>
                </div>);

            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent className="test">\n' +
                '    <ClassComponent some={1} more={true} props="yeah">\n' +
                '      some content\n' +
                '    </ClassComponent>\n' +
                '    <ClassComponent some={1} more={true} props="yeah">\n' +
                '      some different content\n' +
                '    </ClassComponent>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                'to equal 1');
        });
    });

    describe('diff', () => {

        it('diffs within simple text content inside native element', () => {

            renderer.render(<div>Some simple content</div>);
            var expected = <div>Different content</div>;
            // testExpect(renderer, 'to have rendered', expected);

            expect(() => testExpect(renderer, 'to have rendered', expected), 'to throw',
             'expected\n' +
             '<div>\n' +
             '  Some simple content\n' +
             '</div>\n' +
             'to have rendered\n' +
             '<div>\n' +
             '  Different content\n' +
             '</div>\n' +
             '\n' +
             '<div>\n'+
             '  -Some simple content\n' +
             '  +Different content\n' +
             '</div>'
            );

        });

        it('shows changed props within a simple native element', () => {

            renderer.render(<div className="actual">Some simple content</div>);
            testExpect(renderer, 'to have rendered',
                <div className="expected">
                    Some simple content
                </div>),
            expect(() => testExpect(renderer, 'to have rendered',
                <div className="expected">
                    Some simple content
                </div>), 'to throw',
                'expected\n' +
                '<div className="actual">\n' +
	            '  Some simple content\n' +
                '</div>\n' +
                'to have rendered\n' +
	            '<div className="expected">\n' +
	            '  Some simple content\n' +
	            '</div>\n' +
                '\n' +
	            '<div className="actual" // should equal \'expected\'\n' +
                '  >\n' +
                '  Some simple content\n' +
                '</div>');
        });


    });

});
