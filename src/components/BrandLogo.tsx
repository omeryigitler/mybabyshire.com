import type { ImgHTMLAttributes } from 'react';

type BrandLogoVariant = 'header' | 'footer' | 'hero' | 'icon' | 'login' | 'nav';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

type BabyCubeMarkProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  decorative?: boolean;
  title?: string;
};

const brandLogoSrc = '/brand/mybabyshire-logo.png.png';
const cubeIconSrc = '/brand/mybabyshire-cube.png.png';
const headerLogoSrc = '/brand/mybabyshire-header-horizontal-logo_2x-removebg-preview.png';

const logoClasses: Record<BrandLogoVariant, string> = {
  header:
    'h-[48px] sm:h-[64px] md:h-[82px] lg:h-[90px] w-auto max-w-[min(68vw,540px)] object-contain translate-y-1 md:translate-y-2 drop-shadow-[0_8px_18px_rgba(58,37,26,0.12)]',
  footer:
    'w-[170px] sm:w-[200px] md:w-[230px] h-auto object-contain drop-shadow-[0_8px_18px_rgba(58,37,26,0.10)]',
  hero:
    'w-[360px] sm:w-[460px] md:w-[560px] h-auto object-contain drop-shadow-[0_16px_34px_rgba(58,37,26,0.12)]',
  icon:
    'h-[54px] md:h-[68px] w-auto object-contain drop-shadow-[0_10px_22px_rgba(58,37,26,0.12)]',
  login:
    'h-[58px] sm:h-[68px] md:h-[78px] w-auto max-w-[min(76vw,390px)] object-contain translate-y-0 drop-shadow-[0_12px_24px_rgba(58,37,26,0.14)]',
  nav:
    'h-[40px] sm:h-[54px] md:h-[64px] w-auto max-w-[min(48vw,390px)] object-contain translate-y-0 drop-shadow-[0_8px_18px_rgba(58,37,26,0.12)]',
};

function LogoImage({
  src,
  alt,
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
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
      {...props}
    />
  );
}

export function BabyCubeMark({
  className = '',
  decorative = false,
  title = 'My Baby Shire toy cube',
  ...props
}: BabyCubeMarkProps) {
  return (
    <LogoImage
      src={cubeIconSrc}
      alt={decorative ? '' : title}
      aria-hidden={decorative ? true : undefined}
      className={className || logoClasses.icon}
      {...props}
    />
  );
}

export function BrandLogo({ variant = 'header', className = '' }: BrandLogoProps) {
  if (variant === 'header' || variant === 'login' || variant === 'nav') {
    return (
      <LogoImage
        src={headerLogoSrc}
        alt="MY BABY SHIRE"
        className={`${logoClasses[variant]} ${className}`}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <LogoImage
        src={cubeIconSrc}
        alt="My Baby Shire"
        className={`${logoClasses.icon} ${className}`}
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
