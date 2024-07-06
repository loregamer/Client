import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { twemojifyReact } from '../../../util/twemojify';

import { blurOnBubbling } from '../../atoms/button/script';

import Text from '../../atoms/text/Text';
import Avatar from '../../atoms/avatar/Avatar';
import { getUserStatus, updateUserStatusIcon, getPresence } from '../../../util/onlineStatus';
import initMatrix from '../../../client/initMatrix';
import insertCustomStatus from './insertCustomStatus';
import { getAnimatedImageUrl, getAppearance } from '../../../util/libs/appearance';
import { getCustomAvatar, getCustomUserSetting } from '../../../util/libs/customUserSettings';

function PeopleSelector({
  avatarSrc = null,
  avatarAnimSrc = null,
  name,
  color,
  peopleRole = null,
  onClick,
  user = null,
  disableStatus = false,
  avatarSize = 32,
  contextMenu,
}) {
  const statusRef = useRef(null);
  const customStatusRef = useRef(null);

  const [imageAnimSrc, setImageAnimSrc] = useState(avatarAnimSrc);
  const [imageSrc, setImageSrc] = useState(avatarSrc || (user ? getCustomAvatar(user.userId) : null));

  const getCustomStatus = (content) => {
    insertCustomStatus(customStatusRef, content);
  };

  if (user) {
    getCustomStatus(getPresence(user));
  }

  useEffect(() => {
    if (user) {
      const mx = initMatrix.matrixClient;

      const updateProfileStatus = (mEvent, tinyData) => {
        const appearanceSettings = getAppearance();
        const status = $(statusRef.current);
        const tinyUser = tinyData;

        const newImageSrc =
          tinyUser && tinyUser.avatarUrl
            ? mx.mxcUrlToHttp(tinyUser.avatarUrl, avatarSize, avatarSize, 'crop')
            : getCustomAvatar(user.userId) || null;
        setImageSrc(newImageSrc);

        const newImageAnimSrc =
          tinyUser && tinyUser.avatarUrl
            ? !appearanceSettings.enableAnimParams
              ? mx.mxcUrlToHttp(tinyUser.avatarUrl)
              : getAnimatedImageUrl(
                mx.mxcUrlToHttp(tinyUser.avatarUrl, avatarSize, avatarSize, 'crop'),
              )
            : null;
        setImageAnimSrc(newImageAnimSrc);

        getCustomStatus(updateUserStatusIcon(status, tinyUser));
      };

      user.on('User.avatarUrl', updateProfileStatus);
      user.on('User.currentlyActive', updateProfileStatus);
      user.on('User.lastPresenceTs', updateProfileStatus);
      user.on('User.presence', updateProfileStatus);
      return () => {
        user.removeListener('User.currentlyActive', updateProfileStatus);
        user.removeListener('User.lastPresenceTs', updateProfileStatus);
        user.removeListener('User.presence', updateProfileStatus);
        user.removeListener('User.avatarUrl', updateProfileStatus);
      };
    }
  }, [user]);

  return (
    <button
      className="people-selector"
      onMouseUp={(e) => blurOnBubbling(e, '.people-selector')}
      onClick={onClick}
      onContextMenu={contextMenu}
      type="button"
    >
      <Avatar
        className="profile-image-container"
        imageAnimSrc={imageAnimSrc}
        imageSrc={imageSrc}
        text={name}
        bgColor={color}
        size="small"
        isDefaultImage
      />
      {!disableStatus ? (
        <i ref={statusRef} className={`user-status-icon ${getUserStatus(user)}`} />
      ) : (
        ''
      )}

      <div className="small people-selector__name text-start">
        <span className="emoji-size-fix">{twemojifyReact(name)}</span>
        <div
          ref={customStatusRef}
          className="very-small text-gray text-truncate emoji-size-fix-2 user-custom-status"
        />
      </div>

      {peopleRole !== null && (
        <Text className="people-selector__role" variant="b3">
          {peopleRole}
        </Text>
      )}
    </button>
  );
}

PeopleSelector.propTypes = {
  avatarSize: PropTypes.number,
  disableStatus: PropTypes.bool,
  user: PropTypes.object,
  avatarAnimSrc: PropTypes.string,
  avatarSrc: PropTypes.string,
  name: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  peopleRole: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

export default PeopleSelector;
