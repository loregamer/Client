/* eslint-disable class-methods-use-this */
// Example --> https://github.com/matrix-org/matrix-js-sdk/blob/develop/examples/voip/browserTest.js
// https://matrix-org.github.io/matrix-js-sdk/stable/classes/MatrixCall.html
import { createNewMatrixCall } from 'matrix-js-sdk';
import { EventEmitter } from 'events';
import { eventMaxListeners } from '../matrixUtil';

// Emitter
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
myEmitter.setMaxListeners(eventMaxListeners);

// Class
class MatrixVoiceChat {
  // Constructor
  constructor(mx) {
    // Prepare Class
    this.mx = mx;
    this.enabled = __ENV_APP__.ENABLE_VOICE_CHAT;

    if (!this.enabled) {
      console.log('Voice chat is disabled');
      return;
    }

    this.call = null;
    this.roomId = null;
    this.started = false;

    this.callId = null;
    this.direction = null;
    this.groupCallId = null;
    this.hangupParty = null;
    this.hangupReason = null;
    this.invitee = null;
    this.isPtt = null;
    this.ourPartyId = null;
    this.peerConn = null;
    this.toDeviceSeq = null;
    this.err = null;

    const tinyThis = this;

    // Incoming...
    this.mx.on('Call.incoming', (c) => {
      console.log('Call ringing', c);

      /*
            disableButtons(true, false, false);
            document.getElementById("result").innerHTML = "<p>Incoming call...</p>";
            call = c;
            addListeners(call);
            */

      if (!tinyThis.call) {
        // tinyThis.call = c;
      } else {
        // c.reject();
      }

      myEmitter.emit('incoming', c);
    });
  }

  supportsVoip() {
    return this.mx.supportsVoip();
  }

  existsCall() {
    return typeof this.call !== 'undefined';
  }

  /* Audio */
  getAudioMute() {
    return global.localStorage.getItem('pony-house-muted-audio') === 'true';
  }

  getMicrophoneMute() {
    return global.localStorage.getItem('pony-house-muted-microphone') === 'true';
  }

  setAudioMute(value) {
    if (typeof value === 'boolean') {
      myEmitter.emit('pony_house_muted_audio', value);
      return global.localStorage.setItem(
        'pony-house-muted-audio',
        value === true ? 'true' : 'false',
      );
    }
    return null;
  }

  setMicrophoneMute(value) {
    if (typeof value === 'boolean') {
      myEmitter.emit('pony_house_muted_microphone', value);
      return global.localStorage.setItem(
        'pony-house-muted-microphone',
        value === true ? 'true' : 'false',
      );
    }
    return null;
  }

  // Create Call
  create(roomId) {
    if (this.mx.supportsVoip()) {
      this.stop();

      this.roomId = roomId;
      this.call = createNewMatrixCall(this.mx, roomId);
      this.call.setMaxListeners(eventMaxListeners);
      myEmitter.emit('state', 'call_created');

      this.start();

      return this.call;
    }
    return null;
  }

  stop() {
    if (this.existsCall()) this.call.reject();

    this.roomId = null;

    this.err = null;

    this.callId = null;
    this.direction = null;
    this.groupCallId = null;
    this.hangupParty = null;
    this.hangupReason = null;
    this.invitee = null;
    this.isPtt = null;
    this.ourPartyId = null;
    this.peerConn = null;
    this.toDeviceSeq = null;
    this.started = false;

    myEmitter.emit('state', 'call_stopped');
    return true;
  }

