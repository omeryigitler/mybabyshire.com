const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

const shell = (body: string, label: string) => `${XML_HEADER}
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480" role="img" aria-label="${label}">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#4a3328" flood-opacity=".20"/>
    </filter>
    <linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffdf7"/><stop offset="1" stop-color="#eadbc8"/></linearGradient>
    <linearGradient id="black" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#292326"/><stop offset="1" stop-color="#080708"/></linearGradient>
    <linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f24d4d"/><stop offset="1" stop-color="#9d151d"/></linearGradient>
    <pattern id="gingham" width="28" height="28" patternUnits="userSpaceOnUse">
      <rect width="28" height="28" fill="#edf7ff"/><rect width="14" height="28" fill="#a6c9eb" opacity=".72"/><rect width="28" height="14" fill="#a6c9eb" opacity=".72"/><rect width="14" height="14" fill="#6ca4d5" opacity=".72"/>
    </pattern>
  </defs>
  ${body}
</svg>`;

const shirt = (design: string, accent = '#80acd5') => `
  <g filter="url(#shadow)">
    <path d="M119 126l74-38c14 27 80 27 94 0l74 38-37 77-43-22v205H199V181l-43 22z" fill="#fffdfa" stroke="#d8cfc5" stroke-width="6" stroke-linejoin="round"/>
    <path d="M193 88c11 34 83 34 94 0" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>
    ${design}
  </g>`;

const numberText = (fill: string, stroke = '#33465f', n = '1') => `<text x="240" y="290" text-anchor="middle" font-family="Georgia,serif" font-size="160" font-weight="800" fill="${fill}" stroke="${stroke}" stroke-width="5" paint-order="stroke">${n}</text>`;
const nameText = (value = 'YOUR NAME', color = '#3f2c23') => `<text x="240" y="340" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="2" fill="${color}">${value}</text>`;

const bow = (x: number, y: number, color: string, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 22C-48-10-78-15-84 4c-8 26 29 50 84 31 55 19 92-5 84-31-6-19-36-14-84 18z" fill="${color}"/><rect x="-13" y="11" width="26" height="27" rx="8" fill="${color}" stroke="#fff" stroke-opacity=".3"/></g>`;

const tutu = (color: string, accent = '#fff', y = 260) => `<g filter="url(#shadow)">
  <rect x="144" y="${y - 18}" width="192" height="42" rx="20" fill="${accent}" stroke="#d8c7b9" stroke-width="4"/>
  <path d="M151 ${y + 8}C103 ${y + 57} 72 ${y + 123} 96 ${y + 150}c31 37 257 37 288 0 24-27-7-93-55-142-36 28-142 28-178 0z" fill="${color}" opacity=".86"/>
  <path d="M170 ${y + 6}l-31 139M205 ${y + 10}l-13 150M240 ${y + 10}v153M275 ${y + 10}l13 150M310 ${y + 6}l31 139" stroke="#fff" stroke-opacity=".32" stroke-width="9" stroke-linecap="round"/>
</g>`;

const romper = (fill: string, lace = false) => `<g filter="url(#shadow)">
  <path d="M172 114c18-27 42-40 68-40s50 13 68 40l43 48-43 45v117l-42 61-26-34-26 34-42-61V207l-43-45z" fill="${fill}" stroke="#cfc1b7" stroke-width="5" stroke-linejoin="round"/>
  ${lace ? '<path d="M164 115l-35 47 43 45h136l43-45-35-47c-18 26-49 41-76 41s-58-15-76-41z" fill="none" stroke="#f3e9e0" stroke-width="13" stroke-dasharray="4 8"/>' : ''}
  <path d="M198 86c8 32 76 32 84 0" fill="none" stroke="#d4c5bb" stroke-width="8"/>
</g>`;

const star = (x: number, y: number, r: number, color: string) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * .43 : r;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  }).join(' ');
  return `<polygon points="${pts}" fill="${color}"/>`;
};

