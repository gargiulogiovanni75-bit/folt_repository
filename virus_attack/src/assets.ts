// The user uploaded images that have a blue title bar 'Error' and a red 'X'.
// We provide similar-looking SVG placeholders in case the physical images are unavailable.
// To use real images, the user can place them in `public/` and change these constants.

const createPlaceholder = (index: number) => {
  const svg = `<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="500" fill="#ffffff" stroke="#c0c0c0" stroke-width="2"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#000" font-family="sans-serif" font-size="20">Image Placeholder ${index}</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="14">Upload image ${index} to public/ folder</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const FALLBACK_CARDS = [
  createPlaceholder(0),
  createPlaceholder(1),
  createPlaceholder(2),
  createPlaceholder(3),
  createPlaceholder(4),
  createPlaceholder(5)
];

// These are the paths to the user's intended physical images in the `public` folder.
export const CARDS = [
  '/0.jpg',
  '/1.jpg',
  '/2.jpg',
  '/3.png',
  '/4.png',
  '/5.png'
];
