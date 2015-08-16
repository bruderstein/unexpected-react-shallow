var React = require('react/addons');
var ArrayChanges = require('array-changes');

function getElementName(element) {
    if (element.type) {
        return element.type.displayName || element.type.name || element.tagName || element.type || 'no-display-name';
    }
    if (element.constructor) {

        return element.constructor.displayName || element.constructor.name || element.tagName || 'no-display-name';
    }
    return 'no-display-name';
}

function getProps(element) {
    if (element.props) {
        var realProps = {};
        for(var key in element.props) {
            if (key !== 'children') {
                realProps[key] = element.props[key];
            }
        }
        return realProps;
    }
    return null;
}

function writeProps(output, props) {
    if (props) {
        Object.keys(props).forEach(function (prop) {
            if (prop === 'children') {
                return;
            }
            output.text(' ');
            writeProp(output, prop, props[prop]);
        });
    }
}

function writeProp(output, propName, value, inspect) {

    output.prismAttrName(propName)
        .prismPunctuation('=');
    if (inspect) {
        if (typeof (value) === 'string') {

            output.prismPunctuation('"');
            output.append(value);
            output.prismPunctuation('"');
        } else {
            output.prismPunctuation('{');
            output.append(inspect(value));
            output.prismPunctuation('}');
        }
        return;
    }

    switch (typeof value) {
        case 'number':
        case 'boolean':
        case 'undefined':
            output.text('{')
                .text(value)
                .text('}');
            break;
        case 'string':
            output.prismPunctuation('"').prismAttrValue(value).prismPunctuation('"');
            break;

        case 'object':
            if (value === null) {
                output.prismPunctuation('{').prismAttrValue('null').prismPunctuation('}');
            } else {
                output.prismPunctuation('{').prismAttrValue('...').prismPunctuation('}');
            }
            break;
        case 'function':
            output.prismPunctuation('{').prismAttrValue(' function(){} ').prismPunctuation('}');
            break;
        default:
            output.prismPunctuation('{').prismAttrValue(' ?unknown-type? ').prismPunctuation('}');
            break;
    }
}

function concatenateStringChildren(accum, value) {
    if (typeof value === 'string' && accum.length &&
        typeof accum[accum.length - 1] === 'string')
    {
        accum[accum.length - 1] = accum[accum.length - 1] + value;
        return accum;
    }
    accum.push(value);
    return accum;
}



function elementsMatch(actual, expected, equal, options) {

    if (typeof actual === 'string' && typeof expected === 'string') {
        return actual === expected;
    }

    if (typeof actual !== typeof expected) {   // Fundamentally different e.g. string vs ReactElement
        return false;
    }

    if (getElementName(actual) !== getElementName(expected)) {
        return false;
    }

    if (!propsMatch(getProps(actual), getProps(expected), equal, options)) {
        return false;
    }

    if (expected.props.children) {
        if (!actual.props.children) {
            return false;
        }

        var actualChildren = [];
        React.Children.forEach(actual.props.children, child => actualChildren.push(child));
        var expectedChildren = [];
        React.Children.forEach(expected.props.children, child => expectedChildren.push(child));

        if (options && !options.exactly) {

            actualChildren = actualChildren.reduce(concatenateStringChildren, []);
            expectedChildren = expectedChildren.reduce(concatenateStringChildren, []);
        }

        var arrayDiffs = ArrayChanges(
            actualChildren,
            expectedChildren,
            function (a, b) {
                return elementsMatch(a, b, equal, options);
            },
            function () {
                return false;
            });

        var arrayMatches = true;
        arrayDiffs.forEach(diffItem => {
            switch (diffItem.type) {
                case 'equal':
                    return;
                case 'remove':
                    if (options.exactly) {
                        arrayMatches = false;
                    }
                    break;
                default:
                    arrayMatches = false;
                    break;

            }
        });

        if (!arrayMatches) {
            return false;
        }
    }
    return true;

}

function compareElements(actual, expected, expect, options) {

    var result  = elementsMatch(actual, expected, expect.equal.bind(expect), options);
    if (!result) {
        return expect.fail('elements are not equal');
    }
    return;
}




