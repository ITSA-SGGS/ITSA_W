import React, { useState, useEffect } from 'react';
import { EventItem } from '../types';
import { X, Calendar, MapPin, Users, CheckCircle, ArrowRight } from 'lucide-react';

interface EventModalProps {
  event: EventItem | null;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
  const [registered, setRegistered] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPrn, setRegPrn] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail) return;
    setRegistered(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F5F5F2] dark:bg-[#0A0A0C] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-black/40 dark:bg-white/10 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Banner Image */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover grayscale contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5F5F2] dark:from-[#0A0A0C] via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
            <span className="font-mono text-xs text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] font-semibold tracking-wider uppercase mb-1">
              // {event.category} · {event.year} //
            </span>
            <h2 id="event-title" className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-black/10 dark:border-white/10 font-mono text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]" />
              <span>{event.attendees}</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs tracking-wider uppercase text-[#6E6E73]">
              // OVERVIEW
            </h3>
            <p className="text-base sm:text-lg leading-relaxed font-normal text-[#111113]/90 dark:text-[#F5F5F7]/90">
              {event.description}
            </p>
          </div>

          {/* Schedule */}
          {event.schedule && (
            <div className="space-y-4">
              <h3 className="font-mono text-xs tracking-wider uppercase text-[#6E6E73]">
                // SCHEDULE &amp; TIMELINE
              </h3>
              <div className="divide-y divide-black/10 dark:divide-white/10 rounded-xl border border-black/10 dark:border-white/10 p-4 font-mono text-xs">
                {event.schedule.map((item, i) => (
                  <div key={i} className="py-2.5 flex items-baseline justify-between gap-4">
                    <span className="text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] font-semibold whitespace-nowrap">
                      {item.time}
                    </span>
                    <span className="text-right text-[#48484E] dark:text-[#A1A1A6]">
                      {item.activity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speakers */}
          {event.speakers && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs tracking-wider uppercase text-[#6E6E73]">
                // DISTINGUISHED SPEAKERS
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {event.speakers.map((spk, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]"
                  >
                    <div className="font-display font-semibold text-sm">{spk.name}</div>
                    <div className="text-xs text-[#6E6E73] font-mono">{spk.role} · {spk.org}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration Section */}
          <div className="pt-6 border-t border-black/10 dark:border-white/10">
            {registered ? (
              <div className="p-6 rounded-xl bg-terminal-green/10 border border-terminal-green/30 flex items-center gap-4 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Pass Reserved Successfully</div>
                  <div className="font-mono text-xs opacity-80">
                    Registration ID: ITSA-{event.id.toUpperCase()}-7X91
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="font-mono text-xs uppercase tracking-wider text-[#6E6E73]">
                  // RESERVE A SEAT (FRONTEND DEMO)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-transparent text-xs font-mono outline-none focus:border-terminal-green"
                  />
                  <input
                    type="email"
                    required
                    placeholder="College Email (@sggs.ac.in)"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-transparent text-xs font-mono outline-none focus:border-terminal-green"
                  />
                  <input
                    type="text"
                    placeholder="Registration PRN / Roll No"
                    value={regPrn}
                    onChange={(e) => setRegPrn(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-transparent text-xs font-mono outline-none focus:border-terminal-green"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl font-mono text-xs tracking-wider uppercase bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold hover:bg-terminal-green hover:text-black dark:hover:bg-[#35FF7A] dark:hover:text-black transition-colors"
                >
                  Confirm Event RSVP
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
