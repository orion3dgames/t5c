const path = require("path");
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: path.resolve(appDirectory, "src/client/index.ts"),
    devtool: "source-map",
    output: {
        //name for the js file that is created/compiled in memory
        filename: 'js/bundle.js',
        clean: true, // Clean the output directory before emit.
        path: path.resolve(__dirname, 'dist/client'),
    },
    resolve: {
        // extensions: [".ts"]
        extensions: [".tsx", ".ts", ".js"]
    },
    devServer: {
        host: '0.0.0.0',
        static: {
            directory: path.join(__dirname, 'src/client/Public'),
        },
        watchFiles: ['src/**/*.ts', 'src/client/Public/**/*'],
        liveReload: true,
        port: 8080,
    },
    module: {
        rules: [
            // {test: /\.tsx?$/,
            // loader: "ts-loader"}
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader",
                    options: {
                        //sourceMap: true,
                    }
                }
            }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "src/client/Public/", to: "./" },
            ],
        }),
    ],
    mode: "development"
};