import React, { useState, useEffect, useRef } from 'react';

import clone from 'clone';
import jReact from '@mods/lib/jReact';
import { readImageUrl } from '@src/util/libs/mediaCache';

import IconButton from '../../atoms/button/IconButton';
import { twemojifyReact } from '../../../util/twemojify';
import navigation from '../../../client/state/navigation';
import Avatar from '../../atoms/avatar/Avatar';
import cons from '../../../client/state/cons';

import { colorMXID } from '../../../util/colorMXID';

import initMatrix from '../../../client/initMatrix';
import { tabText as settingTabText } from '../settings/Settings';
import { getPresence, getUserStatus } from '../../../util/onlineStatus';

import { openSettings } from '../../../client/action/navigation';
import tinyAPI from '../../../util/mods';
import { enableAfkSystem } from '../../../util/userStatusEffects';
import { getUserWeb3Account } from '../../../util/web3';
import { getSound } from '../../../client/state/Notifications';

import { getAppearance, getAnimatedImageUrl } from '../../../util/libs/appearance';
import { getUserColor, getUserIcon } from '../../../util/matrixUtil';

// Account Status
const accountStatus = { status: null, data: null };
export function getAccountStatus(where) {
  if (typeof where === 'string' && accountStatus.data) {
    if (where !== 'status') {
      return clone(accountStatus.status);
    }

    return clone(accountStatus.data[where]);
  }

  return null;
}

