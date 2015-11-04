var UnexpectedHtmlLike = require('unexpected-htmllike');
var JsxHtmlLikeAdapter = require('unexpected-htmllike-jsx-adapter');


exports.addAssertionsTo = function (expect) {

      expect.addAssertion(['<ReactElement> to have [exactly] rendered <ReactElement>',
        '<ReactElement> to have rendered [with all children] [with all wrappers] <ReactElement>'], function (expect, subject, expected) {

            var exactly = this.flags.exactly;
            var withAllChildren = this.flags['with all children'];
            var withAllWrappers = this.flags['with all wrappers'];

            var adapter = new JsxHtmlLikeAdapter();
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

        expect.addAssertion(['<ReactElement> [not] to contain [exactly] <ReactElement|string>',
            '<ReactElement> [not] to contain [with all children] [with all wrappers] <ReactElement|string>'], function (expect, subject, expected) {

            var exactly = this.flags.exactly;
            var withAllChildren = this.flags['with all children'];
            var withAllWrappers = this.flags['with all wrappers'];

            var adapter = new JsxHtmlLikeAdapter();
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

            if (this.flags.not) {
                if (containsResult.found) {
                    expect.fail({
                        diff: output => {
                            return {
                                diff: output.error('but found the following match').nl().append(containsResult.bestMatch.output)
                            };
                        }
                    });
                }
                return;
            }

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

        expect.addAssertion(['<ReactShallowRenderer> [not] to contain [exactly] <ReactElement|string>',
            '<ReactShallowRenderer> [not] to contain [with all children] [with all wrappers] <ReactElement|string>'], function (expect, subject, renderOutput) {
            var actual = subject.getRenderOutput();
            return expect(actual, '[not] to contain [exactly] [with all children] [with all wrappers]', renderOutput);
        });

};
