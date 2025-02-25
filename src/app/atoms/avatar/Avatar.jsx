import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

import blobUrlManager from '@src/util/libs/blobUrlManager';
import { twemojifyReact } from '../../../util/twemojify';

import Text from '../text/Text';
import RawIcon from '../system-icons/RawIcon';

import { avatarInitials } from '../../../util/common';
import { defaultAvatar, defaultProfileBanner, defaultSpaceBanner } from './defaultAvatar';
import Img from '../image/Image';

const defaultGetItems = {
  avatar: (colorCode) => defaultAvatar(colorCode),
  space: (colorCode) => defaultSpaceBanner(colorCode),
  profile: (colorCode) => defaultProfileBanner(colorCode),
};

export const avatarDefaultColor = (bgColor, type = 'avatar') => {
  // Colors
  let colorCode = Number(bgColor.substring(0, bgColor.length - 1).replace('var(--mx-uc-', ''));
  if (
    typeof colorCode !== 'number' ||
    Number.isNaN(colorCode) ||
    !Number.isFinite(colorCode) ||
    colorCode < 0
  ) {
    colorCode = 0;
  }

  // Default Avatar
  if (typeof defaultGetItems[type] === 'function') return defaultGetItems[type](colorCode);
  return null;
};

const Avatar = React.forwardRef(
  (
    {
      onClick = null,
      neonColor = false,
      text = null,
      bgColor = 'transparent',
      iconSrc = null,
      faSrc = null,
      iconColor = null,
      imageSrc = null,
      size = 'normal',
      className = '',
      imgClass = 'img-fluid',
      imageAnimSrc = null,
      isDefaultImage = false,
      animParentsCount = 3,
      theRef,
    },
    ref,
  ) => {
    const imgRef = ref || useRef(null);
    const [isLoading, setIsLoading] = useState(0);

    // Prepare Data
    let textSize = 's1';
    if (size === 'large') textSize = 'h1';
    if (size === 'small') textSize = 'b1';
    if (size === 'extra-small') textSize = 'b3';

    // Icons
    const tinyIcon = () =>
      faSrc !== null ? (
        <span
          style={{ backgroundColor: faSrc === null ? bgColor : 'transparent' }}
          className={`avatar__border${faSrc !== null ? '--active' : ''}`}
        >
          <RawIcon size={size} fa={faSrc} neonColor={neonColor} color={iconColor} />
        </span>
      ) : (
        <span
          style={{ backgroundColor: iconSrc === null ? bgColor : 'transparent' }}
          className={`avatar__border${iconSrc !== null ? '--active' : ''}`}
        >
          {iconSrc !== null ? (
            <RawIcon size={size} src={iconSrc} neonColor={neonColor} color={iconColor} />
          ) : (
            text !== null && (
              <Text variant={textSize} primary>
                {twemojifyReact(true, avatarInitials(text))}
              </Text>
            )
          )}
        </span>
      );

    // Render
    const isImage = imageSrc !== null || isDefaultImage;
    return (
      <div
        onClick={onClick}
        ref={imgRef}
        className={`avatar-container${`${className ? ` ${className}` : ''}`} noselect${isImage && isLoading < 2 ? '' : ' image-react-loaded'}`}
      >
        {isImage ? (
          <Img
            bgColor={bgColor}
            onLoadingChange={setIsLoading}
            getDefaultImage={avatarDefaultColor}
            isDefaultImage={isDefaultImage}
            ref={theRef}
            src={imageSrc}
            animSrc={imageAnimSrc}
            animParentsCount={animParentsCount + 1}
            className={`avatar-react${imgClass ? ` ${imgClass}` : ''}`}
            alt={text || 'avatar'}
          />
        ) : (
          tinyIcon()
        )}
      </div>
    );
  },
);

// Props
Avatar.propTypes = {
  neonColor: PropTypes.bool,
  animParentsCount: PropTypes.number,
  isDefaultImage: PropTypes.bool,
  imageAnimSrc: PropTypes.string,
  text: PropTypes.string,
  imgClass: PropTypes.string,
  bgColor: PropTypes.string,
  className: PropTypes.string,
  iconSrc: PropTypes.string,
  faSrc: PropTypes.string,
  iconColor: PropTypes.string,
  imageSrc: PropTypes.string,
  onClick: PropTypes.func,
  size: PropTypes.oneOf(['large', 'normal', 'small', 'extra-small']),
};

export default Avatar;
