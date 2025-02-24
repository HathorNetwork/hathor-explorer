const path = require('path');

/**
 * Configures `react-app-rewired` with the necessary changes to make the app work in the browser
 * environment. This is necessary since the upgrade to WebPack 5.
 * @param config
 * @returns {*}
 */
module.exports = function override(config) {
  // Resolves the modules that are missing in the browser environment
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    vm: require.resolve('vm-browserify'),
    url: require.resolve('url'),
    assert: require.resolve('assert'),
    process: require.resolve('process/browser'),
  };

  config.resolve.alias = {
    // Add an alias for our buffer shim
    'buffer-shim': path.resolve(__dirname, 'src/buffer-shim.js'),
  };

  // Relaxing js/mjs extension resolve
  config.module.rules.push({
    test: /\.m?js/, // Apply this rule to .js and .mjs files
    resolve: {
      fullySpecified: false, // Allow resolving modules without fully specifying the file extension
    },
  });

  // Solves process and buffer issues for WebPack
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
