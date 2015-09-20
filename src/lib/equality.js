var React = require('react');
var ArrayChanges = require('array-changes');
var Element = require('./element');


var internals = {};

exports.propsMatch = internals.propsMatch = function propsMatch(actual, expected, equal, options) {
    if (options && options.exactly) {
        return equal(actual, expected);
    }
    var matching = true;
    Object.keys(expected).forEach(function (key) {
        if (!equal(actual[key], expected[key])) {
            matching = false;
        }
    });
    return matching;
};

exports.elementsMatch = internals.elementsMatch = function elementsMatch(actual, expected, equal, options) {

    if (typeof actual === 'string' && typeof expected === 'string') {
        return actual === expected;
    }

    if ((typeof actual === 'string' || typeof actual === 'number') &&
        (typeof expected === 'string' || typeof expected === 'number')) {
        return '' + actual === '' + expected;
    }

    if (typeof actual !== typeof expected) { // Fundamentally different e.g. string vs ReactElement
        return false;
    }

    if (Element.getName(actual) !== Element.getName(expected)) {
        return false;
    }

    if (!internals.propsMatch(Element.getProps(actual), Element.getProps(expected), equal, options)) {
        return false;
    }

    // For 'exactly', we can just check the count of the actual children matches,
    // string children will not be concatenated in this mode, and serves to also check
    // the case that the expected does not have children, but the actual does (ignored when exactly=false)
    if (options.exactly && React.Children.count(expected.props.children) !== React.Children.count(actual.props.children)) {
        return false;
    }

    if (React.Children.count(expected.props.children)) {
        if (React.Children.count(actual.props.children) === 0) {
            return false;
        }

        var shouldNormalize = !options.exactly;
        var actualChildren = Element.getChildrenArray(actual.props.children, {
            normalize: shouldNormalize
        });
        var expectedChildren = Element.getChildrenArray(expected.props.children, {
            normalize: shouldNormalize
        });

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
        arrayDiffs.forEach(function (diffItem) {
            switch (diffItem.type) {
                case 'equal':
                    return;
                case 'remove':
                    if (options.exactly || options.withAllChildren) {
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

};


exports.assertElementsMatch = function assertElementsMatch(actual, expected, expect, options) {

    var result  = internals.elementsMatch(actual, expected, expect.equal.bind(expect), options);
    if (!result) {
        return expect.fail('elements are not equal');
    }
};

