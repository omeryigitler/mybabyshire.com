export type CardCloudShapeId = 'classic' | 'cuddle' | 'drift';
export type CardPanelShapeId = 'rounded' | 'wavy';
export type CardColorId = 'blue' | 'peach' | 'mint' | 'lavender' | 'butter' | 'rose';

export type CardDesign = {
  cloud: CardCloudShapeId;
  panel: CardPanelShapeId;
  color: CardColorId;
};

export const CARD_DESIGN_PREFIX = 'card-design:';

export const CARD_CLOUD_SHAPES: Array<{ id: CardCloudShapeId; label: string }> = [
  { id: 'classic', label: 'Classic' },
  { id: 'cuddle', label: 'Cuddle' },
  { id: 'drift', label: 'Drift' },
];

export const CARD_PANEL_SHAPES: Array<{ id: CardPanelShapeId; label: string }> = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'wavy', label: 'Wavy' },
];

export const CARD_COLORS: Array<{
  id: CardColorId;
  label: string;
  fill: string;
  edge: string;
  shadow: string;
}> = [
  { id: 'blue', label: 'Blue', fill: '#dceaff', edge: '#b7d3f4', shadow: '#8fb5dc' },
  { id: 'peach', label: 'Peach', fill: '#f8dfd1', edge: '#efc9b7', shadow: '#d9a996' },
  { id: 'mint', label: 'Mint', fill: '#dceee8', edge: '#bfded4', shadow: '#94c4b4' },
  { id: 'lavender', label: 'Lavender', fill: '#e7e0ff', edge: '#cbc0f2', shadow: '#9c8ad1' },
  { id: 'butter', label: 'Butter', fill: '#fff0bf', edge: '#e7cb72', shadow: '#d3ad45' },
  { id: 'rose', label: 'Rose', fill: '#ffdce6', edge: '#eeb4c4', shadow: '#d58ca2' },
];

export const DEFAULT_CARD_DESIGN: CardDesign = {
  cloud: 'classic',
  panel: 'rounded',
  color: 'blue',
};

const isCloudShapeId = (value: string): value is CardCloudShapeId =>
  CARD_CLOUD_SHAPES.some((shape) => shape.id === value);

const isPanelShapeId = (value: string): value is CardPanelShapeId =>
  CARD_PANEL_SHAPES.some((shape) => shape.id === value);

const isColorId = (value: string): value is CardColorId =>
  CARD_COLORS.some((color) => color.id === value);

export const encodeCardDesign = (design: CardDesign) =>
  `${CARD_DESIGN_PREFIX}${design.cloud}:${design.panel}:${design.color}`;

export const isCardDesignValue = (value?: string | null) =>
  Boolean(value?.startsWith(CARD_DESIGN_PREFIX));

export const parseCardDesign = (value?: string | null): CardDesign => {
  if (value?.startsWith(CARD_DESIGN_PREFIX)) {
    const [, cloud, panel, color] = value.split(':');
    return {
      cloud: isCloudShapeId(cloud) ? cloud : DEFAULT_CARD_DESIGN.cloud,
      panel: isPanelShapeId(panel) ? panel : DEFAULT_CARD_DESIGN.panel,
      color: isColorId(color) ? color : DEFAULT_CARD_DESIGN.color,
    };
  }

  const normalizedValue = String(value || '').toLowerCase();
  const legacyColor = CARD_COLORS.find((color) => normalizedValue.includes(color.id));

  return {
    ...DEFAULT_CARD_DESIGN,
    color: legacyColor?.id || DEFAULT_CARD_DESIGN.color,
  };
};

export const getCardColor = (colorId: CardColorId) =>
  CARD_COLORS.find((color) => color.id === colorId) || CARD_COLORS[0];

export const getCardCloudShape = (cloudId: CardCloudShapeId) =>
  CARD_CLOUD_SHAPES.find((shape) => shape.id === cloudId) || CARD_CLOUD_SHAPES[0];

export const getCardPanelShape = (panelId: CardPanelShapeId) =>
  CARD_PANEL_SHAPES.find((shape) => shape.id === panelId) || CARD_PANEL_SHAPES[0];

export const buildCardColorVariants = (cloud: CardCloudShapeId, panel: CardPanelShapeId) =>
  CARD_COLORS.map((color) => ({
    label: color.label,
    image: encodeCardDesign({ cloud, panel, color: color.id }),
  }));
