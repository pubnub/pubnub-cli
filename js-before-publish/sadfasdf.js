// updated
export default (request) => {
    const kvstore = require('kvstore');
    const xhr = require('xhr');

    console.log('request',request); // Log the request envelope passed
    return request.ok(); // Return a promise when you're done
}
