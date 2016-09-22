var sinon = require('sinon');
var assert = require('assert');

var networking = require('./../src/networking.js');

describe('#networking', function () {
  var networkingInstance;
  var requestStub;

  beforeEach(function () {
    networkingInstance = networking({ debug: true });
    requestStub = sinon.stub(networkingInstance, 'request').callsArg(3);
  });

  describe('#getApps', function () {
    it('executes call if all params are covered', function (done) {
      networkingInstance.getApps({ ownerId: 'owner1' }, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'get');
        assert.deepEqual(requestStub.args[0][1], ['api', 'apps']);
        assert.deepEqual(requestStub.args[0][2], { qs: { owner_id: 'owner1' } });
        done();
      });
    });

    it('fails if ownerId is not provided', function (done) {
      networkingInstance.getApps({}, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing ownerId');
        done();
      });
    });
  });

  describe('#updateBlock', function () {
    it('executes call if all params are covered', function (done) {
      networkingInstance.updateBlock({ keyId: 'key1', blockId: 'block1', blockPayload: { hello: 1 } }, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'put');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block', 'block1']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 } });
        done();
      });
    });

    it('fails if keyId is not provided', function (done) {
      networkingInstance.updateBlock({ blockId: 'block1', blockPayload: { hello: 1 } }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockId is not provided', function (done) {
      networkingInstance.updateBlock({ keyId: 'key1', blockPayload: { hello: 1 } }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockId');
        done();
      });
    });

    it('fails if blockPayload is not provided', function (done) {
      networkingInstance.updateBlock({ keyId: 'key1', blockId: 'block1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockPayload');
        done();
      });
    });
  });

  describe('#createBlock', function () {
    it('executes call if all params are covered', function (done) {
      networkingInstance.createBlock({ keyId: 'key1', blockPayload: { hello: 1 } }, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 } });
        done();
      });
    });

    it('fails if keyId is not provided', function (done) {
      networkingInstance.createBlock({ blockPayload: { hello: 1 } }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockPayload is not provided', function (done) {
      networkingInstance.createBlock({ keyId: 'key1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockPayload');
        done();
      });
    });
  });

  describe('#getBlocks', function () {
    it('executes call if all params are covered', function (done) {
      networkingInstance.getBlocks({ keyId: 'key1' }, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'get');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block']);
        assert.deepEqual(requestStub.args[0][2], {});
        done();
      });
    });

    it('fails if keyId is not provided', function (done) {
      networkingInstance.getBlocks({}, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });
  });

  describe('#startBlock', function () {
    it('executes call if all params are covered', function (done) {
      networkingInstance.startBlock({ keyId: 'key1', blockId: 'block1' }, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block', 'block1', 'start']);
        assert.deepEqual(requestStub.args[0][2], {});
        done();
      });
    });

    it('fails if keyId is not provided', function (done) {
      networkingInstance.startBlock({ blockId: 'block1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockId is not provided', function (done) {
      networkingInstance.startBlock({ keyId: 'key1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockId');
        done();
      });
    });
  });

  describe('#stopBlock', function () {
    it('executes call if all params are covered', function (done) {
      networkingInstance.stopBlock({ keyId: 'key1', blockId: 'block1' }, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'block', 'block1', 'stop']);
        assert.deepEqual(requestStub.args[0][2], {});
        done();
      });
    });

    it('fails if keyId is not provided', function (done) {
      networkingInstance.stopBlock({ blockId: 'block1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if blockId is not provided', function (done) {
      networkingInstance.stopBlock({ keyId: 'key1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing blockId');
        done();
      });
    });
  });

  describe('#createEventHandler', function () {
    it('executes call if all params are covered', function (done) {
      var callingParams = { keyId: 'key1', eventHandlerId: 'eh1', eventHandlerPayload: { hello: 1 } };
      networkingInstance.createEventHandler(callingParams, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'post');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'event_handler']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 } });
        done();
      });
    });

    it('fails if keyId is not provided', function (done) {
      var callingParams = { eventHandlerPayload: { hello: 1 } };
      networkingInstance.createEventHandler(callingParams, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if eventHandlerPayload is not provided', function (done) {
      networkingInstance.createEventHandler({ keyId: 'key1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing eventHandlerPayload');
        done();
      });
    });
  });

  describe('#updateEventHandler', function () {
    it('executes call if all params are covered', function (done) {
      var callingParams = { keyId: 'key1', eventHandlerId: 'eh1', eventHandlerPayload: { hello: 1 } };
      networkingInstance.updateEventHandler(callingParams, function () {
        assert.equal(requestStub.called, 1);
        assert.deepEqual(requestStub.args[0][0], 'put');
        assert.deepEqual(requestStub.args[0][1], ['api', 'v1', 'blocks', 'key', 'key1', 'event_handler', 'eh1']);
        assert.deepEqual(requestStub.args[0][2], { form: { hello: 1 } });
        done();
      });
    });

    it('fails if keyId is not provided', function (done) {
      var callingParams = { eventHandlerId: 'block1', eventHandlerPayload: { hello: 1 } };
      networkingInstance.updateEventHandler(callingParams, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing keyId');
        done();
      });
    });

    it('fails if eventHandlerId is not provided', function (done) {
      networkingInstance.updateEventHandler({ keyId: 'key1', eventHandlerPayload: { hello: 1 } }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing eventHandlerId');
        done();
      });
    });

    it('fails if eventHandlerPayload is not provided', function (done) {
      networkingInstance.updateEventHandler({ keyId: 'key1', eventHandlerId: 'block1' }, function (err) {
        assert.equal(requestStub.called, 0);
        assert.equal(err, 'missing eventHandlerPayload');
        done();
      });
    });
  });

});
