import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Events } from '../components/Events';
import { Quote } from '../components/Quote';
import { Team } from '../components/Team';
import { Gallery } from '../components/Gallery';
import { Footer } from '../components/Footer';
import { CommitteeMember, GalleryItem } from '../types';
import { useArchive } from '../hooks/useArchive';

// Lazy-load interactive overlay modals to keep initial bundle lean
const ProfileModal = lazy(() =>
  import('../components/ProfileModal').then((m) => ({ default: m.ProfileModal }))
);
const LightboxModal = lazy(() =>
  import('../components/LightboxModal').then((m) => ({ default: m.LightboxModal }))
);

export const HomePage: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [selectedLightboxItem, setSelectedLightboxItem] = useState<GalleryItem | null>(null);
  const { items: archiveItems } = useArchive();

  // Scroll Position & Hash Navigation Support (deferred to avoid layout thrashing during paint)
  useEffect(() => {
    document.title = 'ITSA SGGSIE&T | Information Technology Students Association';
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    } else {
      requestAnimationFrame(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo(0, 0);
        }
      });
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

      {/* Interactive Modals (Loaded on-demand only when triggered) */}
      {selectedMember && (
        <Suspense fallback={null}>
          <ProfileModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        </Suspense>
      )}

      {selectedLightboxItem && (
        <Suspense fallback={null}>
          <LightboxModal
            item={selectedLightboxItem}
            items={archiveItems}
            onClose={() => setSelectedLightboxItem(null)}
            onSelect={(item) => setSelectedLightboxItem(item)}
          />
        </Suspense>
      )}
    </div>
  );
};
