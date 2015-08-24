
var internals = {};

exports.writeProps = internals.writeProps = function writeProps(output, props) {

    if (props) {
        Object.keys(props).forEach(function (prop) {
            if (prop === 'children') {
                return;
            }
            output.text(' ');
            internals.writeProp(output, prop, props[prop]);
        });
    }
};

exports.writeProp = internals.writeProp = function writeProp(output, propName, value, inspect) {

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
            output.prismPunctuation('{').prismAttrValue(' function(){...} ').prismPunctuation('}');
            break;
    }
};
