
exports.addTypeTo = function (expect) {
    expect.addType({
        name: 'ReactShallowRenderer',
        base: 'object',
        identify: function (value) {
            return typeof value === 'object' &&
                value !== null &&
                typeof value.getRenderOutput === 'function';
        },

        inspect: function (value, depth, output, inspect) {
            output.append(inspect(value.getRenderOutput()));
        }
    });
}

