type BrandLogoVariant = 'header' | 'footer' | 'hero' | 'icon';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

const logoSizes: Record<BrandLogoVariant, { mark: string; word: string; gap: string }> = {
  header: {
    mark: 'w-[64px] h-[58px] sm:w-[74px] sm:h-[66px] md:w-[88px] md:h-[78px]',
    word: 'text-[20px] sm:text-[24px] md:text-[31px]',
    gap: 'gap-3 md:gap-4',
  },
  footer: {
    mark: 'w-[54px] h-[48px] md:w-[66px] md:h-[58px]',
    word: 'text-[17px] md:text-[21px]',
    gap: 'gap-3',
  },
  hero: {
    mark: 'w-[118px] h-[104px] md:w-[150px] md:h-[132px]',
    word: 'text-[34px] sm:text-[44px] md:text-[58px]',
    gap: 'gap-5',
  },
  icon: {
    mark: 'w-[72px] h-[64px] md:w-[86px] md:h-[76px]',
    word: '',
    gap: '',
  },
};

export function BabyCubeMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative inline-block shrink-0 select-none ${className}`}
      aria-label="My Baby Shire toy cube mark"
      role="img"
      style={{ perspective: '520px' }}
    >
      <span
        className="absolute inset-[3%] block rounded-[28%]"
        style={{
          background: 'linear-gradient(145deg, #fff6ec 0%, #f2d6bd 58%, #d4aa83 100%)',
          boxShadow: '0 10px 18px rgba(58, 37, 26, 0.16), inset 0 2px 3px rgba(255,255,255,0.82)',
          transform: 'rotateX(10deg) rotateY(-18deg) rotateZ(-7deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        <span
          className="absolute left-[10%] top-[27%] flex h-[55%] w-[39%] items-center justify-center rounded-[22%] lowercase"
          style={{
            background: 'linear-gradient(155deg, #f8b9b3 0%, #e89a94 100%)',
            color: '#fff8ee',
            fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif',
            fontWeight: 900,
            fontSize: '55%',
            lineHeight: 1,
            textShadow: '0 2px 3px rgba(123, 72, 65, 0.18)',
            boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(148,78,70,0.16)',
          }}
        >
          m
        </span>
        <span
          className="absolute right-[10%] top-[28%] flex h-[55%] w-[39%] items-center justify-center rounded-[22%] lowercase"
          style={{
            background: 'linear-gradient(155deg, #d7edf3 0%, #9fcbd9 100%)',
            color: '#fff8ee',
            fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif',
            fontWeight: 900,
            fontSize: '57%',
            lineHeight: 1,
            textShadow: '0 2px 3px rgba(68, 104, 118, 0.18)',
            boxShadow: 'inset 0 2px 2px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(68,104,118,0.16)',
          }}
        >
          y
        </span>
        <span
          className="absolute left-1/2 top-[7%] h-[17%] w-[17%] -translate-x-1/2"
          style={{
            background: '#f4a1a5',
            clipPath: 'polygon(50% 0%, 62% 34%, 98% 35%, 69% 56%, 80% 91%, 50% 70%, 20% 91%, 31% 56%, 2% 35%, 38% 34%)',
            filter: 'drop-shadow(0 1px 1px rgba(123,72,65,0.18))',
          }}
        />
      </span>
    </span>
  );
}

function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap uppercase leading-none ${className}`}
      aria-label="MY BABY SHIRE"
      style={{
        color: '#243452',
        fontFamily: 'Nunito, ui-sans-serif, system-ui, sans-serif',
        fontWeight: 900,
        letterSpacing: '0.16em',
        textShadow: '0 1px 0 rgba(255, 255, 255, 0.92)',
      }}
    >
      <span aria-hidden="true">
        MY B
        <span className="relative inline-block">
          A
          <span
            className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 leading-none"
            style={{ color: '#f4a1a5', fontSize: '0.34em', letterSpacing: 0, textShadow: 'none' }}
          >
            ♥
          </span>
        </span>
        BY SHIRE
      </span>
    </span>
  );
}

export function BrandLogo({ variant = 'header', className = '' }: BrandLogoProps) {
  const size = logoSizes[variant];

  if (variant === 'icon') {
    return <BabyCubeMark className={`${size.mark} ${className}`} />;
  }

  return (
    <span className={`inline-flex items-center ${size.gap} ${className}`}>
      <BabyCubeMark className={size.mark} />
      <BrandWordmark className={size.word} />
    </span>
  );
}
