'use strict'

var path = require('path')
var fs = require('fs');

var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin');
var VueLoaderPlugin = require('vue-loader/lib/plugin')
var MiniCssExtractPlugin = require('mini-css-extract-plugin')
var CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

var isDev = process.env.NODE_ENV === 'development'

var plugins = [
    new CaseSensitivePathsPlugin(),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
        filename: 'public/style2.min.css'
    }),
    new HtmlWebpackPlugin({
        template: './src/static/index.html'
    })
]

if (isDev) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
}

if (!isDev) {
    plugins.push(new OptimizeCSSAssetsPlugin())
}

module.exports = {
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'cheap-module-eval-source-map' : '',
    entry: {
        app: './src/main.js'
    },
    context: path.resolve(__dirname),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'public/prod.js',
        publicPath: '/'
    },
    module: {
        noParse: /^(vue|vue-router|vuex|vuex-router-sync)$/,
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.css$/,
                use: [
                    isDev ? 'vue-style-loader' : MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.mjs', '.js', '.vue', '.json', '.wasm'],
        alias: {
            vue$: 'vue/dist/vue.esm.js'
        }
    },
    plugins: plugins,
    devServer: {
        open: false,
        hot: true,
        port: 8080,
        compress: true,
        historyApiFallback: true,
        proxy: {
            "/public": {
                target: "http://localhost:3001",
            },
            // i don't know what seems to be requesting `/fonts`,
            // but it now redirects to `/public/fonts`
            "/fonts": {
                target: "http://localhost:3001",
                pathRewrite: { '^/fonts': '/public/fonts' }
            }
        }
    }
}
