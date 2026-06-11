import type { SVGProps } from 'react';

type BrandLogoVariant = 'header' | 'footer' | 'hero' | 'icon';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

type BabyCubeMarkProps = SVGProps<SVGSVGElement> & {
  title?: string;
  decorative?: boolean;
};

export function BabyCubeMark({
  className = '',
  title = 'My Baby Shire toy cube mark',
  decorative = false,
  ...props
}: BabyCubeMarkProps) {
  return (
    <svg
      viewBox="0 0 180 150"
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {!decorative && <title>{title}</title>}
      <defs>
        <linearGradient id="mybabyshireCubeCream" x1="21" y1="8" x2="158" y2="139" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7ed" />
          <stop offset="0.56" stopColor="#f5dec7" />
          <stop offset="1" stopColor="#d9b893" />
        </linearGradient>
        <linearGradient id="mybabyshireCubeTop" x1="57" y1="16" x2="128" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fffaf3" />
          <stop offset="1" stopColor="#f3d6bd" />
        </linearGradient>
        <linearGradient id="mybabyshireCubePink" x1="30" y1="58" x2="82" y2="132" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8bbb6" />
          <stop offset="1" stopColor="#e99b95" />
        </linearGradient>
        <linearGradient id="mybabyshireCubeBlue" x1="97" y1="55" x2="154" y2="129" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d8edf3" />
          <stop offset="1" stopColor="#9fc9d8" />
        </linearGradient>
        <filter id="mybabyshireCubeShadow" x="0" y="0" width="180" height="150" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#3a251a" floodOpacity="0.16" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#3a251a" floodOpacity="0.12" />
        </filter>
      </defs>

      <g filter="url(#mybabyshireCubeShadow)">
        <path d="M23 52.5L87.5 20.5C92.2 18.2 97.8 18.2 102.5 20.5L157 47.5C163.1 50.5 167 56.7 167 63.5V108.4C167 115.1 163.2 121.2 157.3 124.3L101.7 153.3C96.9 155.8 91.1 155.8 86.3 153.3L22.8 119.8C16.9 116.7 13.2 110.6 13.2 104V68C13.2 61.4 17 55.5 23 52.5Z" fill="url(#mybabyshireCubeCream)" />
        <path d="M44.5 48.7L87.7 28.1C92.3 25.9 97.7 25.9 102.3 28.1L143.1 47.6C148.4 50.1 148.3 57.7 142.9 60L100.9 78C96.5 79.9 91.5 79.9 87.1 78L44.6 59.8C39.4 57.6 39.4 51.1 44.5 48.7Z" fill="url(#mybabyshireCubeTop)" />
        <path d="M27.5 68.2C27.5 63.4 32.5 60.2 36.9 62.2L82.8 82.7C86 84.1 88 87.3 88 90.8V127.6C88 132.5 82.8 135.6 78.5 133.3L32.6 109.4C29.5 107.8 27.5 104.6 27.5 101.1V68.2Z" fill="url(#mybabyshireCubePink)" />
        <path d="M101.5 90.8C101.5 87.4 103.5 84.2 106.6 82.7L150 62.4C154.4 60.3 159.5 63.5 159.5 68.4V101.1C159.5 104.5 157.6 107.6 154.6 109.3L111.2 133.4C106.9 135.8 101.5 132.7 101.5 127.8V90.8Z" fill="url(#mybabyshireCubeBlue)" />
        <path d="M37.5 72.5C37.5 69.4 40.7 67.4 43.5 68.6L74.3 82.4C76.4 83.3 77.7 85.4 77.7 87.7V116.1C77.7 119.2 74.4 121.2 71.7 119.7L40.9 103.8C38.8 102.7 37.5 100.6 37.5 98.2V72.5Z" fill="#f7c2bc" opacity="0.58" />
        <path d="M112.1 87.6C112.1 85.3 113.4 83.2 115.5 82.3L144.1 68.8C146.9 67.5 150.2 69.5 150.2 72.6V98.1C150.2 100.5 148.9 102.7 146.8 103.8L118.1 119.7C115.4 121.2 112.1 119.2 112.1 116.1V87.6Z" fill="#c9e5ed" opacity="0.72" />
        <path d="M95 35L99.6 45L110.5 46.3L102.4 53.6L104.5 64.4L95 58.9L85.5 64.4L87.6 53.6L79.5 46.3L90.4 45L95 35Z" fill="#f2a1a4" />
      </g>

      <text x="56.5" y="107" textAnchor="middle" fontFamily="Nunito, ui-sans-serif, system-ui, sans-serif" fontSize="48" fontWeight="900" fill="#fff8ee" transform="rotate(2 56.5 107)">m</text>
      <text x="131.5" y="106" textAnchor="middle" fontFamily="Nunito, ui-sans-serif, system-ui, sans-serif" fontSize="50" fontWeight="900" fill="#fff8ee" transform="rotate(-2 131.5 106)">y</text>
    </svg>
  );
}

function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`brand-logo-wordmark ${className}`} aria-label="MY BABY SHIRE">
      <span aria-hidden="true">
        MY B<span className="brand-logo-letter-a">A<span className="brand-logo-heart">♥</span></span>BY SHIRE
      </span>
    </span>
  );
}

export function BrandLogo({ variant = 'header', className = '' }: BrandLogoProps) {
  if (variant === 'icon') {
    return <BabyCubeMark className={`block h-auto w-16 ${className}`} />;
  }

  const isFooter = variant === 'footer';
  const isHero = variant === 'hero';

  return (
    <span
      className={`brand-logo inline-flex items-center ${isHero ? 'flex-col gap-3 text-center' : 'gap-2.5 md:gap-3'} ${className}`}
    >
      <BabyCubeMark
        decorative
        className={`brand-logo-mark block h-auto shrink-0 ${
          isHero
            ? 'w-24 md:w-32'
            : isFooter
              ? 'w-[56px] md:w-[70px]'
              : 'w-[42px] sm:w-[48px] md:w-[56px]'
        }`}
      />
      <BrandWordmark
        className={
          isHero
            ? 'text-[28px] sm:text-[38px] md:text-[52px]'
            : isFooter
              ? 'text-[17px] md:text-[21px]'
              : 'text-[16px] sm:text-[19px] md:text-[24px]'
        }
      />
    </span>
  );
}
