'use strict';
var webpack  = require('webpack');

module.exports = {
    entry: [
        './public/scripts/app.jsx',
        // './public/scripts/layout.jsx',
        // './public/scripts/music.jsx',
        // './public/scripts/note.jsx'
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
            }
        ]
    },
    externals: {
        'React': 'React',
        'ReactDOM': 'ReactDOM',
        // 'react-router':'react-router',
        '$': 'jquery'
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    }
    // plugins: [
    //     new webpack.optimize.UglifyJsPlugin({
    //         minimze: true,
    //         mangle: {
    //             except: ['$super', '$', 'exports', 'require']
    //         }
    //     })
    // ]
};
