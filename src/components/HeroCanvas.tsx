import React, { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

interface Stream {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  opacity: number;
  fontSize: number;
  changeRate: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  alpha: number;
}

const COMMAND_SNIPPETS = [
  '$ ./initialize',
  '$ systemctl status itsa.service',
  'STATUS: ONLINE [ACTIVE]',
  '01101001 01110100 01110011 01100001',
  '0x7F4A :: KERNEL_STABLE',
  '~/itsa/systems $ make build',
  'node: sggs-it-core-01',
  'mem: 64gb / swap: 0% / zram: ok',
  'arch: x86_64 linux-6.8.0',
  'gcc -O3 -Wall core.c -o itsa_node',
  '01010011 01000111 01000111 01010011',
  'git log --oneline -n 3',
  '7eb9217 feat: systems architecture',
  'eBPF trace: latency < 0.4ms',
  'sggs.edu.in/it/itsa :: 2026',
  '0xDEADBEEF 0xCAFEBABE',
  'net.ipv4.tcp_fastopen = 3',
  'ready :: awaiting input',
];

const GLYPH_CHARS = '0101010101abcdef0123456789$#/_:.~[]<>-+*';

export const HeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let lastTime = 0;
    const targetFps = 30;
    const interval = 1000 / targetFps;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = mediaQuery.matches;

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleReducedMotionChange);

    // Responsive setup
    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Generate vertical data streams concentrated on the right side
    const streams: Stream[] = [];
    const particles: Particle[] = [];
    const floatingCommands: { x: number; y: number; text: string; opacity: number; vy: number }[] = [];

    const initElements = () => {
      streams.length = 0;
      particles.length = 0;
      floatingCommands.length = 0;

      // Streams strictly biased to the right 55% of the screen
      const streamCount = Math.floor((width * 0.55) / 38);
      for (let i = 0; i < streamCount; i++) {
        const startX = width * 0.45 + (i * 38) + (Math.random() * 15 - 7.5);
        const charLength = Math.floor(Math.random() * 14) + 6;
        const chars: string[] = [];
        for (let j = 0; j < charLength; j++) {
          chars.push(GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)]);
        }
        streams.push({
          x: startX,
          y: Math.random() * height,
          speed: Math.random() * 1.2 + 0.4,
          chars,
          opacity: Math.random() * 0.35 + 0.12,
          fontSize: Math.floor(Math.random() * 3) + 11,
          changeRate: Math.floor(Math.random() * 6) + 4,
        });
      }

      // Subtle particles on right side
      const particleCount = Math.floor(width / 35);
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: width * 0.4 + Math.random() * (width * 0.6),
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -(Math.random() * 0.3 + 0.1),
          size: Math.random() * 1.5 + 0.8,
          opacity: Math.random() * 0.4 + 0.1,
          alpha: Math.random() * Math.PI * 2,
        });
      }

      // Atmospheric Linux commands floating slowly
      const commandCount = 5;
      for (let i = 0; i < commandCount; i++) {
        floatingCommands.push({
          x: width * 0.52 + Math.random() * (width * 0.42),
          y: (height / (commandCount + 1)) * (i + 1) + (Math.random() * 40 - 20),
          text: COMMAND_SNIPPETS[Math.floor(Math.random() * COMMAND_SNIPPETS.length)],
          opacity: Math.random() * 0.35 + 0.15,
          vy: -(Math.random() * 0.15 + 0.05),
        });
      }
    };

    initElements();

    let frameCount = 0;

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      // Check tab visibility to save power
      if (document.hidden) return;

      const elapsed = currentTime - lastTime;
      if (elapsed < interval) return;
      lastTime = currentTime - (elapsed % interval);
      frameCount++;

      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';
      const greenAccent = isDark ? '#35FF7A' : '#0D7A3E';
      const charColor = isDark ? '#A1A1A6' : '#55555C';
      const dimCharColor = isDark ? '#424245' : '#8E8E93';

      if (reducedMotion) {
        // Render static elegant snapshot for reduced motion
        ctx.font = '12px "JetBrains Mono", monospace';
        floatingCommands.forEach((cmd, idx) => {
          const fadeRight = Math.min(1, Math.max(0, (cmd.x - width * 0.4) / (width * 0.5)));
          ctx.fillStyle = idx === 0 ? greenAccent : charColor;
          ctx.globalAlpha = 0.22 * fadeRight;
          ctx.fillText(cmd.text, cmd.x, cmd.y);
        });
        return;
      }

      // Draw faint background coordinate grid on the right half
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.018)' : 'rgba(0, 0, 0, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      const startGridX = Math.floor((width * 0.4) / gridSize) * gridSize;

      ctx.beginPath();
      for (let x = startGridX; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(startGridX, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Render Vertical Character Streams
      streams.forEach((stream) => {
        // Density fades sharply on the left (left = 0, right = 1)
        const xProgress = (stream.x - width * 0.4) / (width * 0.6);
        const fadeRight = Math.max(0, Math.min(1, xProgress));
        if (fadeRight <= 0.01) return;

        ctx.font = `${stream.fontSize}px "JetBrains Mono", monospace`;

        stream.chars.forEach((char, index) => {
          const charY = stream.y + index * (stream.fontSize + 4);
          if (charY < -20 || charY > height + 20) return;

          // Head character has subtle accent
          const isHead = index === stream.chars.length - 1;
          const charOpacity = isHead ? stream.opacity * 1.5 : stream.opacity * (index / stream.chars.length);

          ctx.fillStyle = isHead ? greenAccent : (index % 3 === 0 ? dimCharColor : charColor);
          ctx.globalAlpha = Math.min(0.65, charOpacity * fadeRight * (isDark ? 0.85 : 0.45));
          ctx.fillText(char, stream.x, charY);
        });

        // Randomly mutate characters
        if (frameCount % stream.changeRate === 0) {
          const randIdx = Math.floor(Math.random() * stream.chars.length);
          stream.chars[randIdx] = GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)];
        }

        stream.y += stream.speed;
        if (stream.y > height + 40) {
          stream.y = -stream.chars.length * (stream.fontSize + 4) - Math.random() * 100;
          stream.speed = Math.random() * 1.2 + 0.4;
        }
      });

      // Render Atmospheric Floating Commands
      ctx.font = '12px "JetBrains Mono", monospace';
      floatingCommands.forEach((cmd, idx) => {
        const xProgress = (cmd.x - width * 0.4) / (width * 0.55);
        const fadeRight = Math.max(0, Math.min(1, xProgress));

        cmd.y += cmd.vy;
        if (cmd.y < -30) {
          cmd.y = height + 20;
          cmd.x = width * 0.5 + Math.random() * (width * 0.45);
          cmd.text = COMMAND_SNIPPETS[Math.floor(Math.random() * COMMAND_SNIPPETS.length)];
        }

        // Draw bracket line
        ctx.fillStyle = idx === 0 ? greenAccent : (isDark ? '#E5E5EA' : '#2C2C2E');
        ctx.globalAlpha = cmd.opacity * fadeRight * (isDark ? 0.75 : 0.4);
        ctx.fillText(cmd.text, cmd.x, cmd.y);
      });

      // Render subtle drift particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += 0.02;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = width * 0.4 + Math.random() * (width * 0.6);
        }

        const fadeRight = Math.max(0, Math.min(1, (p.x - width * 0.38) / (width * 0.6)));
        const dynamicOpacity = (p.opacity + Math.sin(p.alpha) * 0.15) * fadeRight;

        ctx.fillStyle = greenAccent;
        ctx.globalAlpha = Math.max(0, Math.min(0.5, dynamicOpacity * (isDark ? 0.6 : 0.3)));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Left-to-right subtle linear gradient vignette to guarantee 100% pristine black/light on the left
      const vignette = ctx.createLinearGradient(0, 0, width * 0.55, 0);
      const bgHex = isDark ? '#050505' : '#F5F5F2';
      vignette.addColorStop(0, bgHex);
      vignette.addColorStop(0.65, bgHex);
      vignette.addColorStop(1, 'transparent');

      ctx.globalAlpha = isDark ? 0.96 : 0.94;
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width * 0.55, height);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, [theme]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-90 transition-opacity duration-700"
      />
    </div>
  );
};