function diffChildren(actual, expected, output, diff, inspect, equal, options) {
    if (typeof actual === 'string' && typeof expected === 'string') {
        var stringDiff = diff(actual.trim(), expected.trim());
        output.i().block(stringDiff.diff);
        return;
    }

    var actualChildren = [];
    React.Children.forEach(actual, child => actualChildren.push(child));
    var expectedChildren = [];
    React.Children.forEach(expected, child => expectedChildren.push(child));

    if (options && !options.exactly) {
        actualChildren = actualChildren.reduce(concatenateStringChildren, []);
        expectedChildren = expectedChildren.reduce(concatenateStringChildren, []);
    }

    var changes = ArrayChanges(actualChildren, expectedChildren,
        function (a, b) {
            return elementsMatch(a, b, equal, options);
        },

                function (a, b) {
                    // Figure out whether a and b are the same element so they can be diffed inline.
                    if (typeof a === 'string' && typeof b === 'string') {
                        return true;
                    }

                    return (
                        getElementName(a)  === getElementName(b)
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
                    this.block(function () { this.text(diffItem.value).sp().error('// should be removed') });
                } else {
                    this.block(inspect(diffItem.value).sp().error('// should be removed'));
                }
            } else if (type === 'equal') {
                if (typeof diffItem.value === 'string') {
                    this.block(function () {
                        this.text(diffItem.value)
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

function propsMatch(actual, expected, equal, options) {
    if (options && options.exactly) {
        return equal(actual, expected);
    }
    if (expected) {
        var matching = true;
        Object.keys(expected).forEach(key => {
            if (!equal(actual[key], expected[key])) {
                 matching = false;
            }
        });
        return matching;
    }
    return true;
}

function diffElements(actual, expected, output, diff, inspect, equal, options) {
    var result = {
        diff: output,
        inline: true
    };

    if (typeof actual === 'string' && typeof expected === 'string') {
        return diff(actual, expected);
    }
    var emptyElements = (!actual.props || React.Children.count(actual.props.children) === 0) &&
        (!expected.props || React.Children.count(expected.props.children) === 0);

    var propsMatching = propsMatch(getProps(actual), getProps(expected), equal, options);

    var conflictingElement = getElementName(actual) !== getElementName(expected) || !propsMatching;

    if (conflictingElement) {
        var canContinueLine = true;
        output
            .prismPunctuation('<')
            .prismTag(getElementName(actual));
        if (getElementName(actual) !== getElementName(expected)) {
            output.sp().annotationBlock(function () {
                this.error('should be').sp().prismTag(getElementName(expected));
            }).nl();
            canContinueLine = false;
        }
        var actualProps = getProps(actual);
        var expectedProps = getProps(expected);
        Object.keys(actualProps).forEach(function (propName) {
            output.sp(canContinueLine ? 1 : 2 + getElementName(actual).length);
            if (propName in expectedProps) {
                if (actualProps[propName] === expectedProps[propName]) {
                    writeProp(output, propName, actualProps[propName]);
                    canContinueLine = true;
                } else {
                    writeProp(output, propName, actualProps[propName], inspect);
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
                writeProp(output, propName, actualProps[propName]);
                output.sp().annotationBlock(function () {
                    this.error('should be removed');
                }).nl();
                canContinueLine = false;
            }
        });
        Object.keys(expectedProps).forEach(function (propName) {
            output.sp(canContinueLine ? 1 : 2 + getElementName(actual).length);
            output.annotationBlock(function () {
                this.error('missing').sp();
                writeProp(this, propName, expectedProps[propName]);
            }).nl();
            canContinueLine = false;
        });
        output.prismPunctuation('>');
    } else {
        output.prismPunctuation('<')
            .prismTag(getElementName(actual));
        writeProps(output, actual.props);
        output.prismPunctuation('>');
    }

    if (!emptyElements) {
        output.nl().indentLines();
        diffChildren(actual.props.children, expected.props.children, output, diff, inspect, equal, options);
        output.nl().outdentLines();
    }

    output.code('</' + getElementName(actual) + '>', 'html');
    return result;
}


module.exports = {
    name: 'unexpected-react-shallow',
    installInto: function (expect) {

        expect.installPlugin(require('magicpen-prism'));
        expect.addType({
            name: 'ReactShallowRenderer',
            base: 'object',
            identify(value) {
                return typeof value === 'object' &&
                    value !== null &&
                    typeof value.getRenderOutput === 'function';
            },

            inspect(value, depth, output, inspect) {
                output.append(inspect(value.getRenderOutput()));
            }
    });

        expect.addType({
            name: 'ReactElement',

            identify: function (value) {
                return React.isValidElement(value);
            },

            inspect: function (value, depth, output, inspect) {

                output
                    .prismPunctuation('<')
                    .prismTag(getElementName(value));

                writeProps(output, value.props);

                if (React.Children.count(value.props.children)) {
                    output.prismPunctuation('>');
                    output.nl().indentLines();

                    var children = [];
                    React.Children.forEach(value.props.children, child => children.push(child));
                    children = children.reduce(concatenateStringChildren, []);

                    children.forEach(child => {

                        if (typeof child === 'string') {
                            output.i().prismString(child).nl();
                        } else {
                            output.i().block(inspect(child)).nl();
                        }
                    });
                    output.outdentLines();
                    output.i()
                        .prismPunctuation('</').prismTag(getElementName(value)).prismPunctuation('>');

                } else {
                    output.prismPunctuation(' />')
                }
            },

            diff(actual, expected, output, diff, inspect, equal) {
                return diffElements(actual, expected, output, diff, inspect, equal);
            },
            equal(a, b, equal) {
                return elementsMatch(a, b, equal, { exactly: true });
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
            })
        });

        expect.addAssertion('ReactShallowRenderer', 'to have [exactly] rendered', function (expect, subject, renderOutput) {
                var actual = subject.getRenderOutput();
                return expect(actual, 'to have ' + (this.flags.exactly ? 'exactly ' : '') + 'rendered', renderOutput);
        });

    }
};
