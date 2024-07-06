// src/util/customUserSettings.js

let customUserSettings = null;

export async function fetchCustomUserSettings() {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/loregamer/Client/hq-chat/customUserSettings.json',
    );
    customUserSettings = await response.json();
  } catch (error) {
    console.error('Failed to fetch custom user settings:', error);
  }
}

export function getCustomUserSetting(userId, setting) {
  if (!customUserSettings || !customUserSettings.users[userId]) return null;
  return customUserSettings.users[userId][setting];
}
