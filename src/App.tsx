import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Events } from './components/Events';
import { Quote } from './components/Quote';
import { Team } from './components/Team';
import { Gallery } from './components/Gallery';
import { Footer } from './components/Footer';
import { CategoryEventsModal } from './components/CategoryEventsModal';
import { ProfileModal } from './components/ProfileModal';
import { LightboxModal } from './components/LightboxModal';
import { EventCategoryType, CommitteeMember, GalleryItem } from './types';

export const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryType | null>(null);
  const [selectedMember, setSelectedMember] = useState<CommitteeMember | null>(null);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<GalleryItem | null>(null);

  // Critical Scroll Position Bug Fix: Always start at top (scrollY = 0) on fresh load/refresh unless an explicit hash exists
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

        {/* Section 02: Events (2-Category Selector) */}
        <Events onSelectCategory={(cat) => setSelectedCategory(cat)} />

        {/* Section 03: Standalone Cinematic Quote Transition */}
        <Quote />

        {/* Section 04: The People (Official Committee Structure) */}
        <Team onSelectMember={(member) => setSelectedMember(member)} />

        {/* Section 05: Visual Archive (Documentary Gallery) */}
        <Gallery onSelectImage={(img) => setSelectedGalleryItem(img)} />
      </main>

      {/* Minimal Footer */}
      <Footer />

      {/* Interactive Modals */}
      <CategoryEventsModal
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
      />

      <ProfileModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      <LightboxModal
        item={selectedGalleryItem}
        onClose={() => setSelectedGalleryItem(null)}
        onSelect={(item) => setSelectedGalleryItem(item)}
      />
    </div>
  );
};
