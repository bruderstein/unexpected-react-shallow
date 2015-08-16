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

        it('outputs a tag element with an object prop', () => {

            var obj = { some: 'prop' };
            renderer.render(<div className={obj} />);
            expect(() => testExpect(renderer, 'to equal', 1), 'to throw',
                'expected <div className={...} /> to equal 1');
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
	            '<div className="actual" // -actual\n' +
                '                        // +expected\n' +
                '>\n' +
                '   Some simple content\n' +
                '</div>');
        });

        it('shows missing props within a simple native element', () => {

            renderer.render(<div>Some simple content</div>);

            expect(() => testExpect(renderer, 'to have rendered',
                    <div className="expected" id="123">
                        Some simple content
                    </div>), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  Some simple content\n' +
                '</div>\n' +
                'to have rendered\n' +
                '<div className="expected" id="123">\n' +
                '  Some simple content\n' +
                '</div>\n' +
                '\n' +
                '<div // missing className="expected"\n' +
                '     // missing id="123"\n' +
                '>\n' +
                '   Some simple content\n' +
                '</div>');
        });

        it('ignores extra props within a simple native element', () => {

            renderer.render(<div id="123" className="extra">Some simple content</div>);

            testExpect(renderer, 'to have rendered',
                    <div id="123">
                        Some simple content
                    </div>);
        });

        it('does not ignore extra props when using `exactly`', function () {

            renderer.render(<div id="123" className="extra">Some simple content</div>);
            expect(() => {
                testExpect(renderer, 'to have exactly rendered',
                    <div id="123">
                        Some simple content
                    </div>);
            }, 'to throw',
                'expected\n' +
                '<div id="123" className="extra">\n' +
                '  Some simple content\n' +
                '</div>\n' +
                'to have exactly rendered\n' +
                '<div id="123">\n' +
                '  Some simple content\n' +
                '</div>\n' +
                '\n' +
                '<div id="123" className="extra" // should be removed\n' +
                '>\n' +
                '   Some simple content\n' +
                '</div>');
        });

        it('matches props on a custom component', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <span className="bar">foo</span>
                    </ClassComponent>
                </div>
            );

            testExpect(renderer, 'to have exactly rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <span className="bar">foo</span>
                    </ClassComponent>
                </div>);
        });

        it('highlights diffs on a nested custom component', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <span className="bar">foo</span>
                    </ClassComponent>
                </div>
            );

            expect(() => testExpect(renderer, 'to have exactly rendered',
                <div>
                    <ClassComponent className="foo" test={false}>
                        <span className="bar">foo</span>
                    </ClassComponent>
                </div>), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo">\n' +
                '    <span className="bar">\n' +
                '      foo\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                'to have exactly rendered\n' +
                '<div>\n' +
                '  <ClassComponent className="foo" test={false}>\n' +
                '    <span className="bar">\n' +
                '      foo\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                '\n' +
                '<div>\n' +
                '  <ClassComponent test={true} // should equal false\n' +
                '                  className="foo">\n' +
                '    <span className="bar">\n' +
                '      foo\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>');

        });


        it('ignores extra props on a nested custom component when not using `exactly`', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo" extraProp="boo!">
                        <span className="bar">foo</span>
                    </ClassComponent>
                </div>
            );

            testExpect(renderer, 'to have rendered',
                    <div>
                        <ClassComponent className="foo" test={true}>
                            <span className="bar">foo</span>
                        </ClassComponent>
                    </div>);

        });

        it('highlights extra props on a nested custom component when using `exactly`', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo" extraProp="boo!">
                        <span className="bar">foo</span>
                    </ClassComponent>
                </div>
            );

            expect(() => testExpect(renderer, 'to have exactly rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <span className="bar">foo</span>
                    </ClassComponent>
                </div>), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo" extraProp="boo!">\n' +
                '    <span className="bar">\n' +
                '      foo\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                'to have exactly rendered\n' +
                '<div>\n' +
                '  <ClassComponent className="foo" test={true}>\n' +
                '    <span className="bar">\n' +
                '      foo\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                '\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo" extraProp="boo!" // should be removed\n' +
                '  >\n' +
                '    <span className="bar">\n' +
                '      foo\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>');


        });

        it('matches array of children in a custom component', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <span className="one">1</span>
                        <span className="two">2</span>
                    </ClassComponent>
                </div>
            );

            testExpect(renderer, 'to have exactly rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <span className="one">1</span>
                        <span className="two">2</span>
                    </ClassComponent>
                </div>);
        });

        it('highlights a removed item in an array of children in a custom component', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <span className="one">1</span>
                        <span className="three">3</span>
                    </ClassComponent>
                </div>
            );

            expect(() => testExpect(renderer, 'to have exactly rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <span className="one">1</span>
                        <span className="two">2</span>
                        <span className="three">3</span>
                    </ClassComponent>
                </div>), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo">\n' +
                '    <span className="one">\n' +
                '      1\n' +
                '    </span>\n' +
                '    <span className="three">\n' +
                '      3\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                'to have exactly rendered\n' +
                '<div>\n' +
                '  <ClassComponent className="foo" test={true}>\n' +
                '    <span className="one">\n' +
                '      1\n' +
                '    </span>\n' +
                '    <span className="two">\n' +
                '      2\n' +
                '    </span>\n' +
                '    <span className="three">\n' +
                '      3\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                '\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo">\n' +
                '    <span className="one">\n' +
                '      1\n' +
                '    </span>\n' +
                '    <span className="three" // -three\n' +
                '                            // +two\n' +
                '    >\n' +
                '      -3\n' +
                '      +2\n' +
                '    </span>\n' +
                '    // missing <span className="three">\n' +
                '    //           3\n' +
                '    //         </span>\n' +
                '  </ClassComponent>\n' +
                '</div>');
        });


        it('highlights an added item in an array of children in a custom component', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <span className="one">1</span>
                        <span className="three">3</span>
                    </ClassComponent>
                </div>
            );

            expect(() => testExpect(renderer, 'to have exactly rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <span className="one">1</span>
                        <span className="two">2</span>
                        <span className="three">3</span>
                    </ClassComponent>
                </div>
            ), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo">\n' +
                '    <span className="one">\n' +
                '      1\n' +
                '    </span>\n' +
                '    <span className="three">\n' +
                '      3\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                'to have exactly rendered\n' +
                '<div>\n' +
                '  <ClassComponent className="foo" test={true}>\n' +
                '    <span className="one">\n' +
                '      1\n' +
                '    </span>\n' +
                '    <span className="two">\n' +
                '      2\n' +
                '    </span>\n' +
                '    <span className="three">\n' +
                '      3\n' +
                '    </span>\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                '\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo">\n' +
                '    <span className="one">\n' +
                '      1\n' +
                '    </span>\n' +
                '    <span className="three" // -three\n' +
                '                            // +two\n' +
                '    >\n' +
                '      -3\n' +
                '      +2\n' +
                '    </span>\n' +
                '    // missing <span className="three">\n' +
                '    //           3\n' +
                '    //         </span>\n' +
                '  </ClassComponent>\n' +
                '</div>');

        });

        it('accepts added children at the end of an array when not using `exactly`', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <span className="one">1</span>
                        <span className="two">2</span>
                        <span className="three">3</span>
                    </ClassComponent>
                </div>
            );

            testExpect(renderer, 'to have rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <span className="one">1</span>
                        <span className="two">2</span>
                    </ClassComponent>
                </div>);
        });

        it('accepts added children in the middle of an array when not using `exactly`', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <span className="one">1</span>
                        <span className="two">2</span>
                        <span className="three">3</span>
                    </ClassComponent>
                </div>
            );

            testExpect(renderer, 'to have rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <span className="one">1</span>
                        <span className="three">3</span>
                    </ClassComponent>
                </div>);
        });

        it('highlights different typed children', function () {

            renderer.render(
                <div>
                    <ClassComponent test={true} className="foo">
                        <ClassComponent child={true} />
                    </ClassComponent>
                </div>
            );

            expect(() => testExpect(renderer, 'to have rendered',
                <div>
                    <ClassComponent className="foo" test={true}>
                        <ES5Component child={true} />
                    </ClassComponent>
                </div>), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo">\n' +
                '    <ClassComponent child={true} />\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                'to have rendered\n' +
                '<div>\n' +
                '  <ClassComponent className="foo" test={true}>\n' +
                '    <ES5Component child={true} />\n' +
                '  </ClassComponent>\n' +
                '</div>\n' +
                '\n' +
                '<div>\n' +
                '  <ClassComponent test={true} className="foo">\n' +
                '    <ClassComponent // should be ES5Component\n' +
                '                    child={true}></ClassComponent>\n' +
                '  </ClassComponent>\n' +
                '</div>');
        });

        it('matches matching objects as props deeply not be reference', function () {

            var objectA = { some: 'prop', arr: [ 1, 2, 3 ] };
            var objectB = { some: 'prop', arr: [ 1, 2, 3 ] };

            renderer.render(
                <div>
                    <ClassComponent test={objectA} />
                </div>
            );

            testExpect(renderer, 'to have rendered',
                <div>
                    <ClassComponent test={objectB} />
                </div>);
        });

        it('highlights different objects as props deeply not be reference', function () {

            var objectA = { some: 'prop', arr: [ 1, 2, 3 ] };
            var objectB = { some: 'prop', arr: [ 1, 2, 4 ] };

            renderer.render(
                <div>
                    <ClassComponent test={objectA} />
                </div>
            );

            expect(() => testExpect(renderer, 'to have rendered',
                <div>
                    <ClassComponent test={objectB} />
                </div>), 'to throw',
                'expected\n' +
                '<div>\n' +
                '  <ClassComponent test={...} />\n' +
                '</div>\n' +
                'to have rendered\n' +
                '<div>\n' +
                '  <ClassComponent test={...} />\n' +
                '</div>\n' +
                '\n' +
                '<div>\n' +
                "  <ClassComponent test={{ some: 'prop', arr: [ 1, 2, 3 ] }} // {\n" +
                "                                                            //   some: 'prop',\n" +
                "                                                            //   arr: [\n" +
                "                                                            //     1,\n" +
                "                                                            //     2,\n" +
                "                                                            //     3 // should equal 4\n" +
                "                                                            //   ]\n" +
                "                                                            // }\n" +
                '  ></ClassComponent>\n' +
                '</div>')
        });
    });

});