// Profile Avatar Menu
function ProfileAvatarMenu() {
  const [voiceChatEnabled] = useState(__ENV_APP__.ENABLE_VOICE_CHAT);

  // Data
  const mx = initMatrix.matrixClient;
  const voiceChat = initMatrix.voiceChat;

  const user = mx.getUser(mx.getUserId());
  const customStatusRef = useRef(null);
  const statusRef = useRef(null);

  const [microphoneMuted, setMicrophoneMuted] = useState(voiceChat.getMicrophoneMute());
  const [audioMuted, setAudioMuted] = useState(voiceChat.getAudioMute());

  // Get Display
  const [profile, setProfile] = useState({
    userId: user.userId,
    avatarUrl: null,
    displayName: user.displayName,
  });

  // Effect
  useEffect(() => {
    // Get User and update data
    const user2 = mx.getUser(mx.getUserId());

    const setNewProfile = (avatarUrl, displayName, userId) =>
      setProfile({
        avatarUrl: avatarUrl || null,
        displayName: displayName || profile.displayName,
        userId: userId || profile.userId,
      });

    // Set New User Status
    const onProfileUpdate = (event = {}) => {
      // Exist
      if (event) {
        // Clone Event
        const tinyEvent = event;
        const tinyClone = clone(event);

        // Afk Fix
        if (Array.isArray(tinyClone.active_devices) && tinyClone.active_devices.length < 1)
          tinyClone.status = '🟠';
        tinyClone.ethereum = getUserWeb3Account();
        if (typeof tinyClone.ethereum.valid !== 'undefined') delete tinyClone.ethereum.valid;

        // String Version
        const eventJSON = JSON.stringify(tinyClone);
        if (eventJSON.length > 0) {
          // Status Fix
          let presenceStatus = 'online';
          if (typeof tinyEvent.status === 'string') {
            tinyEvent.status = tinyEvent.status.trim();
            if (tinyEvent.status === '🔘') presenceStatus = 'offline';
          }

          // Set Presence
          mx.setPresence({
            presence: presenceStatus,
            status_msg: eventJSON,
          });
        }

        // Custom Status data
        if (
          customStatusRef &&
          customStatusRef.current &&
          ((typeof event.msg === 'string' && event.msg.length > 0) ||
            (typeof event.msgIcon === 'string' && event.msgIcon.length > 0))
        ) {
          // Get Presence
          const content = getPresence({ presenceStatusMsg: eventJSON });
          const htmlStatus = [];

          // Image HTML
          if (
            typeof content.presenceStatusMsg.msgIcon === 'string' &&
            content.presenceStatusMsg.msgIcon.length > 0
          ) {
            htmlStatus.push(
              $('<img>', {
                src: readImageUrl(content.presenceStatusMsg.msgIcon),
                alt: 'icon',
                class: 'emoji me-1',
              }),
            );
          }

          // Text HTML
          if (
            typeof content.presenceStatusMsg.msg === 'string' &&
            content.presenceStatusMsg.msg.length > 0
          ) {
            htmlStatus.push(
              jReact(
                <span className="text-truncate cs-text">
                  {twemojifyReact(content.presenceStatusMsg.msg.substring(0, 100))}
                </span>,
              ),
            );
          }

          // Insert Data
          $(customStatusRef.current).html(htmlStatus);
          accountStatus.data = content.presenceStatusMsg;
          accountStatus.status = event.status;
        }

        // Nope
        else {
          $(customStatusRef.current).html(jReact(twemojifyReact(user2.userId)));
          accountStatus.data = null;
          accountStatus.status = null;
        }

        // JSON Status
        if (
          statusRef &&
          statusRef.current &&
          typeof event.status === 'string' &&
          event.status.length > 0
        ) {
          const tinyUser = mx.getUser(mx.getUserId());
          tinyUser.presenceStatusMsg = JSON.stringify(event);
          statusRef.current.className = `user-status-icon ${getUserStatus(user2)}`;
        }
      }

      // Nope
      else {
        accountStatus.data = null;
        accountStatus.status = null;
      }

      // Status update
      tinyAPI.emit('userStatusUpdate', accountStatus);
      enableAfkSystem();
    };

    onProfileUpdate(mx.getAccountData('pony.house.profile')?.getContent() ?? {});

    const onAvatarChange = (event, myUser) => {
      setNewProfile(myUser.avatarUrl, myUser.displayName, myUser.userId);
    };

    mx.getProfileInfo(mx.getUserId()).then((info) => {
      setNewProfile(info.avatar_url, info.displayname, info.userId);
    });

    const playMuteSound = (muted) => {
      let sound;

      try {
        sound = getSound(muted ? 'micro_off' : 'micro_on');
      } catch {
        sound = null;
      }

      try {
        if (sound) {
          sound.pause();
          sound.currentTime = 0;
          sound.play();
        }
      } catch (err) {
        console.error(err);
      }
    };

    const updateAudioMute = (muted) => {
      playMuteSound(muted);
      setAudioMuted(muted);
    };
    const updateMicrophoneMute = (muted) => {
      playMuteSound(muted);
      setMicrophoneMuted(muted);
    };

    // Socket
    user2.on('User.avatarUrl', onAvatarChange);
    user2.on('User.displayName', onAvatarChange);
    navigation.on(cons.events.navigation.PROFILE_UPDATED, onProfileUpdate);
    voiceChat.on('pony_house_muted_audio', updateAudioMute);
    voiceChat.on('pony_house_muted_microphone', updateMicrophoneMute);
    return () => {
      user2.removeListener('User.avatarUrl', onAvatarChange);
      user2.removeListener('User.displayName', onAvatarChange);
      voiceChat.off('pony_house_muted_audio', updateAudioMute);
      voiceChat.off('pony_house_muted_microphone', updateMicrophoneMute);
      navigation.removeListener(cons.events.navigation.PROFILE_UPDATED, onProfileUpdate);
    };
  }, []);

  // User Presence
  const content = mx.getAccountData('pony.house.profile')?.getContent() ?? {};
  user.presence = 'online';
  user.presenceStatusMsg = JSON.stringify(content);
  const newStatus = `user-status-icon ${getUserStatus(user)}`;

  const appearanceSettings = getAppearance();

  // Complete
  return (
    <table className="table table-borderless align-middle m-0" id="user-menu">
      <tbody>
        <tr>
          <td className={`sidebar-photo p-0 ${!voiceChatEnabled ? 'w-100' : ''}`}>
            <button
              className={`btn btn-bg btn-link btn-sm ms-1 text-truncate text-start ${!voiceChatEnabled ? 'w-100' : ''}`}
              onClick={() => openSettings(settingTabText.PROFILE)}
              type="button"
            >
              <Avatar
                className="d-inline-block float-start profile-image-container"
                text={profile.displayName}
                bgColor={getUserColor(mx.getUserId())}
                size="normal"
                imageAnimSrc={
                  profile.avatarUrl !== null
                    ? !appearanceSettings.enableAnimParams
                      ? mx.mxcUrlToHttp(profile.avatarUrl)
                      : getAnimatedImageUrl(mx.mxcUrlToHttp(profile.avatarUrl, 42, 42, 'crop'))
                    : null
                }
                imageSrc={
                  profile.avatarUrl !== null
                    ? mx.mxcUrlToHttp(profile.avatarUrl, 42, 42, 'crop')
                    : null
                }
                isDefaultImage
              />
              <i ref={statusRef} className={newStatus} />
              <div className="very-small ps-2 text-truncate emoji-size-fix-2" id="display-name">
                {profile.displayName}
              </div>
              <div
                ref={customStatusRef}
                className="very-small ps-2 text-truncate emoji-size-fix-2 user-custom-status"
                id="user-presence"
              >
                {profile.userId}
              </div>
              <div className="very-small ps-2 text-truncate emoji-size-fix-2" id="user-id">
                {profile.userId}
              </div>
            </button>
          </td>

          {voiceChatEnabled && (
            <>
              <td className="p-0 pe-1 py-1 text-end">
                <IconButton
                  tooltip={<span>{microphoneMuted ? 'Unmute' : 'Mute'}</span>}
                  tooltipPlacement="top"
                  fa="fa-solid fa-microphone"
                  className={`action-button${microphoneMuted ? ' muted' : ''}`}
                  onClick={() => voiceChat.setMicrophoneMute(!microphoneMuted)}
                />
                {microphoneMuted ? <i className="fa-solid fa-microphone-slash" /> : null}
              </td>

              <td className="p-0 pe-1 py-1 text-end">
                <IconButton
                  tooltip={<span>{audioMuted ? 'Undeafen' : 'Deafen'}</span>}
                  tooltipPlacement="top"
                  fa="bi bi-headphones"
                  className={`action-button-2${audioMuted ? ' muted' : ''}`}
                  onClick={() => voiceChat.setAudioMute(!audioMuted)}
                />
                {audioMuted ? <i className="fa-solid fa-slash tiny-block-2" /> : null}
              </td>
            </>
          )}

          <td className="p-0 pe-1 py-1 text-end">
            <IconButton
              tooltip={<span>User Settings</span>}
              tooltipPlacement="top"
              fa="fa-solid fa-gear"
              className="action-button"
              onClick={openSettings}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/*
<i className="fa-solid fa-microphone"></i>
<i className="bi bi-headphones"></i>
<i className="bi bi-webcam-fill"></i>
<i className="fa-solid fa-desktop"></i>
<i className="bi bi-telephone-x-fill"></i>
*/
export default ProfileAvatarMenu;
