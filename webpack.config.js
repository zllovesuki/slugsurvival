'use strict'

const path = require('path')

const webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development'

var plugins = [
    new CaseSensitivePathsPlugin(),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
        filename: 'style2.min.css'
    })
]

if (isDev) {
    plugins.push(new webpack.HotModuleReplacementPlugin())
}

module.exports = {
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'cheap-module-eval-source-map' : '',
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
    optimization: isDev ? {} : {
        minimizer: [
            new OptimizeCSSAssetsPlugin()
        ]
    },
    devServer: {
        open: false,
        hot: true,
        port: 8080,
        compress: true,
        // we don't need historyApiFallback because app.js has
        // it: (app.use('/*', ...))
        historyApiFallback: false,
        proxy: {
            '/': {
                target: 'http://localhost:3001',
                pathRewrite: { '^/fonts': '/public/fonts' }
                // bypass: function(req, res, proxyOptions) {
                //     console.log(req.url)

                //     // if (req.url === '/public/style2.min.css' || req.url === '/public/prod.js') {
                //     //     console.log(proxyOptions)
                //     //     return 'http://localhost:8080' + req.url
                //     // }
                // }
            }
        }
    }
}
