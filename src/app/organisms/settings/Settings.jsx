import React, { useState, useEffect } from 'react';
import envAPI from '@src/util/libs/env';

import initMatrix from '../../../client/initMatrix';
import cons from '../../../client/state/cons';
import navigation from '../../../client/state/navigation';

import Tabs from '../../atoms/tabs/Tabs';
import PopupWindow from '../../molecules/popup-window/PopupWindow';
import { ImagePackUser, ImagePackGlobal } from '../../molecules/image-pack/ImagePack';
import ProfileEditor from '../profile-editor/ProfileEditor';
import { resizeWindowChecker } from '../../../util/tools';
import { confirmDialog } from '../../molecules/confirm-dialog/ConfirmDialog';

import ProfileSection from './pages/Profile';
import AccountSection from './pages/Account';
import AppearanceSection from './pages/Appearance';
import NotificationsSection from './pages/Notifications';
import SecuritySection from './pages/Security';
import PrivacySection from './pages/Privacy';
import DonateSection from './pages/Donate';
import OsSection from './pages/OS';
import AboutSection from './pages/About';
import ExperimentalSection from './pages/Experimental';
import AdvancedUserSection from './pages/AdvancedUserSection';
import VoiceVideoSection from './pages/VoiceVideo';
import IpfsSection from './pages/Ipfs';
import Web3Section from './pages/Web3';
import LibreTranslateSection from './pages/LibreTranslate';

const voiceChatEnabled = __ENV_APP__.ENABLE_VOICE_CHAT;
const enableAccountCustomization = __ENV_APP__.ENABLE_ACCOUNT_CUSTOMIZATION === 'true';

function EmojiSection() {
  return (
    <>
      <ImagePackUser />
      <ImagePackGlobal />
    </>
  );
}

export const tabText = {
  WEB3: 'Web3',
  APPEARANCE: 'Appearance',
  ACCOUNT: 'Account',
  ADVANCED: 'Advanced User',
  VOICEVIDEO: 'Voice & Video',
  LIBRETRANSLATE: 'Libre Translate',
  IPFS: 'IPFS Protocol',
  PRIVACY: 'Privacy',
  NOTIFICATIONS: 'Notifications',
  EMOJI: 'Emoji',
  SECURITY: 'Security',
  ABOUT: 'About',
  DONATE: 'Donate',
  PROFILE: 'Profile',
  LOGOUT: 'Logout',
  EXPERIMENTAL: 'Experimental',
  OS: '{OS} Settings',
};

const tabItems = [];
const buildTabItems = () => {
  if (tabItems.length < 1) {
    tabItems.push({
      text: tabText.PROFILE,
      key: 'profile',
      faSrc: 'fa-solid fa-id-card',
      disabled: false,
      render: () => <ProfileSection />,
    });

    if (enableAccountCustomization) {
      tabItems.push({
        text: tabText.ACCOUNT,
        key: 'account',
        faSrc: 'fa-solid fa-user',
        disabled: false,
        render: () => <AccountSection />,
      });
    }

    tabItems.push({
      text: tabText.APPEARANCE,
      key: 'appearance',
      faSrc: 'fa-solid fa-sun',
      disabled: false,
      render: () => <AppearanceSection />,
    });

    if (voiceChatEnabled) {
      tabItems.push({
        text: tabText.VOICEVIDEO,
        key: 'voicevideo',
        faSrc: 'bi bi-optical-audio-fill',
        disabled: false,
        render: () => <VoiceVideoSection />,
      });
    }

    tabItems.push({
      text: tabText.EMOJI,
      key: 'emoji',
      faSrc: 'fa-solid fa-face-smile',
      disabled: false,
      render: () => <EmojiSection />,
    });

    tabItems.push({ type: 'divider', key: '1' });

    tabItems.push({
      text: tabText.NOTIFICATIONS,
      key: 'notificaitons',
      faSrc: 'fa-solid fa-bell',
      disabled: false,
      render: () => <NotificationsSection />,
    });

    tabItems.push({
      text: tabText.SECURITY,
      key: 'security',
      faSrc: 'fa-solid fa-lock',
      disabled: false,
      render: () => <SecuritySection />,
    });

    tabItems.push({
      text: tabText.PRIVACY,
      key: 'privacy',
      faSrc: 'bi bi-eye-fill',
      disabled: false,
      render: () => <PrivacySection />,
    });

    if (__ENV_APP__.ELECTRON_MODE) {
      tabItems.push({
        text: tabText.OS.replace(
          '{OS}',
          __ENV_APP__.PLATFORM === 'win32'
            ? 'Windows'
            : __ENV_APP__.PLATFORM === 'linux'
              ? 'Linux'
              : __ENV_APP__.PLATFORM === 'darwin'
                ? 'Mac'
                : 'OS',
        ),
        key: 'os',

        faSrc:
          __ENV_APP__.PLATFORM === 'win32'
            ? 'fa-brands fa-windows'
            : __ENV_APP__.PLATFORM === 'linux'
              ? 'fa-brands fa-linux'
              : __ENV_APP__.PLATFORM === 'darwin'
                ? 'fa-brands fa-apple'
                : 'fa-solid fa-computer',

        disabled: false,
        render: () => <OsSection />,
      });
    }

    tabItems.push({ type: 'divider', key: '2' });
    tabItems.push({
      badge: { text: 'Beta', color: 'secondary' },
      text: tabText.LIBRETRANSLATE,
      key: 'libretranslate',
      faSrc: 'fa-solid fa-globe',
      disabled: false,
      render: () => <LibreTranslateSection />,
    });

    if (envAPI.get('WEB3') || envAPI.get('IPFS')) {
      if (envAPI.get('IPFS')) {
        tabItems.push({
          text: tabText.IPFS,
          key: 'ipfs',
          faSrc: 'fa-solid fa-cube',
          disabled: false,
          render: () => <IpfsSection />,
        });
      }

      if (envAPI.get('WEB3')) {
        tabItems.push({
          text: tabText.WEB3,
          key: 'web3',
          faSrc: 'fa-brands fa-ethereum',
          disabled: false,
          render: () => <Web3Section />,
        });
      }
    }

    tabItems.push({ type: 'divider', key: '3' });

    tabItems.push({
      text: tabText.DONATE,
      key: 'donate',
      faSrc: 'fa-solid fa-coins',
      disabled: false,
      render: () => <DonateSection />,
    });

    tabItems.push({
      text: tabText.ABOUT,
      key: 'about',
      faSrc: 'fa-solid fa-circle-info',
      disabled: false,
      render: () => <AboutSection />,
    });

    tabItems.push({ type: 'divider', key: '4' });

    tabItems.push({
      text: tabText.ADVANCED,
      key: 'advanced',
      faSrc: 'fa-solid fa-toolbox',
      disabled: false,
      render: () => <AdvancedUserSection />,
    });

    tabItems.push({
      text: tabText.EXPERIMENTAL,
      key: 'experimental',
      faSrc: 'fa-solid fa-flask',
      disabled: false,
      render: () => <ExperimentalSection />,
    });

    tabItems.push({ type: 'divider', key: '5' });

    tabItems.push({
      text: tabText.LOGOUT,
      key: 'logout',
      faSrc: 'fa-solid fa-power-off',
      className: 'btn-text-danger logout',
      disabled: false,
      onClick: async () => {
        if (
          await confirmDialog(
            'Logout',
            'Are you sure that you want to logout your session?',
            'Logout',
            'danger',
          )
        ) {
          initMatrix.logout();
        }
      },
    });
  }
};