  // Start Call
  start() {
    if (this.mx.supportsVoip() && this.call && !this.started) {
      const tinyThis = this;
      this.started = true;

      /*
            function disableButtons(place, answer, hangup) {
                document.getElementById("hangup").disabled = hangup;
                document.getElementById("answer").disabled = answer;
                document.getElementById("call").disabled = place;
            }
            */

      this.call.on('hangup', (data) => {
        console.error('Call hangup', data);

        /*
                disableButtons(false, true, true);
                document.getElementById('result').innerHTML = '<p>Call ended. Last error: ' + tinyThis.err + '</p>';
                */

        myEmitter.emit('hangup', tinyThis.err, data);
      });

      this.call.on('error', (err) => {
        console.error('Call Error', err);

        tinyThis.err = err;
        /*
                call.hangup();
                disableButtons(false, true, true);
                */

        myEmitter.emit('error', err);
      });

      this.call.on('feeds_changed', (feeds) => {
        const localFeed = feeds.find((feed) => feed.isLocal());
        const remoteFeed = feeds.find((feed) => !feed.isLocal());

        console.log('Call feeds_changed', localFeed, remoteFeed, feeds);

        /*
                const remoteElement = document.getElementById('remote');
                const localElement = document.getElementById('local');
        
                if (remoteFeed) {
                    remoteElement.srcObject = remoteFeed.stream;
                    remoteElement.play();
                }
                if (localFeed) {
                    localElement.muted = true;
                    localElement.srcObject = localFeed.stream;
                    localElement.play();
                }
                */

        myEmitter.emit('feeds_changed', feeds);
      });

      this.call.on('hold_unhold', (data) => {
        console.log('Call hold_unhold', data);
        myEmitter.emit('hold_unhold', data);
      });

      this.call.on('length_changed', (data) => {
        console.log('Call length_changed', data);
        myEmitter.emit('length_changed', data);
      });

      this.call.on('peer_connection_created', (data) => {
        console.log('Call peer_connection_created', data);
        myEmitter.emit('peer_connection_created', data);
      });

      this.call.on('remote_hold_unhold', (data) => {
        console.log('Call remote_hold_unhold', data);
        myEmitter.emit('remote_hold_unhold', data);
      });

      this.call.on('replaced', (data) => {
        console.log('Call replaced', data);
        myEmitter.emit('replaced', data);
      });

      this.call.on('send_voip_event', (data) => {
        console.log('Call send_voip_event', data);
        myEmitter.emit('send_voip_event', data);
      });

      // https://matrix-org.github.io/matrix-js-sdk/stable/enums/_internal_.CallState.html
      this.call.on('state', (state) => {
        console.log('Call state', state);
        myEmitter.emit('state', state);

        /*
                    connected
                    connecting
                    create_answer
                    create_offer
                    ended
                    fledgling
                    invite_sent
                    ringing
                    wait_local_media
                */
      });

      myEmitter.emit('state', 'call_started');
      return true;
    }
    return null;
  }

  // Call
  getCall() {
    return this.call;
  }

  placeCall(audio = false, video = false) {
    if (this.existsCall()) {
      // Stop other call
      this.call.reject();

      // Insert Call
      return this.call.placeCall(audio, video);
    }
    return null;
  }

  // Get
  getCurrentCallStats() {
    if (this.existsCall()) return this.call.isLocalOnHold();
    return null;
  }

  getFeeds() {
    if (this.existsCall()) return this.call.getFeeds();
    return null;
  }

  getLocalFeeds() {
    if (this.existsCall()) return this.call.getLocalFeeds();
    return null;
  }

  getOpponentDeviceId() {
    if (this.existsCall()) return this.call.getOpponentDeviceId();
    return null;
  }

  getOpponentMember() {
    if (this.existsCall()) return this.call.getOpponentMember();
    return null;
  }

  getOpponentSessionId() {
    if (this.existsCall()) return this.call.getOpponentSessionId();
    return null;
  }

  getRemoteAssertedIdentity() {
    if (this.existsCall()) return this.call.getRemoteAssertedIdentity();
    return null;
  }

  getRemoteFeeds() {
    if (this.existsCall()) return this.call.getRemoteFeeds();
    return null;
  }

  isLocalOnHold() {
    if (this.existsCall()) return this.call.isLocalOnHold();
    return null;
  }

  isLocalVideoMuted() {
    if (this.existsCall()) return this.call.isLocalVideoMuted();
    return null;
  }

  isMicrophoneMuted() {
    if (this.existsCall()) return this.call.isMicrophoneMuted();
    return null;
  }

  isRemoteOnHold() {
    if (this.existsCall()) return this.call.isRemoteOnHold();
    return null;
  }

  isScreensharing() {
    if (this.existsCall()) return this.call.isScreensharing();
    return null;
  }

  opponentCanBeTransferred() {
    if (this.existsCall()) return this.call.opponentCanBeTransferred();
    return null;
  }

  opponentSupportsDTMF() {
    if (this.existsCall()) return this.call.opponentSupportsDTMF();
    return null;
  }

  opponentSupportsSDPStreamMetadata() {
    if (this.existsCall()) return this.call.opponentSupportsSDPStreamMetadata();
    return null;
  }

  // Has
  hasLocalUserMediaAudioTrack() {
    if (this.existsCall()) return this.call.hasLocalUserMediaAudioTrack();
    return null;
  }

  hasLocalUserMediaVideoTrack() {
    if (this.existsCall()) return this.call.hasLocalUserMediaVideoTrack();
    return null;
  }

  hasPeerConnection() {
    if (this.existsCall()) return this.call.hasPeerConnection();
    return null;
  }

  hasRemoteUserMediaAudioTrack() {
    if (this.existsCall()) return this.call.hasRemoteUserMediaAudioTrack();
    return null;
  }

  hasRemoteUserMediaVideoTrack() {
    if (this.existsCall()) return this.call.hasRemoteUserMediaVideoTrack();
    return null;
  }

  // More Get
  callHasEnded() {
    if (this.existsCall()) return this.call.callHasEnded();
    return null;
  }

  localScreensharingFeed() {
    if (this.existsCall()) return this.call.localScreensharingFeed();
    return null;
  }

  localScreensharingStream() {
    if (this.existsCall()) return this.call.localScreensharingStream();
    return null;
  }

