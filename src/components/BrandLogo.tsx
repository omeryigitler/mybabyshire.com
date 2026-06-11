type BrandLogoVariant = 'header' | 'footer' | 'hero' | 'icon';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

const brandLogoSrc = '/brand/mybabyshire-logo.png';
const cubeIconSrc = '/brand/mybabyshire-cube.png';

const logoClasses: Record<BrandLogoVariant, string> = {
  header: 'h-[46px] sm:h-[54px] md:h-[66px] w-auto object-contain',
  footer: 'h-[58px] md:h-[72px] w-auto object-contain',
  hero: 'h-[170px] sm:h-[210px] md:h-[260px] w-auto object-contain',
  icon: 'h-[54px] md:h-[68px] w-auto object-contain',
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