function useWindowToggle(setSelectedTab) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const openSettings = (tab) => {
      const tabItem = tabItems.find((item) => item.text === tab);
      if (tabItem) setSelectedTab(tabItem);
      setIsOpen(true);
    };
    navigation.on(cons.events.navigation.SETTINGS_OPENED, openSettings);
    return () => {
      navigation.removeListener(cons.events.navigation.SETTINGS_OPENED, openSettings);
    };
  }, []);

  const requestClose = () => setIsOpen(false);

  return [isOpen, requestClose];
}

function Settings() {
  buildTabItems();
  const [selectedTab, setSelectedTab] = useState(tabItems[0]);
  const [isOpen, requestClose] = useWindowToggle(setSelectedTab);

  const handleTabChange = (tabItem) => setSelectedTab(tabItem);
  resizeWindowChecker();

  if (isOpen) {
    $('body').addClass('settings-modal-open');
  } else {
    $('body').removeClass('settings-modal-open');
  }

  if (window.matchMedia('screen and (max-width: 768px)').matches) {
    $('body').addClass('settings-modal-open-2');
  } else {
    $('body').removeClass('settings-modal-open-2');
  }

  return (
    <PopupWindow
      isFullscreen={!window.matchMedia('screen and (max-width: 768px)').matches}
      id="settings-base"
      classBody="py-0 my-0"
      title={window.matchMedia('screen and (max-width: 768px)').matches ? 'Settings' : null}
      isOpen={isOpen}
      size={'modal-xl'}
      onRequestClose={requestClose}
    >
      {isOpen &&
        (!window.matchMedia('screen and (max-width: 768px)').matches ? (
          <div className="my-0 py-0">
            <div
              id="setting-tab"
              className={`py-3 border-bg${__ENV_APP__.ELECTRON_MODE ? ' root-electron-style-solo' : ''}`}
            >
              <Tabs
                requestClose={requestClose}
                items={tabItems}
                defaultSelected={tabItems.findIndex((tab) => tab.text === selectedTab.text)}
                onSelect={handleTabChange}
                isFullscreen
              />
            </div>

            <div id="settings-content" className="py-3">
              {selectedTab.render()}
            </div>
          </div>
        ) : (
          <div className="w-100 py-3">
            <ProfileEditor userId={initMatrix.matrixClient.getUserId()} />
            <Tabs
              id="setting-tab-2"
              items={tabItems}
              defaultSelected={tabItems.findIndex((tab) => tab.text === selectedTab.text)}
              onSelect={handleTabChange}
            />

            <div id="settings-content-2" className="p-3 border-top border-bg">
              {selectedTab.render()}
            </div>
          </div>
        ))}
    </PopupWindow>
  );
}

export default Settings;
