var babel = require('babel');

module.exports = function (wallaby) {
   return {
       files: ['src/**/*.js'],
       tests: ['tests/**/*.js'],
       env: {
           type: 'node',
           runner: 'node',

       },
       preprocessors: {
           'src/**/*.js': file => babel.transform(file.content, { sourceMap:true, stage: 0 }),
           'tests/**/*.js': file => babel.transform(file.content, { sourceMap:true, stage: 0 })
       },
       debug: true,
       workers: {
           initial: 1,
           regular: 1,
           recycle: false
       }
   };
};