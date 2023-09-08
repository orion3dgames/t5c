const isLocal = function () {
    return window.location.host === "localhost:8080";
};

const apiUrl = function (port) {
    let url = "https://" + window.location.hostname;
    if (isLocal()) {
        url = "http://localhost:" + port;
    }
    return url;
};

export { isLocal, apiUrl };
