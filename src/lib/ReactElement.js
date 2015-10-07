var React = require('react');
var Diff = require('./diff');
var Element = require('./element');
var Equality = require('./equality');
var Write = require('./write');

exports.addTypeTo = function (expect) {
    expect.addType({
        name: 'ReactElement',

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

            output
                .prismPunctuation('<')
                .prismTag(Element.getName(value));

            Write.writeProps(output, value.props);

            if (React.Children.count(value.props.children)) {
                output.prismPunctuation('>');
                output.nl().indentLines();

                var children = Element.getChildrenArray(value.props.children, {normalize: true});

                children.forEach(function (child) {

                    if (typeof child === 'string') {
                        output.i().prismString(child).nl();
                    } else {
                        output.i().block(inspect(child)).nl();
                    }
                });
                output.outdentLines();
                output.i()
                    .prismPunctuation('</').prismTag(Element.getName(value)).prismPunctuation('>');

            } else {
                output.prismPunctuation(' />');
            }
        },

        diff: function (actual, expected, output, diff, inspect, equal) {
            return Diff.diffElements(actual, expected, output, diff, inspect, equal, { exactly: true });
        },

        equal: function (a, b, equal) {
            return Equality.elementsMatch(a, b, equal, { exactly: true });
        }
    });
};
