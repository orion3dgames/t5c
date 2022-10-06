const path = require("path");
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: path.resolve(appDirectory, "src/app.ts"),
    output: {
        //name for the js file that is created/compiled in memory
        filename: 'js/bundle.js',
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
        watchFiles: ['src/**/*.ts', 'public/**/*'],
        liveReload: true,
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
        new CopyPlugin({
            patterns: [
                { from: "public", to: "./" },
            ],
        }),
    ],
    mode: "development"
};