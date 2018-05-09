module.exports = `const assert = require('chai').assert;
const expect = require('chai').expect;
const mock = require('pubnub-functions-mock');

const endpointRequestObject = {
  'body': '{}',
  'message': {},
  'method': null,
  'params': {},
};

const endpointResponseObject = {
  'headers': {},
  'status': 200,
  'send': function(body) {
    return new Promise((resolve) => {
      if (body === undefined) {
        body = '';
      }
      resolve({
        'body': body,
        'status': this.status,
      });
    });
  },
};

describe('#endpoint', () => {
  let endpoint;

  beforeEach(() => {
    endpoint = mock('__eventhandlerpath__');
  });

  it('creates endpoint event handler of type Function', function(done) {
    assert.isFunction(endpoint, 'was successfully created');
    done();
  });

  // // Add a new test!
  // it('returns "Hello World!"', (done) => {
  //   let request = Object.assign({}, endpointRequestObject);
  //   let response = Object.assign({}, endpointResponseObject);

  //   let correctResult = {
  //     "body": "hello!"
  //   };

  //   endpoint(request, response).then((testResult) => {
  //     assert.equal(testResult.body, correctResult.body, 'response body');
  //     done();
  //   });
  // });
});`