  localUsermediaFeed() {
    if (this.existsCall()) return this.call.localUsermediaFeed();
    return null;
  }

  localUsermediaStream() {
    if (this.existsCall()) return this.call.localUsermediaStream();
    return null;
  }

  remoteScreensharingFeed() {
    if (this.existsCall()) return this.call.remoteScreensharingFeed();
    return null;
  }

  remoteScreensharingStream() {
    if (this.existsCall()) return this.call.remoteScreensharingStream();
    return null;
  }

  remoteUsermediaFeed() {
    if (this.existsCall()) return this.call.remoteUsermediaFeed();
    return null;
  }

  remoteUsermediaStream() {
    if (this.existsCall()) return this.call.remoteUsermediaStream();
    return null;
  }

  state() {
    if (this.existsCall()) return this.call.state();
    return null;
  }

  type() {
    if (this.existsCall()) return this.call.type();
    return null;
  }

  // Set
  setLocalVideoMuted(muted) {
    if (this.existsCall()) return this.call.setLocalVideoMuted(muted);
    return null;
  }

  setMicrophoneMuted(muted) {
    if (this.existsCall()) return this.call.setMicrophoneMuted(muted);
    return null;
  }

  setRemoteOnHold(onHold) {
    if (this.existsCall()) return this.call.setRemoteOnHold(onHold);
    return null;
  }

  setScreensharingEnabled(enabled, opts) {
    if (this.existsCall()) return this.call.setScreensharingEnabled(enabled, opts);
    return null;
  }

  sendDtmfDigit(digit) {
    if (this.existsCall()) return this.call.sendDtmfDigit(digit);
    return null;
  }

  sendMetadataUpdate() {
    if (this.existsCall()) return this.call.sendMetadataUpdate();
    return null;
  }

  // Replace
  replacedBy(newCall) {
    if (this.existsCall()) return this.call.replacedBy(newCall);
    return null;
  }

  // Transfer
  transfer(targetUserId) {
    if (this.existsCall()) return this.call.transfer(targetUserId);
    return null;
  }

  transferToCall(transferTargetCall) {
    if (this.existsCall()) return this.call.transferToCall(transferTargetCall);
    return null;
  }

  // Update Stream
  updateLocalUsermediaStream(stream, forceAudio, forceVideo) {
    if (this.existsCall())
      return this.call.updateLocalUsermediaStream(stream, forceAudio, forceVideo);
    return null;
  }

  // Reject a call This used to be done by calling hangup, but is a separate method and protocol event as of MSC2746.
  reject() {
    if (this.existsCall()) return this.call.reject();
    return null;
  }

  answer(audio, video) {
    if (this.existsCall()) return this.call.answer(audio, video);
    return null;
  }

  answerWithCallFeeds(callFeeds) {
    if (this.existsCall()) return this.call.answerWithCallFeeds(callFeeds);
    return null;
  }

  // Data Channel
  createDataChannel(label, options) {
    if (this.existsCall()) return this.call.createDataChannel(label, options);
    return null;
  }

  // Call Time
  hangup(reason, suppressEvent) {
    if (this.existsCall()) return this.call.hangup(reason, suppressEvent);
    return null;
  }

  initStats(stats, peerId) {
    if (this.existsCall()) return this.call.initStats(stats, peerId);
    return null;
  }

  initWithHangup(event) {
    if (this.existsCall()) return this.call.initWithHangup(event);
    return null;
  }

  initWithInvite(event) {
    if (this.existsCall()) return this.call.initWithInvite(event);
    return null;
  }

  // Emit
  emit(event, args) {
    if (this.existsCall()) return this.call.emit(event, args);
    return null;
  }

  emitPromised(event, args) {
    if (this.existsCall()) return this.call.emitPromised(event, args);
    return null;
  }

  // Events
  on(event, callback) {
    return myEmitter.on(event, callback);
  }

  off(event, callback) {
    return myEmitter.off(event, callback);
  }

  once(event, callback) {
    return myEmitter.once(event, callback);
  }
}

/*
    document.getElementById("call").onclick = function () {
        console.log("Placing call...");
        call = matrixcs.createNewMatrixCall(client, ROOM_ID);
        console.log("Call => %s", call);
        addListeners(call);
        call.placeVideoCall();
        document.getElementById("result").innerHTML = "<p>Placed call.</p>";
        disableButtons(true, true, false);
    };

    document.getElementById("hangup").onclick = function () {
        console.log("Hanging up call...");
        console.log("Call => %s", call);
        call.hangup();
        document.getElementById("result").innerHTML = "<p>Hungup call.</p>";
    };

    document.getElementById("answer").onclick = function () {
        console.log("Answering call...");
        console.log("Call => %s", call);
        call.answer();
        disableButtons(true, true, false);
        document.getElementById("result").innerHTML = "<p>Answered call.</p>";
    };
*/

// Base
export default MatrixVoiceChat;