const ARTWORK: Record<string, () => string> = {
  'ivory-tulle-newborn-tutu': () => shell(`
    ${tutu('url(#ivory)', '#f8eadc', 190)}
    ${bow(240, 105, '#d9c0dd', 1.08)}
    <circle cx="240" cy="125" r="23" fill="#bfa1ce"/><circle cx="240" cy="125" r="9" fill="#fff5d7"/>
    <path d="M130 352c77 33 143 33 220 0" fill="none" stroke="#caaea0" stroke-width="5" stroke-linecap="round" opacity=".55"/>
  `, 'Ivory tulle newborn tutu and floral headband'),

  'personalized-dinosaur-birthday-number-shirt': () => shell(shirt(`
    ${numberText('#244c73', '#4c7dad', '3')}
    <path d="M156 240c-32-3-44-36-25-56 15-15 35-7 47 9l25-10-8 25 15 18-31 4c-2 19-9 31-23 37z" fill="#69b857"/>
    <path d="M290 164c42-25 76-11 75 25-1 27-26 42-54 37l-7 20-19-14 5-68z" fill="#ef7b28"/>
    ${nameText('YOUR NAME', '#b5282e')}
  `, '#4c7dad'), 'Personalized dinosaur birthday number shirt'),

  'midnight-ruffle-romper-bow-set': () => shell(`
    ${romper('url(#black)', true)}
    <path d="M151 157c26 34 54 47 89 47s63-13 89-47" fill="none" stroke="#222" stroke-width="28" stroke-dasharray="6 6"/>
    ${bow(240, 70, '#171416', 1.22)}
  `, 'Midnight ruffle romper and bow headband set'),

  'black-lace-back-bow-newborn-romper': () => shell(`
    ${romper('url(#black)', true)}
    <path d="M171 220c-42 28-57 68-37 84 21 17 58-4 88-48M309 220c42 28 57 68 37 84-21 17-58-4-88-48" fill="none" stroke="#191518" stroke-width="24" stroke-linecap="round" stroke-dasharray="5 7"/>
    ${bow(240, 284, '#151215', 1.30)}
    ${bow(240, 68, '#151215', 1.05)}
  `, 'Black lace back bow newborn romper set'),

  'personalized-blue-gingham-first-birthday-shirt': () => shell(shirt(`
    ${numberText('url(#gingham)', '#6ba1ce', '1')}
    ${nameText('YOUR NAME', '#3e6c95')}
  `, '#90bde0'), 'Personalized blue gingham first birthday shirt'),

  'white-lace-heirloom-romper-headband': () => shell(`
    ${romper('url(#ivory)', true)}
    ${bow(240, 285, '#f8f4ef', 1.34)}
    <circle cx="240" cy="304" r="17" fill="#d9c8a5" stroke="#fff" stroke-width="5"/>
    ${bow(240, 68, '#fffdfa', .95)}
    <circle cx="240" cy="84" r="15" fill="#e3d3b4"/>
  `, 'White lace heirloom romper and headband set'),

  'personalized-dinosaur-first-birthday-shirt': () => shell(shirt(`
    ${numberText('#244c73', '#d52b35', '1')}
    <path d="M129 250c35-51 83-56 111-12-20 38-66 51-111 12z" fill="#75b957"/><circle cx="153" cy="232" r="6" fill="#fff"/><circle cx="153" cy="232" r="3" fill="#222"/>
    <path d="M286 193c25-26 66-22 80 8-13 30-53 42-80 15z" fill="#ef8732"/>
    ${nameText('YOUR NAME')}
  `, '#d52b35'), 'Personalized dinosaur first birthday shirt'),

  'personalized-space-first-birthday-shirt': () => shell(shirt(`
    ${numberText('#42285e', '#151521', '1')}
    <circle cx="287" cy="225" r="47" fill="#67c6df"/>
    <ellipse cx="287" cy="225" rx="82" ry="20" fill="none" stroke="#191925" stroke-width="13" transform="rotate(-18 287 225)"/>
    ${star(163, 176, 13, '#e7c85c')}${star(346, 157, 10, '#e7c85c')}${star(357, 278, 9, '#e7c85c')}
    ${nameText('YOUR NAME', '#2c2236')}
  `, '#6b58a5'), 'Personalized space first birthday shirt'),

  'personalized-ladybug-first-birthday-tutu-set': () => shell(`
    <g transform="translate(0 -42)">${shirt(`
      ${numberText('#fff', '#b91f2b', '1')}
      <ellipse cx="304" cy="248" rx="35" ry="48" fill="#d82d39"/><path d="M304 201v94M274 224l61 38M334 224l-61 38" stroke="#151515" stroke-width="7"/><circle cx="304" cy="197" r="17" fill="#151515"/>
      ${nameText('YOUR NAME')}
    `, '#c52b34')}</g>
    ${tutu('url(#red)', '#171417', 310)}
    ${bow(240, 48, '#cf2c36', .9)}
  `, 'Personalized ladybug first birthday tutu set'),

  'newborn-tutu-bow-photo-outfit-color-collection': () => shell(`
    <g transform="translate(-55 -38) scale(.62)">${tutu('#ead7ae', '#c9af76', 190)}${bow(240, 105, '#d9c28e', .9)}</g>
    <g transform="translate(125 -38) scale(.62)">${tutu('#f7f5ef', '#ddd9d1', 190)}${bow(240, 105, '#fff', .9)}</g>
    <g transform="translate(-55 160) scale(.62)">${tutu('#edccd0', '#d8a6ad', 190)}${bow(240, 105, '#e4b9bf', .9)}</g>
    <g transform="translate(125 160) scale(.62)">${tutu('#bfb0e2', '#9988c7', 190)}${bow(240, 105, '#a692d4', .9)}</g>
  `, 'Newborn tutu and bow photo outfit color collection'),

  'personalized-cowboy-birthday-shirt': () => shell(shirt(`
    ${numberText('#bb2029', '#8b1018', '2')}
    <path d="M142 144c38-40 159-40 197 0l-24 29H166z" fill="#6d3a22"/><path d="M162 171h156c15 0 23 16 12 24-35 25-145 25-180 0-11-8-3-24 12-24z" fill="#5b2e1d"/><path d="M174 185h132" stroke="#d9a34b" stroke-width="7"/>
    <path d="M326 264l42 49-42 49-42-49z" fill="#c98b36"/><path d="M326 277v66" stroke="#75461c" stroke-width="6"/>
    ${nameText('YOUR NAME')}
  `, '#9c5f35'), 'Personalized cowboy birthday shirt'),
};

const FALLBACK = () => shell(`${shirt(`${nameText('MY BABY SHIRE')}`, '#d7b9a1')}`, 'MY BABY SHIRE product');

export const getCatalogArtwork = (name: unknown) => {
  const key = String(name || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 100);
  return (ARTWORK[key] || FALLBACK)();
};
