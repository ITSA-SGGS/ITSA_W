import React, { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface StreamItem {
  text: string;
  isToken: boolean;
  colorType: 'highlight' | 'primary' | 'secondary' | 'dim';
}

interface MatrixColumn {
  x: number;
  y: number;
  speed: number;
  fontSize: number;
  lineHeight: number;
  items: StreamItem[];
  baseOpacity: number;
  changeInterval: number;
  lastChange: number;
}

// Technical character glyphs & systems tokens
const SINGLE_GLYPHS = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'Z',
  'a', 'b', 'c', 'd', 'e', 'f', 'x', 'y', 'z',
  '$', '#', '/', '_', ':', '.', '~', '[', ']', '<', '>',
  '-', '+', '*', '%', '&', '|', '^', '!', '?', '=', ';',
  '{', '}', '(', ')', '@'
];

const TECHNICAL_TOKENS = [
  '0x7F', '0x4A', '0x00', '0xFF', '0x1A', '0x9C', '0xC0', '0x8D', '0xE2', '0x3B',
  'core', 'x86', 'sys', 'eBPF', 'gcc', 'ptr', 'void', 'NULL', 'init', 'byte',
  '0101', '1010', 'main', 'asm', 'sync', 'net', 'reg', 'lock', 'dev', 'i32',
  'u64', 'buf', 'vec', '0xDE', '0xAD', '0xBE', '0xEF', '0xCA', '0xFE', '0xBA', '0xBE',
  '::', '->', '=>', '01', '10', '11', '00', '>>', '<<', '0x01'
];

const getRandomGlyph = (): StreamItem => {
  const isToken = Math.random() < 0.22;
  const text = isToken
    ? TECHNICAL_TOKENS[Math.floor(Math.random() * TECHNICAL_TOKENS.length)]
    : SINGLE_GLYPHS[Math.floor(Math.random() * SINGLE_GLYPHS.length)];

  const rand = Math.random();
  let colorType: 'highlight' | 'primary' | 'secondary' | 'dim' = 'secondary';
  if (rand < 0.12) colorType = 'highlight';
  else if (rand < 0.45) colorType = 'primary';
  else if (rand < 0.75) colorType = 'secondary';
  else colorType = 'dim';

  return { text, isToken, colorType };
};

