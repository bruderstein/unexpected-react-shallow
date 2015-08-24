var React = require('react');

function isSimpleType(value) {
    var type = typeof value;
    return type === 'string' ||
        type === 'number' ||
        type === 'boolean' ||
        type === 'undefined' ||
        value === null;
}

function convertValueTypeToString(value) {
    if (value === null || value === undefined) {
        return '';
    }

    return '' + value;
}

function concatenateStringChildren(accum, value) {
    if (isSimpleType(value) && accum.length &&
        isSimpleType(accum[accum.length - 1]))
    {
        accum[accum.length - 1] = convertValueTypeToString(accum[accum.length - 1]) + convertValueTypeToString(value);
        return accum;
    }
    accum.push(value);
    return accum;
}


exports.getName = function getName(element) {

    if (typeof element.type === 'string') {
        return element.type;
    }

    return element.type.displayName || element.type.name || 'no-display-name';
};

exports.getProps = function getProps(element) {

    var realProps = {};
    if (element.props) {
        for(var key in element.props) {
            if (key !== 'children') {
                realProps[key] = element.props[key];
            }
        }
    }
    return realProps;
};

exports.getChildrenArray = function getChildrenArray(children, options) {

    var childrenArray = [];
    React.Children.forEach(children, function (child) { childrenArray.push(child); });
    if (options.normalize) {
        return childrenArray.reduce(concatenateStringChildren, []);
    }
    return childrenArray;
};
