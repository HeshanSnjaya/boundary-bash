const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  ...config.resolver.alias,
  'victory-native': 'victory-native',
};

config.transformer.unstable_allowRequireContext = true;

module.exports = config;
