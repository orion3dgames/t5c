// get walking directions from central park to the empire state building
var http = require("http");
export default function node_http(url: string) {
    return new Promise<any>((resolve, reject) => {
        // get is a simple wrapper for request()
        // which sets the http method to GET
        var request = http.get(url, function (response) {
            // data is streamed in chunks from the server
            // so we have to handle the "data" event
            var buffer = "",
                data,
                route;

            response.on("data", function (chunk) {
                buffer += chunk;
            });

            response.on("end", function (err) {
                // finished transferring data
                // dump the raw data
                data = JSON.parse(buffer);
                resolve(data);
            });
        });
    });
}
