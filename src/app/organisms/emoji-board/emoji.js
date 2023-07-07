import emojisData from '@emoji-mart/data';

import clone from 'clone';
import OLDemojisData from 'emojibase-data/en/compact.json';
import joypixels from 'emojibase-data/en/shortcodes/joypixels.json';
import emojibase from 'emojibase-data/en/shortcodes/emojibase.json';

const emojiGroups = [{
  id: 'people',
  name: 'Smileys & people',
  order: 0,
  emojis: [],
}, {
  id: 'nature',
  name: 'Animals & nature',
  order: 1,
  emojis: [],
}, {
  id: 'foods',
  name: 'Food & drinks',
  order: 2,
  emojis: [],
}, {
  id: 'activity',
  name: 'Activity',
  order: 3,
  emojis: [],
}, {
  id: 'places',
  name: 'Travel & places',
  order: 4,
  emojis: [],
}, {
  id: 'objects',
  name: 'Objects',
  order: 5,
  emojis: [],
}, {
  id: 'symbols',
  name: 'Symbols',
  order: 6,
  emojis: [],
}, {
  id: 'flags',
  name: 'Flags',
  order: 7,
  emojis: [],
}];
Object.freeze(emojiGroups);
console.log('EMOJI ROOT', emojisData);

const defaultEmojis = [];
emojisData.categories.forEach(category => {
  for (const item in category.emojis) {
    const emoji = emojisData.emojis[category.emojis[item]];
    if (emoji) {

      const em = {
        category: category.id,
        hexcode: emoji.skins[0].unified.toUpperCase(),
        label: emoji.name,
        unicode: emoji.skins[0].native,
        version: emoji.version,
      };

      em.shortcode = emoji.id;
      em.shortcodes = clone(emoji.keywords);
      em.shortcodes.unshift(emoji.id);

      const groupIndex = emojiGroups.findIndex(group => group.id === category.id);
      if (groupIndex > -1) {
        em.group = groupIndex;
        console.log('EMOJI MART', emoji);
        console.log('EMOJI NEW', clone(em));
        emojiGroups[groupIndex].emojis.push(emoji);
      };

      defaultEmojis.push(em);

    }
  }
});

OLDemojisData.forEach((emoji) => {
  const myShortCodes = joypixels[emoji.hexcode] || emojibase[emoji.hexcode];
  if (!myShortCodes) return;
  const em = {
    ...emoji,
    shortcode: Array.isArray(myShortCodes) ? myShortCodes[0] : myShortCodes,
    shortcodes: myShortCodes,
  };

  console.log('EMOJI OLD', clone(em));
  // addToGroup(em);
  // defaultEmojis.push(em);
});

const emojis = [];

const addEmojiToList = data => {
  emojis.push(data);
};

const removeEmojiFromList = data => {
  const index = emojis.indexOf(data);
  if (index > -1) {
    emojis.splice(index, 1);
  }
};

const resetEmojisList = () => {
  while (emojis.length > 0) {
    emojis.shift();
  }
};

const addDefaultEmojisToList = (favEmojis = []) => {
  defaultEmojis.map(emoji => {
    emoji.isFav = (favEmojis.findIndex(u => u.unicode === emoji.unicode) > -1);
    emojis.push(emoji);
    return emoji;
  });
};

export {
  emojis, defaultEmojis, emojiGroups, addEmojiToList, removeEmojiFromList, resetEmojisList, addDefaultEmojisToList,
};
