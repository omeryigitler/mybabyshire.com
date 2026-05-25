import React from 'react';
import {
  CardDesign,
  DEFAULT_CARD_DESIGN,
  getCardColor,
  isCardDesignValue,
  parseCardDesign,
} from '../utils/cardDesign';

const DEFAULT_LEGACY_BACKGROUND = '/product-card-cloud-blue.png';

const CLOUD_PATHS: Record<CardDesign['cloud'], string> = {
  classic:
    'M96 166c11-37 47-61 92-55 20-41 72-62 117-31 29-35 86-35 117 1 42-7 84 17 94 59 38 14 60 48 52 84 24 18 30 47 14 72-17 28-53 40-91 31-24 36-81 45-124 23-35 31-98 31-133-2-44 24-103 12-123-27-39 6-77-11-91-43-13-29-2-65 25-83-5-21 14-42 51-29z',
  cuddle:
    'M83 182c6-43 47-75 95-69 25-44 86-58 126-25 31-35 91-30 114 12 49-8 93 26 94 77 42 9 70 43 65 82-5 41-44 72-91 70-27 35-86 44-130 17-43 33-108 27-139-9-49 19-105-3-120-47-43-1-76-29-78-65-1-24 13-40 64-43z',
  drift:
    'M93 188c20-39 61-58 107-47 20-34 69-55 112-28 32-31 92-23 117 15 44-1 80 28 84 68 42 12 68 42 67 75-1 42-41 73-91 70-37 28-91 34-136 10-43 31-111 26-144-10-47 13-97-1-121-34-47 4-86-18-93-51-5-26 12-54 44-67 15-6 34-8 54-1z',
};

const ROUNDED_PANEL_PATH =
  'M160 140h257c32 0 58 26 58 58v48c0 32-26 58-58 58H160c-32 0-58-26-58-58v-48c0-32 26-58 58-58z';

const WAVY_PANEL_PATH =
  'M137 156c49-16 96 2 143-9 50-12 105 1 151 8 29 4 45 30 40 62 8 36-13 66-45 73-50 11-96-6-144 2-54 9-106 1-151-11-28-8-39-36-31-68-8-28 8-49 37-57z';

type CardDesignFrameProps = {
  value?: string | null;
  design?: CardDesign;
  className?: string;
  legacyClassName?: string;
  title?: string;
};

export const CardDesignFrame = ({
  value,
  design,
  className = '',
  legacyClassName,
  title,
}: CardDesignFrameProps) => {
  const parsedDesign = design || parseCardDesign(value) || DEFAULT_CARD_DESIGN;
  const color = getCardColor(parsedDesign.color);
  const id = React.useId().replace(/:/g, '');
  const cloudGradientId = `cloudGlow${id}`;
  const edgeGradientId = `edge${id}`;
  const panelGradientId = `panelFill${id}`;
  const filterId = `cloudShadow${id}`;
  const panelPath = parsedDesign.panel === 'wavy' ? WAVY_PANEL_PATH : ROUNDED_PANEL_PATH;

  if (value && !isCardDesignValue(value) && !design) {
    return (
      <img
        src={value || DEFAULT_LEGACY_BACKGROUND}
        className={legacyClassName || className}
        alt={title || ''}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 577 433"
      preserveAspectRatio="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <filter id={filterId} x="-15%" y="-18%" width="130%" height="145%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="12" stdDeviation="15" floodColor={color.shadow} floodOpacity="0.19" />
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#5a4234" floodOpacity="0.08" />
        </filter>
        <radialGradient id={cloudGradientId} cx="50%" cy="30%" r="68%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#fbfdff" />
          <stop offset="1" stopColor="#eef4ff" />
        </radialGradient>
        <linearGradient id={edgeGradientId} x1="74" y1="92" x2="500" y2="346" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color.edge} />
          <stop offset="0.55" stopColor="#eef5ff" />
          <stop offset="1" stopColor={color.edge} />
        </linearGradient>
        <linearGradient id={panelGradientId} x1="104" y1="138" x2="472" y2="304" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color.fill} />
          <stop offset="0.52" stopColor={color.fill} />
          <stop offset="1" stopColor="#fff9fb" />
        </linearGradient>
      </defs>
      <g filter={`url(#${filterId})`}>
        <path
          d={CLOUD_PATHS[parsedDesign.cloud]}
          fill={`url(#${cloudGradientId})`}
          stroke={`url(#${edgeGradientId})`}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path
          d="M134 151c23-26 68-34 104-19-38 2-73 17-94 47-3-9-6-18-10-28z"
          fill="#ffffff"
          opacity="0.58"
        />
        <path d={panelPath} fill={`url(#${panelGradientId})`} opacity="0.92" />
        <path d={panelPath} fill="none" stroke="#ffffff" strokeWidth="5" opacity="0.35" />
      </g>
    </svg>
  );
};
