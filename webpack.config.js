'use strict'

const path = require('path')

const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
    mode: isDev ? 'development' : 'production',
    devtool: 'cheap-module-eval-source-map',
    entry: {
        app: './src/main.js'
    },
    context: path.resolve(__dirname),
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'prod.js',
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
            },
            {
                test: /\.(txt)$/,
                use: 'raw-loader',
            },
        ]
    },
    resolve: {
        extensions: ['.mjs', '.js', '.vue', '.json', '.wasm'],
        alias: {
            vue$: 'vue/dist/vue.esm.js'
        }
    },
    plugins: [
        // ...(isDev ? [new webpack.HotModuleReplacementPlugin()] : []),
        new CaseSensitivePathsPlugin(),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            filename: 'style2.min.css'
        })
    ],
    optimization: {
        minimizer: [
            // new TerserJSPlugin(),
            // new OptimizeCSSAssetsPlugin()
        ]
    },
    devServer: {
        open: false,
        hot: true,
        port: 8080,
        compress: true,
        historyApiFallback: false,
        proxy: {
            '/': {
                target: 'http://localhost:3001',
                changeOrigin: true
            }
        }
    }
}
