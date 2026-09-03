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

interface SignalTarget {
  active: boolean;
  colIdx: number;
  itemIdx: number;
  x: number;
  y: number;
  text: string;
  spawnTime: number;
  lifespan: number;
  pulsePhase: number;
}

interface RippleWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
}

interface FeedbackToast {
  x: number;
  y: number;
  text: string;
  subtext: string;
  duration: number;
  startTime: number;
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

const SIGNAL_GLYPHS = ['0x7F', '0x4A', '0xFF', '[#]', '::', '0101', 'core', 'sys', '<>', '0x01'];

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

    // Cursor / Pointer tracking for organic magnetic field
    const pointer = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      active: false,
      intensity: 0,
    };

    // Signal Easter Egg & Pulse Waves
    const signal: SignalTarget = {
      active: false,
      colIdx: 0,
      itemIdx: 0,
      x: -9999,
      y: -9999,
      text: '0x7F',
      spawnTime: 0,
      lifespan: 10000,
      pulsePhase: 0,
    };

    let nextSignalSpawnTime = performance.now() + 5000;
    const ripples: RippleWave[] = [];
    const feedbacks: FeedbackToast[] = [];

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = e.clientX - rect.left;
      pointer.targetY = e.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        pointer.targetX = touch.clientX - rect.left;
        pointer.targetY = touch.clientY - rect.top;
        pointer.active = true;
      }
    };

    const handleTouchEnd = () => {
      pointer.active = false;
    };

    const handleInteractionClick = (clientX: number, clientY: number) => {
      if (reducedMotion) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;
      const now = performance.now();
      const isMobile = width < 768;

      if (signal.active) {
        const distToSignal = Math.hypot(clickX - signal.x, clickY - signal.y);
        const hitRadius = isMobile ? 44 : 34;

        if (distToSignal < hitRadius) {
          // Trigger expanding shockwave from the captured signal
          ripples.push({
            x: signal.x,
            y: signal.y,
            radius: 6,
            maxRadius: isMobile ? 180 : 240,
            speed: 5.5,
            alpha: 1.0,
          });

          // Show subtle technical toast
          feedbacks.push({
            x: Math.max(70, Math.min(width - 80, signal.x)),
            y: Math.max(40, signal.y - 16),
            text: '> SIGNAL ACQUIRED',
            subtext: '+01',
            duration: 1800,
            startTime: now,
          });

          signal.active = false;
          nextSignalSpawnTime = now + 7000 + Math.random() * 5000;
          return;
        }
      }

      // Subtle ambient micro-pulse on ambient click in the character field
      if (clickX > width * 0.4) {
        ripples.push({
          x: clickX,
          y: clickY,
          radius: 4,
          maxRadius: isMobile ? 80 : 120,
          speed: 4.2,
          alpha: 0.35,
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      handleInteractionClick(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        pointer.targetX = touch.clientX - rect.left;
        pointer.targetY = touch.clientY - rect.top;
        pointer.active = true;
        handleInteractionClick(touch.clientX, touch.clientY);
      }
    };

    // Attach listeners to window/container so hero background interactions flow seamlessly
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('click', handleClick);
    container.addEventListener('mouseleave', handlePointerLeave);

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

      const now = performance.now();
      frameCount++;

      // Smooth pointer position lerp (spring follow for fluid field bending)
      if (pointer.active) {
        pointer.x += (pointer.targetX - pointer.x) * 0.16;
        pointer.y += (pointer.targetY - pointer.y) * 0.16;
        pointer.intensity = Math.min(1, pointer.intensity + 0.08);
      } else {
        pointer.intensity = Math.max(0, pointer.intensity - 0.05);
      }

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

      // Manage Signal Spawning (Easter Egg)
      if (!reducedMotion && columns.length > 0) {
        if (!signal.active && now > nextSignalSpawnTime) {
          // Select a column located in the active right 50%
          const minCol = Math.floor(columns.length * 0.4);
          const randCol = Math.floor(minCol + Math.random() * (columns.length - minCol));
          const targetCol = columns[randCol];

          if (targetCol && targetCol.items.length > 0) {
            const randItem = Math.floor(Math.random() * Math.min(20, targetCol.items.length));
            signal.active = true;
            signal.colIdx = randCol;
            signal.itemIdx = randItem;
            signal.text = SIGNAL_GLYPHS[Math.floor(Math.random() * SIGNAL_GLYPHS.length)];
            signal.spawnTime = now;
            signal.lifespan = 8000 + Math.random() * 4000;
            signal.pulsePhase = 0;
          }
        } else if (signal.active) {
          signal.pulsePhase += 0.07;
          if (now - signal.spawnTime > signal.lifespan) {
            signal.active = false;
            nextSignalSpawnTime = now + 6000 + Math.random() * 6000;
          }
        }
      }

      // Update propagating shockwave ripples
      for (let r = ripples.length - 1; r >= 0; r--) {
        const wave = ripples[r];
        wave.radius += wave.speed;
        wave.alpha -= 0.022;
        if (wave.alpha <= 0 || wave.radius >= wave.maxRadius) {
          ripples.splice(r, 1);
        }
      }

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

      const influenceRadius = isMobile ? 85 : 130;
      const maxDisplacement = isMobile ? 14 : 24;

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

          // Compute Magnetic Cursor Repulsion & Proximity Brightness
          let offsetX = 0;
          let offsetY = 0;
          let proximityBoost = 0;

          if (pointer.intensity > 0.01) {
            const dx = col.x - pointer.x;
            const dy = itemY - pointer.y;
            const dist = Math.hypot(dx, dy);

            if (dist < influenceRadius && dist > 0.5) {
              const norm = 1 - dist / influenceRadius;
              const force = Math.pow(norm, 1.5) * pointer.intensity;
              const angle = Math.atan2(dy, dx);

              offsetX = Math.cos(angle) * force * maxDisplacement;
              offsetY = Math.sin(angle) * force * (maxDisplacement * 0.5);
              proximityBoost = force * 0.4;
            }
          }

          // Apply Shockwave Ripple Influences
          for (let r = 0; r < ripples.length; r++) {
            const wave = ripples[r];
            const wDist = Math.hypot(col.x - wave.x, itemY - wave.y);
            const wDiff = Math.abs(wDist - wave.radius);

            if (wDiff < 32) {
              const wForce = (1 - wDiff / 32) * wave.alpha;
              const wAngle = Math.atan2(itemY - wave.y, col.x - wave.x);
              offsetX += Math.cos(wAngle) * wForce * 9;
              offsetY += Math.sin(wAngle) * wForce * 5;
              proximityBoost += wForce * 0.5;
            }
          }

          const renderX = col.x + offsetX;
          const renderY = itemY + offsetY;

          // Check if this node is the active Signal Target
          const isCurrentSignal = signal.active && signal.colIdx === c && signal.itemIdx === i;
          let itemText = item.text;
          let itemColor = currentColors[item.colorType];

          if (isCurrentSignal) {
            signal.x = renderX;
            signal.y = renderY;
            itemText = signal.text;
            itemColor = currentColors.highlight;
            proximityBoost += 0.45 + 0.15 * Math.sin(signal.pulsePhase);
          }

          // Character opacity calculation
          let baseItemAlpha = 0.82;
          if (item.colorType === 'highlight') baseItemAlpha = 1.0;
          else if (item.colorType === 'primary') baseItemAlpha = 0.90;
          else if (item.colorType === 'dim') baseItemAlpha = 0.55;

          const themeMultiplier = 0.85 + 0.15 * t; // 0.85 in light mode, 1.0 in dark mode
          const finalAlpha = Math.max(
            0,
            Math.min(1, (baseItemAlpha + proximityBoost) * col.baseOpacity * horizontalFade * themeMultiplier)
          );

          ctx.fillStyle = itemColor;
          ctx.globalAlpha = finalAlpha;
          ctx.fillText(itemText, renderX, renderY);

          // Render subtle pulsing bracket tag on active Signal
          if (isCurrentSignal) {
            const pulseGlow = (Math.sin(signal.pulsePhase) + 1) * 0.5;
            ctx.strokeStyle = currentColors.highlight;
            ctx.lineWidth = 1;
            ctx.globalAlpha = Math.min(1, 0.4 + pulseGlow * 0.5);
            ctx.strokeRect(renderX - 3, renderY - 1, col.fontSize * (itemText.length > 2 ? 2.5 : 1.4), col.fontSize + 2);
          }
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

      // Render Temporary Signal Feedback Toasts
      for (let f = feedbacks.length - 1; f >= 0; f--) {
        const fb = feedbacks[f];
        const elapsed = now - fb.startTime;

        if (elapsed > fb.duration) {
          feedbacks.splice(f, 1);
          continue;
        }

        // Fade in (0-200ms) -> Hold (200-1200ms) -> Fade out (1200-1800ms)
        let fbAlpha = 1;
        if (elapsed < 200) {
          fbAlpha = elapsed / 200;
        } else if (elapsed > 1200) {
          fbAlpha = 1 - (elapsed - 1200) / (fb.duration - 1200);
        }

        const driftY = (elapsed / fb.duration) * 12;
        const toastX = fb.x;
        const toastY = fb.y - driftY;

        ctx.font = '10px "JetBrains Mono", monospace';
        const label = `${fb.text} · ${fb.subtext}`;
        const textWidth = ctx.measureText(label).width;

        // Subtle translucent capsule backing
        ctx.fillStyle = t > 0.5 ? 'rgba(5, 5, 8, 0.85)' : 'rgba(245, 245, 242, 0.9)';
        ctx.strokeStyle = currentColors.primary;
        ctx.lineWidth = 1;
        ctx.globalAlpha = fbAlpha * 0.9;

        const padX = 8;
        const padY = 4;
        ctx.beginPath();
        ctx.roundRect(toastX - padX, toastY - padY - 9, textWidth + padX * 2, 18, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = currentColors.highlight;
        ctx.globalAlpha = fbAlpha;
        ctx.fillText(label, toastX, toastY);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleClick);
      container.removeEventListener('mouseleave', handlePointerLeave);
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-transparent cursor-default pointer-events-auto"
      />
    </div>
  );
};
