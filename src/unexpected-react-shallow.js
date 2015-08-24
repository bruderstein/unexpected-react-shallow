var React = require('react/addons');
var ArrayChanges = require('array-changes');

var Element = require('./lib/element');
var Write = require('./lib/write');
var Equality = require('./lib/equality');


function compareElements(actual, expected, expect, options) {

    var result  = Equality.elementsMatch(actual, expected, expect.equal.bind(expect), options);
    if (!result) {
        return expect.fail('elements are not equal');
    }
}

function findElementIn(haystack, needle, expect, options) {

    if (Equality.elementsMatch(haystack, needle, expect.equal.bind(expect), options)) {
        return true;
    }

    var found = false;
    var shouldNormalize = !options.exactly;

    if (haystack.props && haystack.props.children) {

        var children = Element.getChildrenArray(haystack.props.children, {
            normalize: shouldNormalize
        });

        children.forEach(function (child) {

            if (Equality.elementsMatch(child, needle, expect.equal.bind(expect), options)) {
                found = true;
                return;
            }

            if (findElementIn(child, needle, expect, options)) {
                found = true;
            }
        });
    }
    return found;
}

function diffChildren(actual, expected, output, diff, inspect, equal, options) {
    if (typeof actual === 'string' && typeof expected === 'string') {
        var stringDiff = diff(actual.trim(), expected.trim());
        output.i().block(stringDiff.diff);
        return;
    }

    var actualChildren = Element.getChildrenArray(actual, {
        normalize: !options || !options.exactly
    });

    var expectedChildren = Element.getChildrenArray(expected, {
        normalize: !options || !options.exactly
    });

    var changes = ArrayChanges(actualChildren, expectedChildren,
        function (a, b) {
            return Equality.elementsMatch(a, b, equal, options);
        },

                function (a, b) {
                    // Figure out whether a and b are the same element so they can be diffed inline.
                    if ((typeof a === 'string' || typeof a === 'number' || typeof a === 'undefined') &&
                       (typeof b === 'string' || typeof b === 'number' || typeof b === 'undefined')) {
                        return true;
                    }

                    return (
                        Element.getName(a)  === Element.getName(b)
                    );
                } );

    changes.forEach(function (diffItem, index) {
        output.i().block(function () {
            var type = diffItem.type;

            if (type === 'insert') {
                this.annotationBlock(function () {
                    this.error('missing ');
                    if (typeof diffItem.value === 'string') {
                        this.block(function () {
                            this.text(diffItem.value);
                        });
                    } else {
                        this.block(inspect(diffItem.value));
                    }
                });
            } else if (type === 'remove') {
                if (typeof diffItem.value === 'string') {
                    this.block(function () {
                        this.text(diffItem.value).sp().error('// should be removed');
                    });
                } else {
                    this.block(inspect(diffItem.value).sp().error('// should be removed'));
                }
            } else if (type === 'equal') {
                if (typeof diffItem.value === 'string') {
                    this.block(function () {
                        this.text(diffItem.value);
                    });
                } else {
                    this.block(inspect(diffItem.value));
                }
            } else {
                var valueDiff = diffElements(diffItem.value, diffItem.expected, output.clone(), diff, inspect, equal, options);

                if (valueDiff) {
                    this.block(valueDiff.diff);
                }
            }
        }).nl(index < changes.length - 1 ? 1 : 0);
    });
}

