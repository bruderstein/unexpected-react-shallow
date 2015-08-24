var React = require('react/addons');
var ArrayChanges = require('array-changes');

var Element = require('./lib/element');
var Write = require('./lib/write');
var Equality = require('./lib/equality');
var Diff = require('./lib/diff');
var ReactElement = require('./lib/ReactElement');
var ReactShallowRenderer = require('./lib/ReactShallowRenderer');
var Assertions = require('./lib/assertions');


module.exports = {

    name: 'unexpected-react-shallow',

    installInto: function (expect) {

        expect.installPlugin(require('magicpen-prism'));

        ReactShallowRenderer.addTypeTo(expect);

        ReactElement.addTypeTo(expect);

        Assertions.addAssertionsTo(expect);
    }
};
