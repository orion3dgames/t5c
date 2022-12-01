const path = require("path");
const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const CopyPlugin = require("copy-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
                { from: "public/", to: "./" },
            ],
        }),
        //new BundleAnalyzerPlugin()
    ],
    mode: "development"
};