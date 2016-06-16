'use strict';
var webpack  = require('webpack');

module.exports = {
    entry: [
        './public/scripts/app.jsx',
    ],
    devtool: 'source-map',
    output: {
        filename: './public/scripts/dist/bundle.js'
    },
    module: {
        loaders: [
            {
                //tell webpack to use jsx-loader for all *.js files
                test: /\.jsx$/,
                loader: 'jsx-loader?insertPragma=React.DOM&harmony'
            },
            { test: /\.css$/, loader: "style-loader!css-loader" }
        ]
    },
    externals: {
        'React': 'React',
        'ReactDOM': 'ReactDOM',
        '$': 'jquery'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    plugins: [
         new webpack.optimize.UglifyJsPlugin({
             minimze: true,
             mangle: {
                 except: ['$super', '$', 'exports', 'require']
             }
         })
    ]
};
