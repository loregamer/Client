import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import settings from '@src/client/state/settings';

import initMatrix from '../../../client/initMatrix';
import {
  eventMaxListeners,
  getPowerLabel,
  getUsernameOfRoomMember,
} from '../../../util/matrixUtil';
import { colorMXID } from '../../../util/colorMXID';
import {
  openInviteUser,
  openProfileViewer,
  openReusableContextMenu,
} from '../../../client/action/navigation';
import AsyncSearch from '../../../util/AsyncSearch';
import { memberByPowerLevel, memberByAtoZ } from '../../../util/sort';

import Text from '../../atoms/text/Text';
import { Header } from '../../atoms/header/Header';
import IconButton from '../../atoms/button/IconButton';
import Button from '../../atoms/button/Button';
import Input from '../../atoms/input/Input';
import SegmentedControl from '../../atoms/segmented-controls/SegmentedControls';
import PeopleSelector from '../../molecules/people-selector/PeopleSelector';
import PeopleSelectorBanner from '../../molecules/people-selector/PeopleSelectorBanner';
import tinyAPI from '../../../util/mods';

import { getEventCords } from '../../../util/common';
import UserOptions from '../../molecules/user-options/UserOptions';

function simplyfiMembers(members) {
  const mx = initMatrix.matrixClient;
  return members
    .map((member) => {
      const displayName = getUsernameOfRoomMember(member);
      return {
        user: mx.getUser(member.userId),
        userId: member.userId,
        name: displayName,
        username: member.userId.slice(1, member.userId.indexOf(':')),
        avatarSrc: member.getAvatarUrl(mx.baseUrl, 32, 32, 'crop'),
        peopleRole: getPowerLabel(member.powerLevel),
        powerLevel: member.powerLevel,
        displayName: displayName.toLowerCase(), // for case-insensitive sorting
      };
    })
    .sort((a, b) => {
      const powerLevelDiff = memberByPowerLevel(a, b);
      if (powerLevelDiff !== 0) return powerLevelDiff;
      return memberByAtoZ(a, b);
    });
}

