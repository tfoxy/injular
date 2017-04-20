const path = require('path');
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');

const babelConf = require('./lib/.babelrc.json');

rollup.rollup({
  entry: path.resolve(__dirname, '..', 'src', 'injular.js'),
  plugins: [
    babel(babelConf),
  ],
}).then(bundle => bundle.write({
  format: 'umd',
  moduleName: 'injular',
  sourceMap: 'inline',
  dest: path.resolve(__dirname, '..', 'dist', 'injular.js'),
})).catch((err) => {
  process.stderr.write(`${String(err)}\n`, () => {
    process.exit(1);
  });
});
