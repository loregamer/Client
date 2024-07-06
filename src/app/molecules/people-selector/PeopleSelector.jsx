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
import { getUserColor } from '../../../util/matrixUtil'; // Import the getUserColor function

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

  const usernameColor = user ? getUserColor(user.userId) : color;

  return (
    <button
      type="button"
      className="people-selector"
      onClick={onClick}
      onContextMenu={contextMenu}
    >
      <Avatar
        imgClass="profile-image-container"
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

      <div className="small people-selector__name text-start" style={{ color: usernameColor }}>
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
