// Cover art for Lab notes: scenes photographed from the map by scripts/cover-art.cjs (public/covers/<scene>.jpg,
// 2000×1250). `focus` is where the scene's landmark sits, as fractions of the width and height; covers place the
// art so the landmark stays clear of the title card.
export const SCENES = {
  map: { label: 'The whole map', focus: [0.5, 0.5] },
  hq: { label: 'The lighthouse (HQ)', focus: [0.46, 0.45] },
  london: { label: 'London: Scamfendr and Vervet', focus: [0.45, 0.42] },
  lagos: { label: 'Lagos: NotisCare and Ganusii', focus: [0.42, 0.55] },
  calgary: { label: 'Calgary: Nestlo', focus: [0.52, 0.6] }
};

// wide: link previews (LinkedIn, WhatsApp, Slack) and the article's og:image. portrait: a LinkedIn feed image.
export const COVER_SIZES = { wide: { width: 1200, height: 630, label: 'Link preview, 1200×630' }, portrait: { width: 1080, height: 1350, label: 'LinkedIn post, 1080×1350' } };

export const sceneOf = (cover) => (SCENES[cover] ? cover : 'map');
