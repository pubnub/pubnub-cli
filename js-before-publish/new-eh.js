function process(request) {
    var console = require("console");

    try {
        // Add extra awesome here...

        return request;
    }
    catch (e) {
        console.error("Uncaught exception:", e);

        // Add extra error handling here...
    }
}