export const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const themeProgressRef = useRef(theme === 'dark' ? 1 : 0);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let frameCount = 0;
    let isVisible = true;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = mediaQuery.matches;
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleReducedMotionChange);

    // Track intersection to pause when scrolled away
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const columns: MatrixColumn[] = [];

    const initColumns = () => {
      columns.length = 0;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;

      // Start X: right side concentration
      // Desktop: from 38% to 100%
      // Tablet: from 42% to 100%
      // Mobile: from 48% to 100%
      const startXRatio = isMobile ? 0.48 : isTablet ? 0.42 : 0.38;
      const startX = width * startXRatio;
      const availableWidth = width - startX;

      // Column spacing: dense packing on the right
      const colSpacing = isMobile ? 20 : isTablet ? 22 : 20;
      const colCount = Math.max(6, Math.floor(availableWidth / colSpacing));

      for (let i = 0; i < colCount; i++) {
        const x = startX + i * colSpacing + (Math.random() * 4 - 2);
        const fontSize = isMobile ? 11 : Math.floor(Math.random() * 3) + 12; // 12-14px
        const lineHeight = fontSize + (isMobile ? 5 : 6);
        const itemCount = Math.ceil(height / lineHeight) + 8;

        const items: StreamItem[] = [];
        for (let j = 0; j < itemCount; j++) {
          items.push(getRandomGlyph());
        }

        columns.push({
          x,
          y: (Math.random() * height) - height * 0.5,
          speed: 0.35 + Math.random() * 0.75, // organic varied speeds
          fontSize,
          lineHeight,
          items,
          baseOpacity: 0.8 + Math.random() * 0.2,
          changeInterval: Math.floor(Math.random() * 6) + 4,
          lastChange: 0,
        });
      }
    };

    const resize = () => {
      if (!canvas || !container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initColumns();
    };

    resize();
    window.addEventListener('resize', resize);

    // Color definitions (RGB vectors for smooth lerp transitions)
    const darkColorsRGB: Record<StreamItem['colorType'], [number, number, number]> = {
      highlight: [224, 242, 254], // Luminous cyan-white (#E0F2FE)
      primary: [56, 189, 248],    // Electric cyan/blue (#38BDF8)
      secondary: [0, 114, 206],   // Official ITSA blue (#0072CE)
      dim: [100, 116, 139],       // Cool tech slate (#64748B)
    };

    const lightColorsRGB: Record<StreamItem['colorType'], [number, number, number]> = {
      highlight: [0, 114, 206],   // Official ITSA blue (#0072CE)
      primary: [2, 132, 199],     // Rich blue (#0284C7)
      secondary: [30, 64, 175],   // Deep cobalt/navy (#1E40AF)
      dim: [71, 85, 105],         // Crisp graphite slate (#475569)
    };

    const getInterpolatedColor = (type: StreamItem['colorType'], t: number) => {
      const cLight = lightColorsRGB[type];
      const cDark = darkColorsRGB[type];
      const r = Math.round(cLight[0] + (cDark[0] - cLight[0]) * t);
      const g = Math.round(cLight[1] + (cDark[1] - cLight[1]) * t);
      const b = Math.round(cLight[2] + (cDark[2] - cLight[2]) * t);
      return `rgb(${r}, ${g}, ${b})`;
    };

    // Render loop
    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      // Pause when tab hidden or hero not in viewport
      if (document.hidden || !isVisible) return;

      frameCount++;

      // Smooth theme color interpolation
      const targetThemeProgress = themeRef.current === 'dark' ? 1 : 0;
      themeProgressRef.current += (targetThemeProgress - themeProgressRef.current) * 0.08;
      const t = themeProgressRef.current;

      const currentColors = {
        highlight: getInterpolatedColor('highlight', t),
        primary: getInterpolatedColor('primary', t),
        secondary: getInterpolatedColor('secondary', t),
        dim: getInterpolatedColor('dim', t),
      };

      // Canvas background is strictly 100% transparent - NO background fill, NO vignette gradient
      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 768;
      const startXRatio = isMobile ? 0.48 : 0.38;
      const activeWidth = width * (1 - startXRatio);

      if (reducedMotion) {
        // Single static snapshot for reduced motion
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (const col of columns) {
          const progress = Math.max(0, Math.min(1, (col.x - width * startXRatio) / activeWidth));
          const horizontalFade = Math.pow(progress, isMobile ? 1.15 : 1.25);
          if (horizontalFade <= 0.01) continue;

          ctx.font = `${col.fontSize}px "JetBrains Mono", monospace`;

          for (let i = 0; i < col.items.length; i++) {
            const item = col.items[i];
            const itemY = i * col.lineHeight;
            if (itemY < 0 || itemY > height) continue;

            const charAlpha = horizontalFade * (item.colorType === 'highlight' ? 0.95 : item.colorType === 'dim' ? 0.52 : 0.85);
            ctx.fillStyle = currentColors[item.colorType];
            ctx.globalAlpha = Math.min(1, charAlpha);
            ctx.fillText(item.text, col.x, itemY);
          }
        }
        return;
      }

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];

        // Horizontal Opacity Curve (fading only the characters from left to right)
        // Left (0-38%): 0%
        // Center (38-60%): 20-45%
        // Right (60-100%): 65-100%
        const progress = Math.max(0, Math.min(1, (col.x - width * startXRatio) / activeWidth));
        const horizontalFade = Math.pow(progress, isMobile ? 1.15 : 1.25);

        if (horizontalFade <= 0.01) continue;

        ctx.font = `${col.fontSize}px "JetBrains Mono", monospace`;

        const totalColHeight = col.items.length * col.lineHeight;

        for (let i = 0; i < col.items.length; i++) {
          const item = col.items[i];
          let itemY = col.y + i * col.lineHeight;

          // Wrap individual characters cleanly across the canvas height
          while (itemY < -col.lineHeight * 2) {
            itemY += totalColHeight;
          }
          while (itemY > height + col.lineHeight) {
            itemY -= totalColHeight;
          }

          if (itemY < -col.lineHeight || itemY > height + col.lineHeight) continue;

          // Character opacity calculation
          let baseItemAlpha = 0.82;
          if (item.colorType === 'highlight') baseItemAlpha = 1.0;
          else if (item.colorType === 'primary') baseItemAlpha = 0.90;
          else if (item.colorType === 'dim') baseItemAlpha = 0.55;

          const themeMultiplier = 0.85 + 0.15 * t; // 0.85 in light mode, 1.0 in dark mode
          const finalAlpha = Math.max(0, Math.min(1, baseItemAlpha * col.baseOpacity * horizontalFade * themeMultiplier));

          ctx.fillStyle = currentColors[item.colorType];
          ctx.globalAlpha = finalAlpha;
          ctx.fillText(item.text, col.x, itemY);
        }

        // Vertical movement
        col.y += col.speed;
        if (col.y > totalColHeight) {
          col.y -= totalColHeight;
        }

        // Randomly mutate characters to simulate active systems computation
        if (frameCount - col.lastChange >= col.changeInterval) {
          col.lastChange = frameCount;
          const randIdx = Math.floor(Math.random() * col.items.length);
          col.items[randIdx] = getRandomGlyph();
        }
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-transparent"
      />
    </div>
  );
};
