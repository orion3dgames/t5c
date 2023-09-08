const path = require("path");
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

module.exports = merge(common, {
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        host: "localhost",
        static: {
            directory: path.join(__dirname, "public"),
        },
        watchFiles: ["src/**/*.ts", "public/**/*"],
        liveReload: true,
        port: 8080,
    },
});
