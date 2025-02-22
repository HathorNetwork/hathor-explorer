const path = require('path');
module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    vm: require.resolve('vm-browserify'),
    url: require.resolve('url'),
    assert: require.resolve('assert'),
  };

  config.resolve.alias = {
    // Add an alias for our buffer shim
    'buffer-shim': path.resolve(__dirname, 'src/buffer-shim.js'),
  };

  const webpack = require('webpack');
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer-shim', 'default'],
    }),
  ];

  return config;
};
