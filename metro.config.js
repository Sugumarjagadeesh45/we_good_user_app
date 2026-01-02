const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
};

module.exports = mergeConfig(defaultConfig, config);


// const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// const config = {
//   transformer: {
//     babelTransformerPath: require.resolve('react-native-svg-transformer'),
//     getTransformOptions: async () => ({
//       transform: {
//         experimentalImportSupport: false,
//         inlineRequires: true,
//       },
//     }),
//   },
//   resolver: {
//     assetExts: getDefaultConfig(__dirname).resolver.assetExts.filter(
//       (ext) => ext !== 'svg'
//     ),
//     sourceExts: [...getDefaultConfig(__dirname).resolver.sourceExts, 'svg'],
//   },
// };

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);


