
import fs from 'fs';
import os from 'os';

const sinon = require('sinon');
const assert = require('assert');


const SessionComponent = require('../../lib/components/session.js');

describe('#components/session', () => {
  let sessionComponentInstance;
  let loggingInterface;
  let networkingInstance;
  let sandbox;

  beforeEach(() => {
    loggingInterface = {
      error: sinon.stub(),
      debug: sinon.stub(),
      info: sinon.stub()
    };
    networkingInstance = null; // TODO
    sandbox = sinon.sandbox.create();
    sandbox.stub(os, 'homedir', () => { return './homeFolder'; });

    sessionComponentInstance = new SessionComponent({ networking: networkingInstance, logger: loggingInterface });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#deleteSession', () => {
    it('deletes the session file', (done) => {
      sandbox.stub(fs, 'unlink', (path, callback) => { callback(null, 'hello'); });
      sessionComponentInstance._deleteSessonFile().then(() => {
        assert.equal(fs.unlink.called, 1);
        assert.deepEqual(fs.unlink.args[0][0], './homeFolder/.pubnub-cli');
        done();
      });
    });

    it('does not crash if the file does not exist', (done) => {
      sandbox.stub(fs, 'unlink', (path, callback) => { callback({ code: 'ENOENT' }, null); });
      sessionComponentInstance._deleteSessonFile().then(() => {
        assert.equal(fs.unlink.called, 1);
        assert.deepEqual(fs.unlink.args[0][0], './homeFolder/.pubnub-cli');
        done();
      });
    });
  });

  describe('#_createSessionFile', () => {
    it('returns the contents of the session file', (done) => {
      const deleteSessionSpy = sandbox.spy(sessionComponentInstance, '_deleteSessonFile');
      sandbox.stub(fs, 'unlink', (path, callback) => { callback(null, 'hello'); });
      sandbox.stub(fs, 'writeFile', (path, contents, callback) => { callback(null); });
      sessionComponentInstance._createSessionFile({ sessionToken: 'st', userId: 'uid' }).then(() => {
        assert.equal(deleteSessionSpy.called, 1);
        assert.equal(fs.writeFile.called, 1);
        assert.equal(fs.writeFile.args[0][0], './homeFolder/.pubnub-cli');
        assert.equal(fs.writeFile.args[0][1], '{"sessionToken":"st","userId":"uid"}');
        done();
      });
    });
  });

  describe('#_fetchSessionFile', () => {
    it('returns the contents of the session file', (done) => {
      sandbox.stub(fs, 'readFile', (path, encdoing, callback) => { callback(null, '{"sessionToken":"st","userId":"uid"}'); });
      sessionComponentInstance._fetchSessionFile().then((session) => {
        assert.deepEqual(session, { sessionToken: 'st', userId: 'uid' });
        assert.equal(fs.readFile.called, 1);
        assert.deepEqual(fs.readFile.args[0][0], './homeFolder/.pubnub-cli');
        done();
      });
    });

    it('returns empty if session file does not exist', (done) => {
      sandbox.stub(fs, 'readFile', (path, encdoing, callback) => { callback('OMG', null); });
      sessionComponentInstance._fetchSessionFile().then((sessionId) => {
        assert.deepEqual(sessionId, {});
        assert.equal(fs.readFile.called, 1);
        assert.deepEqual(fs.readFile.args[0][0], './homeFolder/.pubnub-cli');
        done();
      });
    });
  });
});
