type BrandLogoVariant = 'header' | 'footer' | 'hero' | 'icon';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

const brandLogoSrc = '/brand/mybabyshire-logo.png.png';
const cubeIconSrc = '/brand/mybabyshire-cube.png.png';

const logoClasses: Record<BrandLogoVariant, string> = {
  header:
    'h-[150px] sm:h-[165px] md:h-[180px] lg:h-[196px] w-auto object-contain scale-[1.35] origin-center drop-shadow-[0_10px_22px_rgba(58,37,26,0.12)]',
  footer:
    'h-[150px] sm:h-[165px] md:h-[188px] w-auto object-contain scale-[1.22] origin-center drop-shadow-[0_10px_22px_rgba(58,37,26,0.12)]',
  hero:
    'h-[250px] sm:h-[310px] md:h-[390px] w-auto object-contain drop-shadow-[0_16px_34px_rgba(58,37,26,0.12)]',
  icon:
    'h-[92px] md:h-[118px] w-auto object-contain drop-shadow-[0_10px_22px_rgba(58,37,26,0.12)]',
};

export function BabyCubeMark({ className = '' }: { className?: string }) {
  return (
    <img
      src={cubeIconSrc}
      alt="My Baby Shire toy cube"
      className={`block shrink-0 select-none ${className || logoClasses.icon}`}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}

export function BrandLogo({ variant = 'header', className = '' }: BrandLogoProps) {
  if (variant === 'icon') {
    return <BabyCubeMark className={className} />;
  }

  return (
    <img
      src={brandLogoSrc}
      alt="MY BABY SHIRE"
      className={`block shrink-0 select-none ${logoClasses[variant]} ${className}`}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}
