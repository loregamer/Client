import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import initMatrix from '../../../../client/initMatrix';
import { colorMXID } from '../../../../util/colorMXID';
import { moveSpaceShortcut } from '../../../../client/action/accountData';
import SpaceOptions from '../../../molecules/space-options/SpaceOptions';
import RoomOptions from '../../../molecules/room-options/RoomOptions';

import SidebarAvatar from '../../../molecules/sidebar-avatar/SidebarAvatar';
import Avatar from '../../../atoms/avatar/Avatar';
import NotificationBadge from '../../../atoms/badge/NotificationBadge';

import { selectTab, openReusableContextMenu, selectRoom, selectRoomMode } from '../../../../client/action/navigation';

import { useSelectedTab } from '../../../hooks/useSelectedTab';
import { abbreviateNumber, getEventCords } from '../../../../util/common';
import cons from '../../../../client/state/cons';

import { notificationClasses, useNotificationUpdate } from './Notification';
import { getAppearance, getAnimatedImageUrl } from '../../../../util/libs/appearance';
import { usePinnedItems } from '../../shortcut-spaces/ShortcutSpaces';
import { guessDMRoomTargetId } from '@src/client/action/room';
import { getCustomAvatar } from '@src/util/libs/customUserSettings';

// Draggable Space Shortcut
function DraggableSpaceShortcut({ isActive, spaceId, isSpace, index, moveShortcut, onDrop }) {
  const mx = initMatrix.matrixClient;
  const { notifications } = initMatrix;
  const room = mx.getRoom(spaceId);
  const shortcutRef = useRef(null);
  const avatarRef = useRef(null);
  const appearanceSettings = getAppearance();

  const [imgSrc, setImgSrc] = useState(null);
  const [imgAnimSrc, setImgAnimSrc] = useState(null);
  const [roomName, setRoomName] = useState(room?.name);

  useEffect(() => {
    if (!room) return;

    const updateRoomInfo = () => {
      let newImgSrc, newImgAnimSrc;

      const isDM = initMatrix.roomList.directs.has(spaceId);
      const myUserId = mx.getUserId();
      const dmTargetId = isDM ? guessDMRoomTargetId(room, myUserId) : null;

      if (isDM) {
        const dmUser = dmTargetId ? mx.getUser(dmTargetId) : null;
        const customAvatar = getCustomAvatar(dmTargetId);

        if (customAvatar) {
          newImgSrc = customAvatar;
          newImgAnimSrc = !appearanceSettings.enableAnimParams
            ? customAvatar
            : getAnimatedImageUrl(customAvatar);
        } else if (dmUser && dmUser.avatarUrl) {
          newImgSrc = mx.mxcUrlToHttp(dmUser.avatarUrl, 32, 32, 'crop');
          newImgAnimSrc = !appearanceSettings.enableAnimParams
            ? mx.mxcUrlToHttp(dmUser.avatarUrl)
            : getAnimatedImageUrl(mx.mxcUrlToHttp(dmUser.avatarUrl, 32, 32, 'crop'));
        } else {
          newImgSrc = room.getAvatarFallbackMember()?.getAvatarUrl(mx.baseUrl, 32, 32, 'crop') || null;
          newImgAnimSrc = !appearanceSettings.enableAnimParams
            ? room.getAvatarFallbackMember()?.getAvatarUrl(mx.baseUrl)
            : getAnimatedImageUrl(room.getAvatarFallbackMember()?.getAvatarUrl(mx.baseUrl, 32, 32, 'crop')) || null;
        }

        setRoomName(dmUser?.displayName || dmUser?.userId);
      } else {
        newImgSrc = room.getAvatarUrl(mx.baseUrl, 32, 32, 'crop') || null;
        newImgAnimSrc = !appearanceSettings.enableAnimParams
          ? room.getAvatarUrl(mx.baseUrl)
          : getAnimatedImageUrl(room.getAvatarUrl(mx.baseUrl, 32, 32, 'crop')) || null;
      }

      setImgSrc(newImgSrc);
      setImgAnimSrc(newImgAnimSrc);
    };

    updateRoomInfo();

    room.on('Room.name', updateRoomInfo);
    room.on('Room.avatar', updateRoomInfo);

    return () => {
      room.removeListener('Room.name', updateRoomInfo);
      room.removeListener('Room.avatar', updateRoomInfo);
    };
  }, [room, appearanceSettings]);

  if (!room) {
    console.warn(`Room not found for spaceId: ${spaceId}`);
    return null;
  }

  const openOptions = (e, id) => {
    e.preventDefault();
    openReusableContextMenu('right', getEventCords(e, '.sidebar-avatar'), (closeMenu) => (
      isSpace ? <SpaceOptions roomId={id} afterOptionSelect={closeMenu} />
        : <RoomOptions roomId={id} afterOptionSelect={closeMenu} />
    ));
  };

  const [, drop] = useDrop({
    accept: 'PINNED_ITEM',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    drop(item) {
      onDrop(item.index, item.id);
    },
    hover(item, monitor) {
      if (!shortcutRef.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = shortcutRef.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveShortcut(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'PINNED_ITEM',
    item: () => ({ id: spaceId, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(avatarRef);
  drop(shortcutRef);

  if (shortcutRef.current) {
    if (isDragging) shortcutRef.current.style.opacity = 0;
    else shortcutRef.current.style.opacity = 1;
  }

  return (
    <SidebarAvatar
      ref={shortcutRef}
      active={isActive}
      tooltip={roomName}
      onClick={() => {
        if (isSpace) {
          selectTab(spaceId, true);
        } else {
          selectRoomMode('room');
          selectRoom(spaceId);
        }
      }}
      onContextMenu={(e) => openOptions(e, spaceId)}
      avatar={
        <Avatar
          className="profile-image-container"
          ref={avatarRef}
          text={roomName}
          bgColor={colorMXID(room.roomId)}
          size="normal"
          animParentsCount={2}
          imageAnimSrc={imgAnimSrc}
          imageSrc={imgSrc}
          isDefaultImage={!imgSrc}
        />
      }
      notificationBadge={
        notifications.hasNoti(spaceId) ? (
          <NotificationBadge
            className={notificationClasses}
            alert={notifications.getHighlightNoti(spaceId) > 0}
            content={abbreviateNumber(notifications.getTotalNoti(spaceId)) || null}
          />
        ) : null
      }
    />
  );
}

DraggableSpaceShortcut.propTypes = {
  spaceId: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  isSpace: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  moveShortcut: PropTypes.func.isRequired,
  onDrop: PropTypes.func.isRequired,
};

export default function SpaceShortcut() {
  const mx = initMatrix.matrixClient;
  const [selectedTab] = useSelectedTab();
  useNotificationUpdate();
  const [pinnedItems, setPinnedItems] = usePinnedItems();

  const moveShortcut = (dragIndex, hoverIndex) => {
    const newPinnedItems = { ...pinnedItems };
    const allItems = [...newPinnedItems.spaces, ...newPinnedItems.rooms];
    const [removed] = allItems.splice(dragIndex, 1);
    allItems.splice(hoverIndex, 0, removed);

    newPinnedItems.spaces = allItems.filter(id => initMatrix.roomList.spaces.has(id));
    newPinnedItems.rooms = allItems.filter(id => !initMatrix.roomList.spaces.has(id));

    setPinnedItems(newPinnedItems);
    localStorage.setItem('pinned_items', JSON.stringify(newPinnedItems));
  };

  const handleDrop = (dragIndex, dragItemId) => {
    const newPinnedItems = { ...pinnedItems };
    const allItems = [...newPinnedItems.spaces, ...newPinnedItems.rooms];
    const draggedItem = allItems[dragIndex];

    if (!draggedItem) return;

    const isSpace = initMatrix.roomList.spaces.has(draggedItem);
    const type = isSpace ? 'spaces' : 'rooms';

    newPinnedItems[type] = newPinnedItems[type].filter(id => id !== dragItemId);
    allItems.splice(dragIndex, 1);
    allItems.splice(dragIndex, 0, dragItemId);

    newPinnedItems.spaces = allItems.filter(id => initMatrix.roomList.spaces.has(id));
    newPinnedItems.rooms = allItems.filter(id => !initMatrix.roomList.spaces.has(id));

    setPinnedItems(newPinnedItems);
    localStorage.setItem('pinned_items', JSON.stringify(newPinnedItems));
  };

  const allPinnedItems = [
    ...pinnedItems.spaces.filter(id => id !== null && mx.getRoom(id)).map(id => ({ id, isSpace: true })),
    ...pinnedItems.rooms.filter(id => id !== null && mx.getRoom(id)).map(id => ({ id, isSpace: false }))
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      {allPinnedItems.map((item, index) => (
        <DraggableSpaceShortcut
          key={`${item.id}-${index}`}
          index={index}
          spaceId={item.id}
          isSpace={item.isSpace}
          isActive={selectedTab === item.id}
          moveShortcut={moveShortcut}
          onDrop={handleDrop}
        />
      ))}
    </DndProvider>
  );
}
