module.exports = function override(config) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    vm: require.resolve('vm-browserify'),
    url: require.resolve('url'),
  };
  return config;
};
