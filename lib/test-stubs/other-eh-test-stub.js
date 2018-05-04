const assert = require('chai').assert;
const expect = require('chai').expect;
const mock = require('pubnub-functions-mock');

const requestObject = {
  'method': 'publish',
  'meta': {},
  'params': {},
  'uri': '',
  'channels': [],
  'callback': '0',
  'message': {}
};

describe('#eventhandler', () => {
  let eventhandler;

  beforeEach(() => {
    eventhandler = mock('');
  });

  it('creates event handler of type Function', function(done) {
    assert.isFunction(eventhandler, 'was successfully created');
    done();
  });
});