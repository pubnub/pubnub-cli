const sinon = require('sinon');
const assert = require('assert');

var fs = require('fs'),
    path = require('path');

var dirString = path.dirname(fs.realpathSync(__filename));

// output example: "/Users/jb/workspace/abtest"
console.log('directory to start walking...', dirString);

const Networking = require('../lib/networking.js');

describe('#networking', () => {
  let networkingInstance;
  let requestStub;

  beforeEach(() => {
    networkingInstance = new Networking({ debug: true });
    requestStub = sinon.stub(networkingInstance, 'request').callsArg(3);
  });

  describe('#getApps', () => {
    it('executes call if all params are covered', (done) => {
      networkingInstance.getApps({ ownerId: 'owner1', sessionToken: 'token1' }, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'get');
        assert.deepEqual(requestStub.args[0][1], ['api', 'apps']);
        assert.deepEqual(requestStub.args[0][2], { qs: { owner_id: 'owner1' }, headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      networkingInstance.getApps({ ownerId: 'owner1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if ownerId is not provided', (done) => {
      networkingInstance.getApps({ sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing ownerId');
        done();
      });
    });
  });

  describe('#updateBlock', () => {
    it('executes call if all params are covered', (done) => {
      networkingInstance.updateBlock({ keyId: 'key1', blockId: 'block1', blockPayload: { hello: 1 }, sessionToken: 'token1' }, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'put');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block', 'block1']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 }, headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      networkingInstance.updateBlock({ keyId: 'key1', blockId: 'block1', blockPayload: { hello: 1 } }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if keyId is not provided', (done) => {
      networkingInstance.updateBlock({ blockId: 'block1', blockPayload: { hello: 1 }, sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockId is not provided', (done) => {
      networkingInstance.updateBlock({ keyId: 'key1', blockPayload: { hello: 1 }, sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockId');
        done();
      });
    });

    it('fails if blockPayload is not provided', (done) => {
      networkingInstance.updateBlock({ keyId: 'key1', blockId: 'block1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockPayload');
        done();
      });
    });
  });

  describe('#createBlock', () => {
    it('executes call if all params are covered', (done) => {
      networkingInstance.createBlock({ keyId: 'key1', blockPayload: { hello: 1 }, sessionToken: 'token1' }, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 }, headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      networkingInstance.createBlock({ keyId: 'key1', blockPayload: { hello: 1 } }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if keyId is not provided', (done) => {
      networkingInstance.createBlock({ blockPayload: { hello: 1 }, sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockPayload is not provided', (done) => {
      networkingInstance.createBlock({ keyId: 'key1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockPayload');
        done();
      });
    });
  });

  describe('#getBlocks', () => {
    it('executes call if all params are covered', (done) => {
      networkingInstance.getBlocks({ keyId: 'key1', sessionToken: 'token1' }, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'get');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block']);
        assert.deepEqual(requestStub.args[0][2], { headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      networkingInstance.getBlocks({ keyId: 'key1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if keyId is not provided', (done) => {
      networkingInstance.getBlocks({ sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });
  });

  describe('#startBlock', () => {
    it('executes call if all params are covered', (done) => {
      networkingInstance.startBlock({ keyId: 'key1', blockId: 'block1', sessionToken: 'token1' }, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block', 'block1', 'start']);
        assert.deepEqual(requestStub.args[0][2], { headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      networkingInstance.startBlock({ keyId: 'key1', blockId: 'block1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if keyId is not provided', (done) => {
      networkingInstance.startBlock({ blockId: 'block1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockId is not provided', (done) => {
      networkingInstance.startBlock({ keyId: 'key1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockId');
        done();
      });
    });
  });

  describe('#stopBlock', () => {
    it('executes call if all params are covered', (done) => {
      networkingInstance.stopBlock({ keyId: 'key1', blockId: 'block1', sessionToken: 'token1' }, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block', 'block1', 'stop']);
        assert.deepEqual(requestStub.args[0][2], { headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      networkingInstance.stopBlock({ keyId: 'key1', blockId: 'block1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if keyId is not provided', (done) => {
      networkingInstance.stopBlock({ blockId: 'block1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockId is not provided', (done) => {
      networkingInstance.stopBlock({ keyId: 'key1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockId');
        done();
      });
    });
  });

  describe('#createEventHandler', () => {
    it('executes call if all params are covered', (done) => {
      const callingParams = { keyId: 'key1', eventHandlerId: 'eh1', eventHandlerPayload: { hello: 1 }, sessionToken: 'token1' };
      networkingInstance.createEventHandler(callingParams, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'event_handler']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 }, headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      const callingParams = { keyId: 'key1', eventHandlerId: 'eh1', eventHandlerPayload: { hello: 1 } };
      networkingInstance.createEventHandler(callingParams, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if keyId is not provided', (done) => {
      const callingParams = { eventHandlerPayload: { hello: 1 }, sessionToken: 'token1' };
      networkingInstance.createEventHandler(callingParams, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if eventHandlerPayload is not provided', (done) => {
      networkingInstance.createEventHandler({ keyId: 'key1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing eventHandlerPayload');
        done();
      });
    });
  });

  describe('#updateEventHandler', () => {
    it('executes call if all params are covered', (done) => {
      const callingParams = { keyId: 'key1', eventHandlerId: 'eh1', eventHandlerPayload: { hello: 1 }, sessionToken: 'token1' };
      networkingInstance.updateEventHandler(callingParams, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'put');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'event_handler', 'eh1']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 }, headers: { 'X-Session-Token': 'token1' } });
        done();
      });
    });

    it('fails if token is not provided', (done) => {
      const callingParams = { keyId: 'key1', eventHandlerId: 'eh1', eventHandlerPayload: { hello: 1 } };
      networkingInstance.updateEventHandler(callingParams, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing sessionToken');
        done();
      });
    });

    it('fails if keyId is not provided', (done) => {
      const callingParams = { eventHandlerId: 'block1', eventHandlerPayload: { hello: 1 }, sessionToken: 'token1' };
      networkingInstance.updateEventHandler(callingParams, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if eventHandlerId is not provided', (done) => {
      networkingInstance.updateEventHandler({ keyId: 'key1', eventHandlerPayload: { hello: 1 }, sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing eventHandlerId');
        done();
      });
    });

    it('fails if eventHandlerPayload is not provided', (done) => {
      networkingInstance.updateEventHandler({ keyId: 'key1', eventHandlerId: 'block1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing eventHandlerPayload');
        done();
      });
    });
  });

  describe('#createLoginToken', () => {
    it('executes call if all params are covered', (done) => {
      const callingParams = { email: 'spam@gmail.com', password: 'pwd1', sessionToken: 'token1' };
      networkingInstance.createLoginToken(callingParams, () => {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'me']);
        assert.deepEqual(requestStub.args[0][2], { form: { email: 'spam@gmail.com', password: 'pwd1' } });
        done();
      });
    });

    it('fails if password is not provided', (done) => {
      const callingParams = { email: 'spam@gmail.com', sessionToken: 'token1' };
      networkingInstance.createLoginToken(callingParams, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing password');
        done();
      });
    });

    it('fails if email is not provided', (done) => {
      networkingInstance.createLoginToken({ password: 'pwd1', sessionToken: 'token1' }, (err) => {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing email');
        done();
      });
    });
  });
});
