const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer.minifierPath = "metro-minify-terser";

config.resolver = {
  sourceExts: ["jsx", "js", "ts", "tsx", "cjs"],
  extraNodeModules: {
    stream: require.resolve("readable-stream"),
  },
};

module.exports = config;
