var Element = require('./element');
var Equality = require('./equality');

exports.findElementIn = function findElementIn(haystack, needle, expect, options) {

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
};
