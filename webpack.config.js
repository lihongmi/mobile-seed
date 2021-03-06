'use strict';

process.env.NODE_ENV = 'development';

var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var AssetsPlugin = require('assets-webpack-plugin');
var StatsPlugin = require('stats-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

//------------------入口配置---------------------/
var entry = {
  // 'entryA': './src/scripts/entryA.js'
  // ,
    'index': './src/scripts/index.js'
}
//---------------------------------------------/
var jsxLoaders = ['babel'];
var cssLoader;
var scssLoader;

var port = process.env.PORT || 3000;
var devtool;
var output;
var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
  ];

if (process.env.NODE_ENV === 'development') {//开发配置
  devtool ='eval';
  jsxLoaders = ['react-hot'].concat(jsxLoaders);
  cssLoader = 'style!css';
  scssLoader = 'style!css!sass';
  output = {
    path: path.join(__dirname,"/build"),
    filename: '[id]_[name]_[hash:8].js',
    chunkFilename: '[id]_[hash:8].chunk.js',
    publicPath: '/'
  }

  plugins = plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new AssetsPlugin(),
    new StatsPlugin('stats.json', {
      chunkModules: true,
      exclude: [/node_modules[\\\/]react/]
    })
  ]);
  entry = Object.keys(entry).reduce(function (result, key) {
    result[key] = [
      'webpack-dev-server/client?http://0.0.0.0:' + port,
      'webpack/hot/only-dev-server',
      entry[key]
    ];
    return result;
  }, {});
} else {//生产配置
  devtool ='source-map';
  cssLoader = ExtractTextPlugin.extract('style', 'css?minimize'); // enable minimize
  scssLoader = ExtractTextPlugin.extract('style!css?minimize!sass');
  output = {
    path: path.join(__dirname,"/assets"),
    filename: 'scripts/[id]_[name]_[hash:8].min.js',
    chunkFilename: 'scripts/[id]_[hash:8].chunk.min.js',
    publicPath: '/'
  }
  plugins = plugins.concat([
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }),
    new ExtractTextPlugin('styles/[id]_[name]_[hash:8].min.css', {
        allChunks: false
    })
  ]);
}

var pages = fs.readdirSync("src/views/");
pages.forEach(function(filename) {
    var m = filename.match(/(.+)\.html$/);
    if(m) {
        var conf = {
            template: path.resolve("src/views/", filename),
            filename: filename
        };
        
        if(m[1] in entry) {
            conf.inject = 'body';
            conf.chunks = ['vendors', m[1]];
        }

        plugins.push(new HtmlWebpackPlugin(conf));
    }
});

module.exports = {
  entry: entry,
  output: output,
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /assets|build|lib|bower_components|node_modules/,
        loaders: jsxLoaders
      },
      {
          test: /\.css$/,
          loader: cssLoader
      },
      {
        test: /\.scss$/,
        loader: scssLoader
      },
      {
          test: /\.(jpe?g|png|gif|svg)$/i,
          loaders: [
              'image?{bypassOnDebug: true, progressive:true, \
                  optimizationLevel: 3, pngquant:{quality: "65-80", speed: 4}}',
              'url?limit=10000&name=images/[hash:8].[name].[ext]',
          ]
      },
      {
          test: /\.(woff|eot|ttf)$/i,
          loader: 'url?limit=10000&name=fonts/[hash:8].[name].[ext]'
      }
    ],
    // preLoaders: [
    //   {test: /\.jsx?$/, loader: 'eslint', include: /src/},
    // ],
    noParse: [
      path.join(__dirname, 'node_modules', 'babel-core', 'browser.min.js')
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  plugins: plugins,
  devtool: devtool
  // ,eslint: {configFile: '.eslintrc'}
}
