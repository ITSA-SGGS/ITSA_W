import React from 'react';
import { useTheme } from '../hooks/useTheme';
import logoDarkWebp from '../assets/itsa-logo-dark.webp';
import logoDarkSmall from '../assets/itsa-logo-dark-320.webp';
import logoDarkThumb from '../assets/itsa-logo-dark-120.webp';
import logoLightWebp from '../assets/itsa-logo-light.webp';
import logoLightSmall from '../assets/itsa-logo-light-320.webp';
import logoLightThumb from '../assets/itsa-logo-light-120.webp';

interface ItsaLogoProps {
  className?: string;
  alt?: string;
  forceTheme?: 'dark' | 'light';
  size?: 'thumb' | 'default' | 'large';
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export const ItsaLogo: React.FC<ItsaLogoProps> = ({
  className = 'h-8 w-auto object-contain',
  alt = 'ITSA Official Logo',
  forceTheme,
  size = 'default',
  width = 40,
  height = 32,
  loading = 'lazy',
  fetchPriority,
}) => {
  const { theme } = useTheme();
  const activeTheme = forceTheme || theme;
  const isDark = activeTheme === 'dark';

  const defaultSrc = isDark
    ? size === 'thumb'
      ? logoDarkThumb
      : size === 'large'
      ? logoDarkWebp
      : logoDarkSmall
    : size === 'thumb'
    ? logoLightThumb
    : size === 'large'
    ? logoLightWebp
    : logoLightSmall;

  const srcSet = isDark
    ? `${logoDarkThumb} 120w, ${logoDarkSmall} 320w, ${logoDarkWebp} 1402w`
    : `${logoLightThumb} 120w, ${logoLightSmall} 320w, ${logoLightWebp} 1402w`;

  const sizes = size === 'thumb' ? '18px' : size === 'large' ? '80px' : '40px';

  return (
    <img
      src={defaultSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      style={{ aspectRatio: '1402 / 1122' }}
    />
  );
};
