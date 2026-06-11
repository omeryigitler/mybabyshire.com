type BrandLogoVariant = 'header' | 'footer' | 'hero' | 'icon';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

const brandLogoSrc = '/brand/mybabyshire-logo.png.png';
const cubeIconSrc = '/brand/mybabyshire-cube.png.png';

const logoClasses: Record<BrandLogoVariant, string> = {
  header: 'h-[82px] sm:h-[92px] md:h-[104px] lg:h-[112px] w-auto object-contain drop-shadow-[0_8px_16px_rgba(58,37,26,0.08)]',
  footer: 'h-[92px] md:h-[118px] w-auto object-contain drop-shadow-[0_8px_16px_rgba(58,37,26,0.08)]',
  hero: 'h-[210px] sm:h-[260px] md:h-[330px] w-auto object-contain drop-shadow-[0_14px_30px_rgba(58,37,26,0.10)]',
  icon: 'h-[72px] md:h-[92px] w-auto object-contain drop-shadow-[0_8px_16px_rgba(58,37,26,0.08)]',
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
      className={`block select-none ${logoClasses[variant]} ${className}`}
      draggable={false}
      loading="eager"
      decoding="async"
    />
  );
}
