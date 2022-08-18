const path = require('path');

const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LicensePlugin = require('webpack-license-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  // mode: 'development',
  target: ['web', 'es5'],
  entry: {
    main: './src/index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /\/node_modules\//,
          name: 'vendor',
        },
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /\/node_modules\/(?!no-darkreader)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          }
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.geojson$/,
        type: 'asset/resource',
        use: ['./src/geobuf-loader.js'],
        generator: {
          filename: '[contenthash].pbf',
        },
      },
    ]
  },
  plugins: [
    new LicensePlugin({
      licenseOverrides: {
        'leaflet.pattern@0.1.0': 'BSD-2-Clause',
      },
      // additionalFiles: {'licenses.html': undefined},
    }),
    new HtmlWebpackPlugin({
      meta: [{name: 'no-darkreader', content: 'NO-DARKREADER-PLUGIN'}],
      template: 'src/index.html',
    }),
    new MiniCssExtractPlugin(),
    new webpack.BannerPlugin({
      banner: 'For license information, see oss-licenses.json',
      include: 'vendor',
    }),
  ],
};
