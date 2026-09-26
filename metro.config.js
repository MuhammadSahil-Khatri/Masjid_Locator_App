const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure all font extensions (both lowercase and uppercase) are treated as assets
config.resolver.assetExts.push('otf', 'OTF', 'ttf', 'TTF');

module.exports = config;
