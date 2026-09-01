import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Focus } from './components/Focus';
import { Events } from './components/Events';
import { Numbers } from './components/Numbers';
import { Team } from './components/Team';
import { Gallery } from './components/Gallery';
import { Terminal } from './components/Terminal';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { EventModal } from './components/EventModal';
import { JoinModal } from './components/JoinModal';
import { LightboxModal } from './components/LightboxModal';
import { EventItem, GalleryItem } from './types';

export const App: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleOpenTerminal = () => {
    const el = document.getElementById('terminal');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500 overflow-x-hidden selection:bg-terminal-green selection:text-black">
      {/* Minimal Top Navigation */}
      <Navbar onOpenJoinModal={() => setIsJoinModalOpen(true)} />

      {/* Main Continuous Visual Narrative */}
      <main className="w-full flex flex-col">
        {/* Section 01: Hero with Right-Biased Linux Atmosphere */}
        <Hero onOpenTerminal={handleOpenTerminal} />

        {/* Section 02: Introduction / Editorial Statement */}
        <About />

        {/* Section 03: What ITSA Does (Full-Width Interactive List) */}
        <Focus />

        {/* Section 04: Events (Editorial Archive) */}
        <Events onSelectEvent={(evt) => setSelectedEvent(evt)} />

        {/* Section 05: Numbers (Dramatic Typographic Moment) */}
        <Numbers />

        {/* Section 06: The People (Editorial Directory) */}
        <Team />

        {/* Section 07: Visual Archive (Documentary Gallery) */}
        <Gallery onSelectImage={(img) => setSelectedGalleryItem(img)} />

        {/* Section 08: Terminal (Linux Sandbox Easter Egg) */}
        <Terminal />

        {/* Section 09: Final Call to Action */}
        <CTA onOpenJoinModal={() => setIsJoinModalOpen(true)} />
      </main>

      {/* Minimal Footer */}
      <Footer />

      {/* Interactive Modals */}
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <LightboxModal
        item={selectedGalleryItem}
        onClose={() => setSelectedGalleryItem(null)}
        onSelect={(item) => setSelectedGalleryItem(item)}
      />
    </div>
  );
};
