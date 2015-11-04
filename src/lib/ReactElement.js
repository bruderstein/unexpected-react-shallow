var React = require('react');
var UnexpectedHtmlLike = require('unexpected-htmllike');
var JsxHtmlLikeAdapter = require('unexpected-htmllike-jsx-adapter');

var jsxAdapter = new JsxHtmlLikeAdapter();

var jsxHtmlLike = new UnexpectedHtmlLike(jsxAdapter);

exports.addTypeTo = function (expect) {
    expect.addType({
        name: 'ReactElement',
        base: 'object',

        identify: function (value) {
            return React.isValidElement(value) ||
                (typeof value === 'object' &&
                 value !== null &&
                 (typeof value.type === 'function' || typeof value.type === 'string') &&
                 value.hasOwnProperty('props') &&
                 value.hasOwnProperty('ref') &&
                 value.hasOwnProperty('key'));
        },

        inspect: function (value, depth, output, inspect) {

            return jsxHtmlLike.inspect(value, depth, output, inspect);
        },

        diff: function (actual, expected, output, diff, inspect, equal) {
            try {
                const diffResult = jsxHtmlLike.diff(jsxAdapter, actual, expected, output, diff, inspect, equal, {});

                return {
                    diff: diffResult.output
                };
            } catch (e) {
                console.log('diff Failed', e.stack);
                throw e;
            }
        },

        equal: function (a, b, equal) {
            try {

                const diffResult = jsxHtmlLike.diff(jsxAdapter, a, b, expect.output.bind(expect), expect.diff.bind(expect), expect.inspect.bind(expect),
                    expect.equal.bind(expect), {});
                return (diffResult.weight === 0);
            } catch (e) {
                console.log(e.stack)
            }
        }
    });
};
