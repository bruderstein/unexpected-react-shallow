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
