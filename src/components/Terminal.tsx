import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Terminal as TerminalIcon, CornerDownLeft, RefreshCw, Copy, Check } from 'lucide-react';

interface TerminalLine {
  type: 'input' | 'output' | 'system' | 'error' | 'success';
  content: string;
}

export const Terminal: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [inputVal, setInputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<TerminalLine[]>([
    { type: 'system', content: 'ITSA Linux Kernel v6.8.0-generic (x86_64-sggs-linux)' },
    { type: 'system', content: 'Information Technology Students Association · SGGSIE&T' },
    { type: 'system', content: 'Type "help" or click suggestions to explore system commands.\n' },
    { type: 'input', content: 'neofetch' },
    {
      type: 'output',
      content: `       _ __                
      (_) /______ ___ _    OS: ITSA Linux Foundation v2026.4
     / / __(_-< _ '/ / /   Host: SGGSIE&T Department of IT
    /_/\__/___|_,_/_/ /    Kernel: 6.8.0-generic-itsacore
                 |___/     Uptime: 142 days, 9 hours
                           Shell: zsh 5.9 (x86_64-sggs)
                           Theme: Apple Editorial + Linux DNA
                           Status: ONLINE · All systems nominal`,
    },
  ]);

  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>(['neofetch']);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const newHistory: TerminalLine[] = [...history, { type: 'input', content: trimmed }];
    const parts = trimmed.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'help':
        newHistory.push({
          type: 'output',
          content: `AVAILABLE SYSTEM UTILITIES:
  help            - List all interactive terminal commands
  about           - Display ITSA founding mission statement
  events          - List scheduled upcoming symposiums & workshops
  team            - Display executive committee heads
  neofetch        - Print system specs and ASCII identity
  status          - Query real-time node health and uptime
  theme [dark|light|toggle] - Change interface aesthetic theme
  cat <file>      - Read virtual system documents (e.g. cat manifesto)
  ls              - List virtual files and directories
  clear           - Wipe the terminal buffer
  sudo <cmd>      - Execute privileged operations
  whoami          - Query current user context
  date            - Show current system timestamp`,
        });
        break;

      case 'about':
        newHistory.push({
          type: 'output',
          content: `ITSA (Information Technology Students Association) is the premier technical body of the Department of Information Technology at Shri Guru Gobind Singhji Institute of Engineering and Technology (SGGSIE&T), Nanded.\n\nPhilosophy: First-principles engineering, systems mastery, and open technical collaboration.`,
        });
        break;

      case 'events':
        newHistory.push({
          type: 'output',
          content: `UPCOMING 2026 CALENDAR:
  [01] 2026.09.12 :: TECHNOVA '26 (Flagship Technical Symposium)
  [02] 2026.08.24 :: MODERN WEB SYSTEMS WORKSHOP (Build. Experiment. Ship.)
  [03] 2026.10.15 :: HACK-IT-OUT 4.0 (24-Hour Systems & AI Hackathon)
  [04] 2026.11.02 :: LINUX KERNEL & CLOUD BOOTCAMP`,
        });
        break;

      case 'team':
        newHistory.push({
          type: 'output',
          content: `EXECUTIVE COMMITTEE (TY):
  - President: Tanishq Raut
  - Vice Presidents: Rahul Gulade, Palak Baladwa
  - Technical Heads: Nandini Chintewad, Pradnya Jadhav
  - Media & Design: Aditya Mirajgave, Mrunal Raje
  - Anchoring: Shrish Wadgaokar, Shravani Kharwadkar
  - Treasury: Alok Singh, Aaryan Kale
  - Operations: Diksha Yelage, Ghananil Shirpurkar`,
        });
        break;

      case 'neofetch':
      case 'sysinfo':
        newHistory.push({
          type: 'output',
          content: `       _ __                
      (_) /______ ___ _    OS: ITSA Linux Foundation v2026.4
     / / __(_-< _ '/ / /   Host: SGGSIE&T Department of IT
    /_/\__/___|_,_/_/ /    Kernel: 6.8.0-generic-itsacore
                 |___/     Uptime: 142 days, 9 hours
                           Shell: zsh 5.9 (x86_64-sggs)
                           Location: SGGSIE&T Nanded (19.1176° N, 77.2995° E)
                           Status: ONLINE · All nodes operational`,
        });
        break;

      case 'status':
        newHistory.push({
          type: 'success',
          content: `[OK] Host sggs-it-core: 100% HEALTHY
[OK] Memory: 3.4GB / 64GB used (zram active)
[OK] Latency: 0.28ms to edge
[OK] Active Semester: AUTUMN 2026`,
        });
        break;

      case 'ls':
        newHistory.push({
          type: 'output',
          content: `manifesto.md   history.txt   constitution.json   projects/   events/   team/`,
        });
        break;

      case 'cat':
        if (!args || args === 'manifesto' || args === 'manifesto.md') {
          newHistory.push({
            type: 'output',
            content: `--- ITSA MANIFESTO ---
1. We construct from first principles.
2. Software is craft; architecture is intentionality.
3. Linux is the foundation; curiosity is the engine.
4. Share what you build; lift the cohort.`,
          });
        } else if (args === 'history.txt' || args === 'history') {
          newHistory.push({
            type: 'output',
            content: `Established 1981 at SGGSIE&T Nanded. Pioneering undergraduate technical leadership across Maharashtra and India.`,
          });
        } else {
          newHistory.push({
            type: 'error',
            content: `cat: ${args}: No such file or directory. Try: cat manifesto.md`,
          });
        }
        break;

      case 'theme':
        if (args === 'light' || args === 'dark') {
          toggleTheme();
          newHistory.push({
            type: 'success',
            content: `Theme switched to ${args} mode.`,
          });
        } else {
          toggleTheme();
          newHistory.push({
            type: 'success',
            content: `Theme toggled to ${theme === 'dark' ? 'light' : 'dark'} mode.`,
          });
        }
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      case 'sudo':
        newHistory.push({
          type: 'output',
          content: `[sudo] user moonwaker is already in the sudoers group.\nIncident will not be reported. Permission granted.`,
        });
        break;

      case 'whoami':
        newHistory.push({
          type: 'output',
          content: `guest_engineer@itsa.sggs.edu.in [Role: Curious Tinkerer]`,
        });
        break;

      case 'date':
        newHistory.push({
          type: 'output',
          content: new Date().toUTCString(),
        });
        break;

      default:
        newHistory.push({
          type: 'error',
          content: `zsh: command not found: ${command}. Type "help" to view available utilities.`,
        });
    }

    setHistory(newHistory);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < commandHistory.length) {
          setHistoryIndex(nextIdx);
          setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    }
  };

  const copyTerminalOutput = () => {
    const text = history.map((h) => `${h.type === 'input' ? '$ ' : ''}${h.content}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  const quickCommands = ['help', 'about', 'events', 'team', 'status', 'cat manifesto.md'];

  return (
    <section id="terminal" className="relative py-32 sm:py-48 px-6 sm:px-8 lg:px-12 w-full border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-black/10 dark:border-white/10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
              <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">07</span>
              <span>/</span>
              <span>SYSTEM INTERACTION</span>
            </div>
            <h2 className="headline-section font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tight">
              Linux Terminal Environment.
            </h2>
          </div>
          <p className="text-sm font-mono text-[#6E6E73] dark:text-[#8E8E93]">
            An interactive sandbox embedded directly within the kernel interface.
          </p>
        </div>

        {/* Terminal Container Window */}
        <div
          className="rounded-2xl border border-black/15 dark:border-white/15 overflow-hidden shadow-2xl bg-[#080808] dark:bg-[#050505] text-[#F5F5F7]"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Terminal Titlebar */}
          <div className="px-5 py-3.5 bg-[#111113] dark:bg-[#0A0A0C] border-b border-white/10 flex items-center justify-between font-mono text-xs text-[#8E8E93]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56]/80 hover:opacity-100 transition-opacity" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]/80 hover:opacity-100 transition-opacity" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F]/80 hover:opacity-100 transition-opacity" />
              <span className="ml-3 text-white/70 text-[11px]">~/itsa — bash — 80x24</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyTerminalOutput();
                }}
                className="p-1 rounded hover:text-white transition-colors"
                title="Copy Terminal Text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#35FF7A]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearTerminal();
                }}
                className="p-1 rounded hover:text-white transition-colors"
                title="Clear Terminal Buffer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-6 sm:p-8 font-mono text-xs sm:text-sm leading-relaxed max-h-[480px] overflow-y-auto space-y-3">
            {history.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-words">
                {line.type === 'input' && (
                  <div className="flex items-center gap-2 text-white/90">
                    <span className="text-[#35FF7A]">moonwaker@sggs-itsa:~$</span>
                    <span>{line.content}</span>
                  </div>
                )}
                {line.type === 'output' && (
                  <div className="text-[#A1A1A6] font-normal pl-4 border-l border-white/10 my-1">
                    {line.content}
                  </div>
                )}
                {line.type === 'system' && (
                  <div className="text-[#6E6E73] font-light">
                    {line.content}
                  </div>
                )}
                {line.type === 'success' && (
                  <div className="text-[#35FF7A] pl-4 border-l border-[#35FF7A]/40 my-1">
                    {line.content}
                  </div>
                )}
                {line.type === 'error' && (
                  <div className="text-[#FF6B6B] pl-4 border-l border-[#FF6B6B]/40 my-1">
                    {line.content}
                  </div>
                )}
              </div>
            ))}

            {/* Active Input Prompt */}
            <div className="flex items-center gap-2 pt-2 text-white">
              <span className="text-[#35FF7A] font-semibold whitespace-nowrap">
                moonwaker@sggs-itsa:~$
              </span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-white border-none outline-none font-mono text-xs sm:text-sm p-0 focus:ring-0"
                placeholder="type a command..."
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <div ref={terminalEndRef} />
          </div>

          {/* Quick Click Suggestions Bar */}
          <div className="px-6 py-3 bg-[#0D0D0F] border-t border-white/10 flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#6E6E73]">
            <span>Try:</span>
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCommand(cmd);
                }}
                className="px-2.5 py-1 rounded bg-white/[0.05] hover:bg-white/10 text-[#A1A1A6] hover:text-[#35FF7A] transition-colors border border-white/5"
              >
                ${cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
