const path = require("path");
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/app.ts"),
    output: {
        //name for the js file that is created/compiled in memory
        filename: 'js/hanabiBundle.js',
        clean: true, // Clean the output directory before emit.
    },
    resolve: {
        // extensions: [".ts"]
        extensions: [".tsx", ".ts", ".js"]
    },
    devServer: {
        host: '0.0.0.0',
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 8080,
    },
    module: {
        rules: [
            // {test: /\.tsx?$/,
            // loader: "ts-loader"}
            {
              test: /\.tsx?$/,
              use: "ts-loader",
              exclude: /node_modules/
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, "public/index.html")
        }),
    ],
    mode: "development"
};