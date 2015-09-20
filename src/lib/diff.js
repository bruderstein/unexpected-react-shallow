var React = require('react');
var ArrayChanges = require('array-changes');
var Element = require('./element');
var Equality = require('./equality');
var Write = require('./write');

var internals = {};

internals.isNativeType = function (element) {
    var type = typeof element;
    return type === 'string' || type === 'number' || type === 'undefined';
};

internals.diffChildren = function diffChildren(actual, expected, output, diff, inspect, equal, options) {
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
            var aIsNativeType = internals.isNativeType(a);
            var bIsNativeType = internals.isNativeType(b);
            if (aIsNativeType && bIsNativeType) {
                return true;
            }

            if (aIsNativeType !== bIsNativeType) {
                return false;
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
                    var actualInspectBlock = inspect(diffItem.value);
                    this.block(actualInspectBlock).sp().annotationBlock(function () {
                        this.error('should be removed');
                        this.nl(actualInspectBlock.size().height - 1);
                    });
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
                var valueDiff = internals.diffElements(diffItem.value, diffItem.expected, output.clone(), diff, inspect, equal, options);

                if (valueDiff) {
                    this.block(valueDiff.diff);
                }
            }
        }).nl(index < changes.length - 1 ? 1 : 0);
    });
};

exports.diffElements = internals.diffElements =
    function diffElements(actual, expected, output, diff, inspect, equal, options) {
    var result = {
        diff: output,
        inline: true
    };
    var actualIsNative =     internals.isNativeType(actual);
    var expectedIsNative = internals.isNativeType(expected);
    if (actualIsNative && expectedIsNative) {
        return diff('' + actual, '' + expected);
    }

    var stringVsComponentMismatch = actualIsNative !== expectedIsNative;
    var emptyElements = !stringVsComponentMismatch && (!actual.props || React.Children.count(actual.props.children) === 0) &&
        (!expected.props || React.Children.count(expected.props.children) === 0);

    var propsMatching = !stringVsComponentMismatch && Equality.propsMatch(Element.getProps(actual), Element.getProps(expected), equal, options);

        var conflictingElement = stringVsComponentMismatch ||
            Element.getName(actual) !== Element.getName(expected) ||
            !propsMatching;

        if (stringVsComponentMismatch) {

            if (actualIsNative) {
                output.append('' + actual)
                    .sp()
                    .annotationBlock(function () {
                        this.error('should be').sp().block(inspect(expected));
                    });
            } else if (expectedIsNative) {

                var actualOutput = inspect(actual);
                output.block(actualOutput)
                    .annotationBlock(function () {
                        this.nl(actualOutput.size().height - 1);
                        this.error('should be').sp().append(inspect(expected));
                    });
            }

        } else if (conflictingElement) {
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

        if (!stringVsComponentMismatch && !emptyElements) {
            output.nl().indentLines();
            internals.diffChildren(actual.props.children, expected.props.children, output, diff, inspect, equal, options);
            output.nl().outdentLines();
        }

        if (!stringVsComponentMismatch) {
            output.code('</' + Element.getName(actual) + '>', 'html');
        }
        return result;
    };
