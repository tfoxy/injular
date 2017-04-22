const path = require('path');
const babel = require('rollup-plugin-babel');

const babelConf = require('./.babelrc.json');

module.exports = (config) => {
  config.set({
    basePath: path.resolve(__dirname, '..', '..'),
    browsers: ['PhantomJS'],
    frameworks: ['mocha'],
    files: [
      'node_modules/chai/chai.js',
      'node_modules/angular/angular.js',
      '?(src|test)/**/*.js',
    ],
    logLevel: config.LOG_INFO,
    plugins: [
      'karma-mocha',
      'karma-rollup-plugin',
      'karma-phantomjs-launcher',
    ],
    preprocessors: {
      '?(src|test)/**/*.js': ['rollup'],
    },
    rollupPreprocessor: {
      external: [
        'chai',
        'angular',
      ],
      format: 'iife',
      globals: {
        chai: 'chai',
        angular: 'angular',
      },
      moduleName: 'injular',
      sourceMap: 'inline',
      plugins: [
        babel(babelConf),
      ],
    },
  });
};
