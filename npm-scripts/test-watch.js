const path = require('path');
const karma = require('karma');
const chokidar = require('chokidar');

const server = new karma.Server({
  configFile: path.join(__dirname, 'lib', 'karma.conf.js'),
  // autoWatch: true,
  singleRun: false,
});
server.start();

chokidar.watch(path.resolve(__dirname, '..', '?(src|test)/**/*.js'), {
  ignoreInitial: true,
}).on('all', (event, filepath) => {
  console.log('CHANGED', filepath);
  server.refreshFiles();
});
