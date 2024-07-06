import React, { useState, useEffect, useCallback } from 'react';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';
import { createSpaceShortcut, deleteSpaceShortcut } from '../../../client/action/accountData';
import { joinRuleToIconSrc } from '../../../util/matrixUtil';
import { roomIdByAtoZ } from '../../../util/sort';

import Text from '../../atoms/text/Text';
import Button from '../../atoms/button/Button';
import IconButton from '../../atoms/button/IconButton';
import Checkbox from '../../atoms/button/Checkbox';
import Spinner from '../../atoms/spinner/Spinner';
import RoomSelector from '../../molecules/room-selector/RoomSelector';
import Dialog from '../../molecules/dialog/Dialog';

import { useSpaceShortcut } from '../../hooks/useSpaceShortcut';

export function usePinnedItems() {
  const [pinnedItems, setPinnedItems] = useState(() => {
    const pinnedData = localStorage.getItem('pinned_items');
    return pinnedData ? JSON.parse(pinnedData) : { spaces: [], rooms: [] };
  });

  const togglePinnedItem = useCallback((itemId, isSpace) => {
    setPinnedItems((prevPinnedItems) => {
      const type = isSpace ? 'spaces' : 'rooms';
      const newItems = prevPinnedItems[type].includes(itemId)
        ? prevPinnedItems[type].filter((id) => id !== itemId)
        : [...prevPinnedItems[type], itemId];
      const newPinnedItems = { ...prevPinnedItems, [type]: newItems };
      localStorage.setItem('pinned_items', JSON.stringify(newPinnedItems));
      return newPinnedItems;
    });
  }, []);

  return [pinnedItems, togglePinnedItem];
}

function ShortcutSpacesContent() {
  const mx = initMatrix.matrixClient;
  const { spaces, rooms, directs, roomIdToParents } = initMatrix.roomList;

  const [pinnedItems, togglePinnedItem] = usePinnedItems();
  const unpinnedSpaces = [...spaces].filter((spaceId) => !pinnedItems.spaces.includes(spaceId)).sort(roomIdByAtoZ);
  const unpinnedRooms = [...rooms, ...directs].filter((roomId) => !pinnedItems.rooms.includes(roomId)).sort(roomIdByAtoZ);

  const [process, setProcess] = useState(null);
  const [selected, setSelected] = useState({ spaces: [], rooms: [] });

  useEffect(() => {
    if (process !== null) {
      setProcess(null);
      setSelected({ spaces: [], rooms: [] });
    }
  }, [pinnedItems]);

  const toggleSelection = (id, isSpace) => {
    if (process !== null) return;
    setSelected((prev) => {
      const type = isSpace ? 'spaces' : 'rooms';
      const newSelected = [...prev[type]];
      const selectedIndex = newSelected.indexOf(id);

      if (selectedIndex > -1) {
        newSelected.splice(selectedIndex, 1);
      } else {
        newSelected.push(id);
      }

      return { ...prev, [type]: newSelected };
    });
  };

  const handleAdd = () => {
    setProcess(`Pinning ${selected.spaces.length + selected.rooms.length} items...`);
    selected.spaces.forEach((spaceId) => togglePinnedItem(spaceId, true));
    selected.rooms.forEach((roomId) => togglePinnedItem(roomId, false));
  };

  const renderItem = (id, isSpace, isPinned) => {
    const room = mx.getRoom(id);
    if (!room) return null;

    const name = room.name;
    const avatarSrc = room.getAvatarUrl(mx.baseUrl, 32, 32, 'crop') || null;

    const toggleSelected = () => toggleSelection(id, isSpace);
    const togglePin = () => togglePinnedItem(id, isSpace);

    return (
      <RoomSelector
        key={id}
        name={name}
        roomId={id}
        imageSrc={avatarSrc}
        iconSrc={joinRuleToIconSrc(room.getJoinRule(), isSpace)}
        isUnread={false}
        notificationCount={0}
        isAlert={false}
        onClick={isPinned ? togglePin : toggleSelected}
        options={
          isPinned ? (
            <IconButton
              fa="bi bi-pin-angle-fill"
              size="small"
              onClick={togglePin}
              disabled={process !== null}
            />
          ) : (
            <Checkbox
              isActive={selected[isSpace ? 'spaces' : 'rooms'].includes(id)}
              variant="success"
              onToggle={toggleSelected}
              tabIndex={-1}
              disabled={process !== null}
            />
          )
        }
      />
    );
  };

  return (
    <>
      <Text className="shortcut-spaces__header" variant="b3" weight="bold">
        Pinned items
      </Text>
      {pinnedItems.spaces.length === 0 && pinnedItems.rooms.length === 0 && (
        <div className="small px-2">No pinned items</div>
      )}
      {pinnedItems.spaces.map((spaceId) => renderItem(spaceId, true, true))}
      {pinnedItems.rooms.map((roomId) => renderItem(roomId, false, true))}
      <Text className="shortcut-spaces__header" variant="b3" weight="bold">
        Unpinned items
      </Text>
      {unpinnedSpaces.length === 0 && unpinnedRooms.length === 0 && <Text>No unpinned items</Text>}
      {unpinnedSpaces.map((spaceId) => renderItem(spaceId, true, false))}
      {unpinnedRooms.map((roomId) => renderItem(roomId, false, false))}
      {(selected.spaces.length !== 0 || selected.rooms.length !== 0) && (
        <div className="shortcut-spaces__footer">
          {process && <Spinner size="small" />}
          <Text weight="medium">
            {process || `${selected.spaces.length + selected.rooms.length} items selected`}
          </Text>
          {!process && (
            <Button onClick={handleAdd} variant="primary">
              Pin
            </Button>
          )}
        </div>
      )}
    </>
  );
}

function useVisibilityToggle() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    navigation.on(cons.events.navigation.SHORTCUT_SPACES_OPENED, handleOpen);
    return () => {
      navigation.removeListener(cons.events.navigation.SHORTCUT_SPACES_OPENED, handleOpen);
    };
  }, []);

  const requestClose = () => setIsOpen(false);

  return [isOpen, requestClose];
}

function ShortcutSpaces() {
  const [isOpen, requestClose] = useVisibilityToggle();

  return (
    <Dialog
      bodyClass="space-add-existing-modal pin-spaces"
      isOpen={isOpen}
      className="modal-lg noselect"
      title={
        <Text variant="s1" weight="medium" primary>
          Pin spaces
        </Text>
      }
      onRequestClose={requestClose}
    >
      {isOpen ? <ShortcutSpacesContent /> : <div />}
    </Dialog>
  );
}

export default ShortcutSpaces;
