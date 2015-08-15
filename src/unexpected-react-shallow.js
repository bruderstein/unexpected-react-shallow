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

function writeProp(output, propName, value) {

    output.prismAttrName(propName)
        .prismPunctuation('=');

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
                output.prismPunctuation('{').prismAttrValue('[object]').prismPunctuation('}');
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


function diffChildren(actual, expected, output, diff, inspect, equal) {
    if (typeof actual === 'string' && typeof expected === 'string') {
        var stringDiff = diff(actual, expected);
        output.i().block(stringDiff.diff);
        return;
    }

    var changes = ArrayChanges(Array.prototype.slice.call(actual), Array.prototype.slice.call(expected), equal, function (a, b) {
        // Figure out whether a and b are "struturally similar" so they can be diffed inline.
        return (
            getElementName(a)  === getElementName(b)
        );
    });

    changes.forEach(function (diffItem, index) {
        output.i().block(function () {
            var type = diffItem.type;
            if (type === 'insert') {
                this.annotationBlock(function () {
                    this.error('missing ').block(inspect(diffItem.value));
                });
            } else if (type === 'remove') {
                this.block(inspect(diffItem.value).sp().error('// should be removed'));
            } else if (type === 'equal') {
                this.block(inspect(diffItem.value));
            } else {
                var valueDiff = diff(diffItem.value, diffItem.expected);
                if (valueDiff && valueDiff.inline) {
                    this.block(valueDiff.diff);
                } else if (valueDiff) {
                    this.block(inspect(diffItem.value).sp()).annotationBlock(function () {
                        this.shouldEqualError(diffItem.expected, inspect).nl().append(valueDiff.diff);
                    });
                } else {
                    this.block(inspect(diffItem.value).sp()).annotationBlock(function () {
                        this.shouldEqualError(diffItem.expected, inspect);
                    });
                }
            }
        }).nl(index < changes.length - 1 ? 1 : 0);
    });
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
            },

            diff(actual, expected, output, diff, inspect, equal) {
                return diff(actual.getRenderOutput(), expected);
            }


    });

        expect.addType({
            name: 'ReactElement',

            identify: function (value) {
                return React.isValidElement(value);
            },

            inspect: function (value, depth, output, inspect) {

                output
                    .text('<')
                    .text(getElementName(value));

                if (value.props) {
                    Object.keys(value.props).forEach(function (prop) {
                        if (prop === 'children') {
                            return;
                        }

                        output.text(' ');
                        writeProp(output, prop, value.props[prop]);
                    });

                }

                if (React.Children.count(value.props.children)) {
                    output.text('>');
                    output.nl().indentLines();
                    React.Children.forEach(value.props.children, child => {

                        if (typeof child === 'string') {
                            output.i().text(child).nl();
                        } else {
                            output.i().block(inspect(child)).nl();
                        }
                    });
                    output.outdentLines();
                    output.i()
                        .text('</').text(getElementName(value)).text('>');

                } else {
                    output.text(' />')
                }
            },

            diff(actual, expected, output, diff, inspect, equal) {

                var result = {
                    diff: output,
                    inline: true
                };
                var emptyElements = (!actual.props || React.Children.count(actual.props.children) === 0) &&
                    (!expected.props || React.Children.count(expected.props.children) === 0);
                var conflictingElement = getElementName(actual) !== getElementName(expected) || !equal(getProps(actual), getProps(expected));

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
                        writeProp(output, propName, actualProps[propName]);
                        if (propName in expectedProps) {
                            if (actualProps[propName] === expectedProps[propName]) {
                                canContinueLine = true;
                            } else {
                                output.sp().annotationBlock(function () {
                                    this.error('should equal').sp().append(inspect(expectedProps[propName]));
                                }).nl();
                                canContinueLine = false;
                            }
                            delete expectedProps[propName];
                        } else {
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
                    output.code('<' + getElementName(actual) + '>', 'html');
                }

                if (!emptyElements) {
                    output.nl().indentLines();
                    diffChildren(actual.props.children, expected.props.children, output, diff, inspect, equal);
                    output.nl().outdentLines();
                }

                output.code('</' + getElementName(actual) + '>', 'html');
                return result;
            }
        });

        expect.addAssertion('ReactElement', 'to have rendered', function (expect, subject, renderOutput) {
            expect(subject, 'to equal', renderOutput);
        });

        expect.addAssertion('ReactShallowRenderer', 'to have rendered', function (expect, subject, renderOutput) {
            expect(subject.getRenderOutput(), 'to have rendered', renderOutput);
        });

    }
};