const asyncSearch = new AsyncSearch();
asyncSearch.setMaxListeners(eventMaxListeners);
function PeopleDrawer({
  roomId,
  isUserList,
  setIsUserList,
  isHoverSidebar = false,
  sidebarTransition = false,
  isDrawer = true,
}) {
  const mx = initMatrix.matrixClient;
  const { directs } = initMatrix.roomList;

  const [isIconsColored, setIsIconsColored] = useState(settings.isSelectedThemeColored());
  settings.isThemeColoredDetector(useEffect, setIsIconsColored);

  const room = mx.getRoom(roomId);
  const canInvite = room?.canInvite(mx.getUserId());
  const isDM = directs.has(roomId);

  const newValues = [
    { name: 'Joined', value: 'join' },
    { name: 'Invited', value: 'invite' },
    { name: 'Banned', value: 'ban' },
  ];

  const usersCount = room.getJoinedMemberCount();

  tinyAPI.emit('roomMembersOptions', newValues, isUserList);
  const defaultMembership = newValues.find((item) => item.value === 'join');

  const [membership, setMembership] = useState(defaultMembership);
  const [memberList, setMemberList] = useState([]);
  const [searchedMembers, setSearchedMembers] = useState(null);
  const [sortedMemberList, setSortedMemberList] = useState([]);
  const searchRef = useRef(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  const newIsUserList = !isDM || usersCount !== 2 || membership.value !== 'join';
  useEffect(() => {
    if (isUserList !== newIsUserList) setIsUserList(newIsUserList);
  });

  const getMembersWithMembership = useCallback(
    (mship) => room.getMembersWithMembership(mship),
    [roomId, membership.value],
  );

  function handleSearchData(data) {
    // NOTICE: data is passed as object property
    // because react sucks at handling state update with array.
    setSearchedMembers({ data });
  }

  function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    if ((searchRef.current && term === '') || term === undefined) {
      searchRef.current.value = '';
      searchRef.current.focus();
      setSearchedMembers(null);
    } else {
      const filteredMembers = sortedMemberList.filter(member =>
        member.name.toLowerCase().includes(term) ||
        member.userId.toLowerCase().includes(term)
      );
      setSearchedMembers({ data: filteredMembers, term });
    }
  }

  useEffect(() => {
    asyncSearch.setup(memberList, {
      keys: ['name', 'username', 'userId'],
      limit: Infinity,
    });
  }, [memberList]);

  useEffect(() => {
    let isMounted = true;

    const loadAndSortMembers = async () => {
      setIsLoadingMembers(true);
      await room.loadMembersIfNeeded();

      if (!isMounted) return;

      let membersToSort;
      if (!Array.isArray(membership.custom)) {
        membersToSort = getMembersWithMembership(membership.value);
      } else {
        membersToSort = membership.custom;
      }

      const sortedMembers = simplyfiMembers(membersToSort);
      setMemberList(sortedMembers);
      setSortedMemberList(sortedMembers);
      setIsLoadingMembers(false);
    };

    loadAndSortMembers();

    const updateMemberList = () => {
      loadAndSortMembers();
    };

    mx.on('RoomMember.membership', updateMemberList);
    mx.on('RoomMember.powerLevel', updateMemberList);

    return () => {
      isMounted = false;
      mx.removeListener('RoomMember.membership', updateMemberList);
      mx.removeListener('RoomMember.powerLevel', updateMemberList);
    };
  }, [roomId, membership, getMembersWithMembership]);

  const segments = [];
  const segmentsIndex = {};
  const selectMembership = [];

  let segmentIndexCounter = 0;
  for (const item in newValues) {
    const vl = newValues[item];
    if (typeof vl.name === 'string' && typeof vl.value === 'string') {
      segments.push({ text: vl.name });
      selectMembership.push(() => setMembership(vl));

      segmentsIndex[vl.value] = segmentIndexCounter;
      segmentIndexCounter++;
    }
  }

  const mList = searchedMembers ? searchedMembers.data : sortedMemberList;
  tinyAPI.emit('roomSearchedMembers', mList, membership);
  const showPeopleDrawer = !isDrawer && (isHoverSidebar || sidebarTransition);

  return (
    <>
      <div
        className={`people-drawer${!isUserList ? ' people-drawer-banner' : ''}${showPeopleDrawer ? ' d-hide-drawer' : ''}`}
        onMouseEnter={
          isHoverSidebar
            ? () => {
              if (isHoverSidebar) $('body').addClass('people-drawer-hover');
            }
            : null
        }
        onMouseLeave={
          isHoverSidebar
            ? () => {
              if (isHoverSidebar) $('body').removeClass('people-drawer-hover');
            }
            : null
        }
      >
        <Header>
          <ul className="navbar-nav mr-auto pb-1">
            {isUserList ? (
              <li className="nav-item ps-2">
                People
                <div className="very-small text-gray">{`${usersCount} members`}</div>
              </li>
            ) : (
              <li className="nav-item ps-2">
                User Room
                <div className="very-small text-gray">The user private room</div>
              </li>
            )}
          </ul>

          <ul className="navbar-nav ms-auto mb-0 small">
            <li className="nav-item">
              <IconButton
                neonColor
                iconColor={!isIconsColored ? null : 'rgb(164, 42, 212)'}
                onClick={() => openInviteUser(roomId)}
                tooltipPlacement="bottom"
                tooltip="Invite"
                fa="fa-solid fa-user-plus"
                disabled={!canInvite}
              />
            </li>
          </ul>
        </Header>

        <div className={`people-drawer__content-wrapper people-drawer-select-${membership.value}`}>
          <center
            className={`${isUserList ? 'p-3 ' : ''} w-100`}
            style={{
              height: '100%',
              overflowY: 'auto',
            }}
          >
            {isUserList ? (
              <SegmentedControl
                className="pb-3"
                selected={(() => {
                  const getSegmentIndex = segmentsIndex;
                  return getSegmentIndex[membership.value];
                })()}
                segments={segments}
                onSelect={(index) => {
                  const selectSegment = selectMembership;
                  selectSegment[index]?.();
                }}
              />
            ) : null}

            {mList.map((member) =>
              !member.customSelector ? (
                isUserList ? (
                  <PeopleSelector
                    avatarSize={32}
                    key={member.userId}
                    user={mx.getUser(member.userId)}
                    onClick={() =>
                      typeof member.customClick !== 'function'
                        ? openProfileViewer(member.userId, roomId)
                        : member.customClick()
                    }
                    contextMenu={(e) => {
                      openReusableContextMenu(
                        'bottom',
                        getEventCords(e, '.ic-btn'),
                        (closeMenu) => (
                          <UserOptions userId={member.userId} afterOptionSelect={closeMenu} />
                        ),
                      );

                      e.preventDefault();
                    }}
                    customData={member.customData}
                    avatarSrc={member.avatarSrc}
                    name={member.name}
                    color={colorMXID(member.userId)}
                    peopleRole={member.peopleRole}
                  />
                ) : member.userId !== mx.getUserId() ? (
                  <PeopleSelectorBanner
                    key={member.userId}
                    roomId={roomId}
                    user={mx.getUser(member.userId)}
                    name={member.name}
                    color={colorMXID(member.userId)}
                    peopleRole={member.peopleRole}
                  />
                ) : (
                  ''
                )
              ) : (
                <member.customSelector
                  key={member.userId}
                  user={mx.getUser(member.userId)}
                  onClick={() =>
                    typeof member.customClick !== 'function'
                      ? openProfileViewer(member.userId, roomId)
                      : member.customClick()
                  }
                  avatarSrc={member.avatarSrc}
                  name={member.name}
                  customData={member.customData}
                  color={colorMXID(member.userId)}
                  peopleRole={member.peopleRole}
                />
              ),
            )}

            {isUserList && (searchedMembers?.data.length === 0 || memberList.length === 0) && (
              <div className="people-drawer__noresult">
                <Text variant="b2">No results found!</Text>
              </div>
            )}
          </center>

          {isUserList ? (
            <div className="pt-1">
              <form onSubmit={(e) => e.preventDefault()} className="people-search">
                <div>
                  <Input
                    forwardRef={searchRef}
                    type="text"
                    onChange={handleSearch}
                    placeholder="Search"
                    required
                  />
                </div>
                {searchedMembers !== null && (
                  <center>
                    <IconButton onClick={handleSearch} size="small" fa="fa-solid fa-xmark" />
                  </center>
                )}
              </form>
            </div>
          ) : null}
        </div>
      </div>
      <div
        className={`${isHoverSidebar ? 'people-drawer-hidden' : ''}${!showPeopleDrawer && isHoverSidebar ? ' d-none' : ''}`}
        onMouseEnter={
          isHoverSidebar
            ? () => {
              if (isHoverSidebar) $('body').addClass('people-drawer-hover');
            }
            : null
        }
        onMouseLeave={
          isHoverSidebar
            ? () => {
              if (isHoverSidebar) $('body').removeClass('people-drawer-hover');
            }
            : null
        }
      >
        <div className="tiny-divider border-bg border-bottom" />
      </div>
    </>
  );
}

PeopleDrawer.propTypes = {
  roomId: PropTypes.string.isRequired,
};

export default PeopleDrawer;
