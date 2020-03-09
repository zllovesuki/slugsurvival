// 'use strict'

const path = require('path')

const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
    mode: isDev ? 'development' : 'production',
    devtool: 'cheap-module-eval-source-map',
    entry: {
        app: './src/main.js'
    },
    context: path.resolve(__dirname),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
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
                    'vue-style-loader',
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
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new CaseSensitivePathsPlugin(),
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            title: "SlugSurvival",
            template: "./src/static/index.html"
        }),
    ],
    devServer: {
        open: false,
        hot: true,
        port: 8080,
        compress: true,
        historyApiFallback: true,
        proxy: {
            changeOrigin: true,
            '/graphql': {
                target: 'http://localhost:3000'
            },
            '/api': {
                target: 'http://localhost:3000'
            }
        }
    }
}