function diffElements(actual, expected, output, diff, inspect, equal, options) {
    var result = {
        diff: output,
        inline: true
    };

    if ((typeof actual === 'string' || typeof actual === 'number') &&
            (typeof expected === 'string' || typeof expected === 'number')) {
        return diff('' + actual, '' + expected);
    }
    var emptyElements = (!actual.props || React.Children.count(actual.props.children) === 0) &&
        (!expected.props || React.Children.count(expected.props.children) === 0);

    var propsMatching = Equality.propsMatch(Element.getProps(actual), Element.getProps(expected), equal, options);

    var conflictingElement = Element.getName(actual) !== Element.getName(expected) || !propsMatching;

    if (conflictingElement) {
        var canContinueLine = true;
        output
            .prismPunctuation('<')
            .prismTag(Element.getName(actual));
        if (Element.getName(actual) !== Element.getName(expected)) {
            output.sp().annotationBlock(function () {
                this.error('should be').sp().prismTag(Element.getName(expected));
            }).nl();
            canContinueLine = false;
        }
        var actualProps = Element.getProps(actual);
        var expectedProps = Element.getProps(expected);
        Object.keys(actualProps).forEach(function (propName) {
            output.sp(canContinueLine ? 1 : 2 + Element.getName(actual).length);
            if (propName in expectedProps) {
                if (actualProps[propName] === expectedProps[propName]) {
                    Write.writeProp(output, propName, actualProps[propName]);
                    canContinueLine = true;
                } else {
                    Write.writeProp(output, propName, actualProps[propName], inspect);
                    output.sp().annotationBlock(function () {
                        var diffResults = diff(actualProps[propName], expectedProps[propName]);
                        if (diffResults) {
                            this.append(diffResults.diff);
                        } else {
                            this.error('should equal').sp().append(inspect(expectedProps[propName]));
                        }

                    }).nl();
                    canContinueLine = false;
                }
                delete expectedProps[propName];
            } else if (options.exactly) {
                Write.writeProp(output, propName, actualProps[propName]);
                output.sp().annotationBlock(function () {
                    this.error('should be removed');
                }).nl();
                canContinueLine = false;
            }
        });
        Object.keys(expectedProps).forEach(function (propName) {
            output.sp(canContinueLine ? 1 : 2 + Element.getName(actual).length);
            output.annotationBlock(function () {
                this.error('missing').sp();
                Write.writeProp(this, propName, expectedProps[propName]);
            }).nl();
            canContinueLine = false;
        });
        output.prismPunctuation('>');
    } else {
        output.prismPunctuation('<')
            .prismTag(Element.getName(actual));
        Write.writeProps(output, actual.props);
        output.prismPunctuation('>');
    }

    if (!emptyElements) {
        output.nl().indentLines();
        diffChildren(actual.props.children, expected.props.children, output, diff, inspect, equal, options);
        output.nl().outdentLines();
    }

    output.code('</' + Element.getName(actual) + '>', 'html');
    return result;
}


module.exports = {
    name: 'unexpected-react-shallow',
    installInto: function (expect) {

        expect.installPlugin(require('magicpen-prism'));
        expect.addType({
            name: 'ReactShallowRenderer',
            base: 'object',
            identify: function(value) {
                return typeof value === 'object' &&
                    value !== null &&
                    typeof value.getRenderOutput === 'function';
            },

            inspect: function(value, depth, output, inspect) {
                output.append(inspect(value.getRenderOutput()));
            }
    });

        expect.addType({
            name: 'ReactElement',

            identify: function (value) {
                return React.isValidElement(value) || (typeof value === 'object' &&
                    value !== null &&
                        typeof value.type === 'string' &&
                        value.hasOwnProperty('props') &&
                        value.hasOwnProperty('ref') &&
                        value.hasOwnProperty('key')
                    );
            },

            inspect: function (value, depth, output, inspect) {

                output
                    .prismPunctuation('<')
                    .prismTag(Element.getName(value));

                Write.writeProps(output, value.props);

                if (React.Children.count(value.props.children)) {
                    output.prismPunctuation('>');
                    output.nl().indentLines();

                    var children = Element.getChildrenArray(value.props.children, { normalize: true });

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

            diff: function(actual, expected, output, diff, inspect, equal) {
                return diffElements(actual, expected, output, diff, inspect, equal);
            },
            equal: function(a, b, equal) {
                return Equality.elementsMatch(a, b, equal, { exactly: true });
            }
        });

        expect.addAssertion('ReactElement', 'to have [exactly] rendered', function (expect, subject, renderOutput) {

            var exactly = this.flags.exactly;

            expect.withError(function () {
                return compareElements(subject, renderOutput, expect, {
                    exactly: exactly
                });
            }, function (e) {
                return expect.fail({
                    diff : function (output, diff, inspect, equal) {
                        return diffElements(subject, renderOutput, output, diff, inspect, equal, {
                            exactly: exactly
                        });
                    }
                });
            });
        });

        expect.addAssertion('ReactElement', 'to contain', function (expect, subject, expected) {

            if (!findElementIn(subject, expected, expect, {
                    exactly: false
                })) {
                expect.fail();
            }
        });

        expect.addAssertion('ReactElement', 'to contain exactly', function (expect, subject, expected) {

            if (!findElementIn(subject, expected, expect, {
                    exactly: true
                })) {
                expect.fail();
            }
        });

        expect.addAssertion('ReactShallowRenderer', 'to have [exactly] rendered', function (expect, subject, renderOutput) {

                var actual = subject.getRenderOutput();
                return expect(actual, 'to have ' + (this.flags.exactly ? 'exactly ' : '') + 'rendered', renderOutput);
        });

        expect.addAssertion('ReactShallowRenderer', 'to contain', function (expect, subject, expected) {

            var actual = subject.getRenderOutput();
            return expect(actual, 'to contain', expected);
        });

        expect.addAssertion('ReactShallowRenderer', 'to contain exactly', function (expect, subject, expected) {

            var actual = subject.getRenderOutput();
            return expect(actual, 'to contain exactly', expected);
        });

    }
};
