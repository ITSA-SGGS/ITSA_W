import React from 'react';
import { useTheme } from '../hooks/useTheme';
import logoDark from '../assets/itsa-logo-dark.png';
import logoLight from '../assets/itsa-logo-light.png';

interface ItsaLogoProps {
  className?: string;
  alt?: string;
  forceTheme?: 'dark' | 'light';
}

export const ItsaLogo: React.FC<ItsaLogoProps> = ({
  className = 'h-8 w-auto object-contain',
  alt = 'ITSA Official Logo',
  forceTheme,
}) => {
  const { theme } = useTheme();
  const activeTheme = forceTheme || theme;
  const isDark = activeTheme === 'dark';

  return (
    <img
      src={isDark ? logoDark : logoLight}
      alt={alt}
      className={className}
      loading="eager"
    />
  );
};
