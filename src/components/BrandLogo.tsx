type BrandLogoVariant = 'header' | 'footer' | 'hero' | 'icon';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

const brandLogoSrc = '/brand/mybabyshire-logo.png.png';
const cubeIconSrc = '/brand/mybabyshire-cube.png.png';

const logoClasses: Record<BrandLogoVariant, string> = {
  // The uploaded primary logo is a stacked lockup. It is too tall for the navbar,
  // so the header uses the cube mark as a clean brand anchor.
  header:
    'h-[54px] sm:h-[60px] md:h-[66px] lg:h-[72px] w-auto object-contain drop-shadow-[0_8px_18px_rgba(58,37,26,0.14)]',
  footer:
    'w-[190px] sm:w-[220px] md:w-[260px] h-auto object-contain drop-shadow-[0_10px_22px_rgba(58,37,26,0.12)]',
  hero:
    'w-[360px] sm:w-[460px] md:w-[560px] h-auto object-contain drop-shadow-[0_16px_34px_rgba(58,37,26,0.12)]',
  icon:
    'h-[64px] md:h-[78px] w-auto object-contain drop-shadow-[0_10px_22px_rgba(58,37,26,0.12)]',
};

function LogoImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`block shrink-0 select-none ${className}`}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}

export function BabyCubeMark({ className = '' }: { className?: string }) {
  return (
    <LogoImage
      src={cubeIconSrc}
      alt="My Baby Shire toy cube"
      className={className || logoClasses.icon}
    />
  );
}

export function BrandLogo({ variant = 'header', className = '' }: BrandLogoProps) {
  if (variant === 'header' || variant === 'icon') {
    return (
      <LogoImage
        src={cubeIconSrc}
        alt="My Baby Shire"
        className={`${logoClasses[variant]} ${className}`}
      />
    );
  }

  return (
    <LogoImage
      src={brandLogoSrc}
      alt="MY BABY SHIRE"
      className={`${logoClasses[variant]} ${className}`}
    />
  );
}
