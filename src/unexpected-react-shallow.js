var ReactElement = require('./lib/ReactElement');
var ReactShallowRenderer = require('./lib/ReactShallowRenderer');
// var Assertions = require('./lib/assertions');
var UnexpectedHtmlLike = require('unexpected-htmllike');
var JsxAdapter = require('unexpected-htmllike-jsx-adapter');

module.exports = {

    name: 'unexpected-react-shallow',

    installInto: function (expect) {



        expect.installPlugin(require('magicpen-prism'));


        ReactShallowRenderer.addTypeTo(expect);

        ReactElement.addTypeTo(expect);

        expect.addAssertion(['<ReactElement> to have [exactly] rendered <ReactElement>',
        '<ReactElement> to have rendered [with all children] [with all wrappers] <ReactElement>'], function (expect, subject, expected) {

            var exactly = this.flags.exactly;
            var withAllChildren = this.flags['with all children'];
            var withAllWrappers = this.flags['with all wrappers'];

            var adapter = JsxAdapter.create();
            var jsxHtmlLike = new UnexpectedHtmlLike(adapter);
            if (!exactly) {
                adapter.setOptions({ concatTextContent: true });
            }

            var options = {
                diffWrappers: exactly || withAllWrappers,
                diffExtraChildren: exactly || withAllChildren,
                diffExtraAttributes: exactly
            };

            var diffResult = jsxHtmlLike.diff(adapter, subject, expected, expect.output.clone(), expect.diff.bind(expect), expect.inspect.bind(expect),
                expect.equal.bind(expect), options);

            if (diffResult.weight !== 0) {
                console.log(diffResult.output.toString())
                return expect.fail({
                    diff: function () {
                        return {
                            diff: diffResult.output
                        };
                    }
                });
            }

        });

        expect.addAssertion(['<ReactElement> to contain [exactly] <ReactElement|string>',
            '<ReactElement> to contain [with all children] [with all wrappers] <ReactElement|string>'], function (expect, subject, expected) {

            var exactly = this.flags.exactly;
            var withAllChildren = this.flags['with all children'];
            var withAllWrappers = this.flags['with all wrappers'];

            var adapter = JsxAdapter.create();
            var jsxHtmlLike = new UnexpectedHtmlLike(adapter);
            if (!exactly) {
                adapter.setOptions({ concatTextContent: true });
            }

            var options = {
                diffWrappers: exactly || withAllWrappers,
                diffExtraChildren: exactly || withAllChildren,
                diffExtraAttributes: exactly
            };

            var containsResult = jsxHtmlLike.contains(adapter, subject, expected,
                expect.output, expect.diff.bind(expect),  expect.inspect.bind(expect), expect.equal.bind(expect), options);

            if (!containsResult.found) {
                expect.fail({
                    diff: function (output) {
                        return {
                            diff: output.error('the best match was').nl().append(containsResult.bestMatch.output)
                        };
                    }
                });
            }

        });

        expect.addAssertion('<ReactElement> to satisfy <ReactElement>', function (expect, subject, renderOutput) {
            return expect(subject, 'to have rendered', renderOutput);
        });

        expect.addAssertion(['<ReactShallowRenderer> to have [exactly] rendered <ReactElement>',
            '<ReactShallowRenderer> to have rendered [with all children] [with all wrappers] <ReactElement>'], function (expect, subject, renderOutput) {
            var actual = subject.getRenderOutput();
            return expect(actual, 'to have [exactly] rendered [with all children] [with all wrappers]', renderOutput);
        });

        expect.addAssertion(['<ReactShallowRenderer> to contain [exactly] <ReactElement|string>',
            '<ReactShallowRenderer> to contain [with all children] [with all wrappers] <ReactElement|string>'], function (expect, subject, renderOutput) {
            var actual = subject.getRenderOutput();
            return expect(actual, 'to contain [exactly] [with all children] [with all wrappers]', renderOutput);
        });
    }
};
