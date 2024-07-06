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

// Draggable Space Shortcut
function DraggableSpaceShortcut({ isActive, spaceId, isSpace, index, moveShortcut, onDrop }) {
  const mx = initMatrix.matrixClient;
  const { notifications } = initMatrix;
  const room = mx.getRoom(spaceId);
  const shortcutRef = useRef(null);
  const avatarRef = useRef(null);
  const appearanceSettings = getAppearance();

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
    item: () => ({ spaceId, index }),
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
      tooltip={room.name}
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
          text={room.name}
          bgColor={colorMXID(room.roomId)}
          size="normal"
          animParentsCount={2}
          imageAnimSrc={
            !appearanceSettings.enableAnimParams
              ? room.getAvatarUrl(initMatrix.matrixClient.baseUrl)
              : getAnimatedImageUrl(
                room.getAvatarUrl(initMatrix.matrixClient.baseUrl, 42, 42, 'crop'),
              ) || null
          }
          imageSrc={room.getAvatarUrl(initMatrix.matrixClient.baseUrl, 42, 42, 'crop') || null}
          isDefaultImage
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
  const [pinnedItems, togglePinnedItem] = usePinnedItems();

  const moveShortcut = (dragIndex, hoverIndex) => {
    const newPinnedItems = { ...pinnedItems };
    const item = newPinnedItems.spaces[dragIndex];
    newPinnedItems.spaces.splice(dragIndex, 1);
    newPinnedItems.spaces.splice(hoverIndex, 0, item);
    localStorage.setItem('pinned_items', JSON.stringify(newPinnedItems));
    togglePinnedItem(item, true);
  };

  const handleDrop = (dragIndex, dragItemId) => {
    const newPinnedItems = { ...pinnedItems };
    const draggedItem = allPinnedItems[dragIndex];
    if (!draggedItem) return;

    const type = draggedItem.isSpace ? 'spaces' : 'rooms';

    newPinnedItems[type] = newPinnedItems[type].filter(id => id !== dragItemId && id !== null);
    newPinnedItems[type].splice(dragIndex, 0, dragItemId);

    localStorage.setItem('pinned_items', JSON.stringify(newPinnedItems));
    togglePinnedItem(dragItemId, draggedItem.isSpace);
  };

  const allPinnedItems = [
    ...pinnedItems.spaces.filter(id => id !== null).map(id => ({ id, isSpace: true })),
    ...pinnedItems.rooms.filter(id => id !== null).map(id => ({ id, isSpace: false }))
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      {allPinnedItems.map((item, index) => (
        <DraggableSpaceShortcut
          key={item.id}
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
