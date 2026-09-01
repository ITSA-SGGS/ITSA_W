import React, { useState } from 'react';
import { Cpu, Terminal, Layers, Users } from 'lucide-react';

export const About: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const pillars = [
    {
      id: 'systems',
      title: 'Systems & Core',
      icon: Terminal,
      description: 'Understanding the machine from bare metal. Compilers, operating systems, network protocols, eBPF tracing, and memory allocators.',
      manifest: 'sggs-it/core $ make --jobs=8 kernel_module.ko'
    },
    {
      id: 'intelligence',
      title: 'Intelligence & Data',
      icon: Cpu,
      description: 'Applied machine intelligence, neural networks, computer vision pipelines, and scalable distributed data storage engines.',
      manifest: 'torch.distributed.init_process_group(backend="nccl")'
    },
    {
      id: 'craft',
      title: 'Design & Craft',
      icon: Layers,
      description: 'Engineering tactile, resilient, accessible user experiences. Sub-second performance, strict typography, and clean visual rhythm.',
      manifest: 'const layout = new RenderPipeline({ fps: 60, zeroJank: true })'
    },
    {
      id: 'collective',
      title: 'Open Collective',
      icon: Users,
      description: 'A thriving ecosystem of peer code reviews, open-source repositories, alumni mentorship, and national technical symposiums.',
      manifest: 'git push origin main && echo "Deployed to SGGSIE&T ecosystem"'
    },
  ];

  return (
    <section id="about" className="relative py-36 sm:py-48 px-6 sm:px-8 lg:px-12 w-full overflow-hidden border-t border-black/5 dark:border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        {/* Section Index Eyebrow */}
        <div className="flex items-center gap-3 mb-16 font-mono text-xs tracking-widest uppercase dark:text-[#A1A1A6] text-[#6E6E73]">
          <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">01</span>
          <span>/</span>
          <span>ABOUT ITSA</span>
        </div>

        {/* Massive Editorial Dominant Statement */}
        <div className="space-y-2 sm:space-y-3 mb-20">
          <h2 className="headline-statement font-display font-bold text-[#111113] dark:text-[#F5F5F7] tracking-tighter">
            WE BUILD.
          </h2>
          <h2 className="headline-statement font-display font-bold text-[#6E6E73] dark:text-[#8E8E93] tracking-tighter">
            WE LEARN.
          </h2>
          <h2 className="headline-statement font-display font-bold text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] tracking-tighter">
            WE EXPLORE.
          </h2>
        </div>

        {/* Spacious Editorial Paragraph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-28">
          <div className="lg:col-span-8">
            <p className="text-xl sm:text-2xl lg:text-3xl font-normal leading-relaxed text-[#111113]/90 dark:text-[#F5F5F7]/90 tracking-tight">
              Founded in the Department of Information Technology at{' '}
              <strong className="font-semibold text-[#111113] dark:text-white">SGGSIE&T Nanded</strong>,
              ITSA is an incubator for engineers, tinkerers, and systems architects. We believe genuine technical mastery comes from building from first principles — constructing operating systems, distributed architectures, intelligent models, and tactile experiences that endure.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6 pt-2 border-l border-black/10 dark:border-white/10 pl-6 sm:pl-8">
            <div className="font-mono text-xs space-y-2 text-[#6E6E73] dark:text-[#8E8E93]">
              <p className="text-[#111113] dark:text-[#F5F5F7] font-semibold">DEPARTMENT OF IT</p>
              <p>Shri Guru Gobind Singhji Institute of Engineering & Technology, Vishnupuri, Nanded.</p>
              <p className="pt-2 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
                Autonomous Institute · Est. 1981
              </p>
            </div>
          </div>
        </div>

        {/* Architectural Pillars — Linux Inspection System */}
        <div className="border border-black/10 dark:border-white/10 rounded-2xl p-6 sm:p-10 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2 font-mono text-xs text-[#6E6E73]">
              <span className="w-2 h-2 rounded-full bg-terminal-green dark:bg-[#35FF7A] bg-[#0D7A3E]" />
              <span>CORE ARCHITECTURAL PILLARS</span>
            </div>
            <div className="font-mono text-xs text-[#6E6E73]">
              STATUS: INITIALIZED &amp; VERIFIED
            </div>
          </div>

          {/* Pillar Selector Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              const isSelected = activeTab === idx;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setActiveTab(idx)}
                  className={`p-4 rounded-xl text-left transition-all duration-300 border flex flex-col justify-between ${
                    isSelected
                      ? 'border-terminal-green/50 dark:border-[#35FF7A]/50 bg-black/5 dark:bg-white/5 shadow-sm'
                      : 'border-transparent hover:border-black/10 dark:hover:border-white/10 bg-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]' : 'text-[#6E6E73]'}`} />
                    <span className="font-mono text-[10px] text-[#6E6E73]">0{idx + 1}</span>
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? 'text-[#111113] dark:text-[#F5F5F7]' : 'text-[#6E6E73]'}`}>
                    {pillar.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Statement & Execution Shell */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7">
              <p className="text-base sm:text-lg text-[#111113] dark:text-[#F5F5F7] font-normal leading-relaxed">
                {pillars[activeTab].description}
              </p>
            </div>
            <div className="md:col-span-5">
              <div className="p-4 rounded-xl bg-black/80 dark:bg-black/90 border border-white/10 font-mono text-xs text-white/90 shadow-inner">
                <div className="flex items-center gap-2 mb-2 text-[10px] text-[#6E6E73] pb-2 border-b border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35FF7A]" />
                  <span>runtime.log</span>
                </div>
                <div className="text-[#35FF7A] break-all">
                  &gt; {pillars[activeTab].manifest}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
