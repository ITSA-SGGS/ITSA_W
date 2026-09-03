import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Events } from '../components/Events';
import { Quote } from '../components/Quote';
import { Team } from '../components/Team';
import { Gallery } from '../components/Gallery';
import { Footer } from '../components/Footer';
import { ProfileModal } from '../components/ProfileModal';
import { LightboxModal } from '../components/LightboxModal';
import { CommitteeMember, GalleryItem } from '../types';
import { useArchive } from '../hooks/useArchive';

export const HomePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [selectedLightboxItem, setSelectedLightboxItem] = useState<GalleryItem | null>(null);
  const { items: archiveItems } = useArchive();

  // Critical Scroll Position & Hash Navigation Support
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    } else {
      const target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-500 overflow-x-hidden selection:bg-[#0072CE] selection:text-white">
      {/* Minimal Top Navigation */}
      <Navbar />

      {/* Main Continuous Visual Narrative */}
      <main className="w-full flex flex-col">
        {/* Section 01: Hero */}
        <Hero />

        {/* Section 02: Events (Category-First Media Collection) */}
        <Events onSelectPhoto={(photo) => setSelectedLightboxItem(photo)} />

        {/* Section 03: Standalone Cinematic Quote Transition */}
        <Quote />

        {/* Section 04: The People (Official Committee Structure) */}
        <Team onSelectMember={(member) => setSelectedMember(member)} />

        {/* Section 05: Visual Archive (Documentary Gallery) */}
        <Gallery onSelectImage={(img) => setSelectedLightboxItem(img)} />
      </main>

      {/* Minimal Footer */}
      <Footer />

      {/* Interactive Modals */}
      <ProfileModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      <LightboxModal
        item={selectedLightboxItem}
        items={archiveItems}
        onClose={() => setSelectedLightboxItem(null)}
        onSelect={(item) => setSelectedLightboxItem(item)}
      />
    </div>
  );
};
