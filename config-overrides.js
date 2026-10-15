const path = require('path');
const stdLib = require('node-stdlib-browser');

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
    crypto: stdLib.crypto,
    stream: stdLib.stream,
    path: stdLib.path,
    vm: stdLib.vm,
    url: stdLib.url,
    assert: stdLib.assert,
    process: stdLib.process,
    zlib: stdLib.zlib,
  };

  config.resolve.alias = {
    // Add an alias for our buffer shim
    'buffer-shim': path.resolve(__dirname, 'src/buffer-shim.js'),
  };

  // Relaxing js/mjs extension resolve
  config.module.rules.push(
    {
      test: /\.m?js/, // Apply this rule to .js and .mjs files
      resolve: {
        fullySpecified: false, // Allow resolving modules without fully specifying the file extension
      },
    },
    {
      test: /\.cjs/, // Apply this rule to .cjs files
      type: 'javascript/auto',
    }
  );

  // Solves process and buffer issues for WebPack
  const webpack = require('webpack');
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer-shim', 'default'],
    }),
  ];

  // Add Babel configuration
  config.module.rules.push({
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
      },
    },
  });

  return config;
};
