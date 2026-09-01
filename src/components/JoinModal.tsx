import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Terminal, Send } from 'lucide-react';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [year, setYear] = useState('First Year (FY)');
  const [interest, setInterest] = useState('Systems & Linux Architecture');
  const [note, setNote] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#F5F5F2] dark:bg-[#0A0A0C] border border-black/15 dark:border-white/15 text-[#111113] dark:text-[#F5F5F7] p-6 sm:p-10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 font-mono text-xs text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] mb-2">
            <Terminal className="w-4 h-4" />
            <span>~/itsa/join — INITIATE APPLICATION</span>
          </div>
          <h2 id="join-title" className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
            Join ITSA 2026.
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#8E8E93] mt-1">
            Department of Information Technology, SGGSIE&T Nanded.
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-terminal-green/10 text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E] flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-semibold text-xl">Application Received</h3>
            <p className="font-mono text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-sm mx-auto">
              Your profile has been logged to the candidate buffer. Check your college inbox for interview invitations during orientation week.
            </p>
            <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-xs text-terminal-green dark:text-[#35FF7A] text-[#0D7A3E]">
              APPLICATION HASH: 0x{Math.random().toString(16).substr(2, 8).toUpperCase()}
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-full font-mono text-xs uppercase bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113]"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#6E6E73] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Anand Soni"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/15 dark:border-white/15 bg-transparent font-sans text-sm outline-none focus:border-terminal-green transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#6E6E73] mb-1.5">
                SGGSIE&T Email
              </label>
              <input
                type="email"
                required
                placeholder="2025bitXXX@sggs.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/15 dark:border-white/15 bg-transparent font-sans text-sm outline-none focus:border-terminal-green transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#6E6E73] mb-1.5">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F5F5F2] dark:bg-[#0A0A0C] font-sans text-xs outline-none focus:border-terminal-green"
                >
                  <option>First Year (FY)</option>
                  <option>Second Year (SY)</option>
                  <option>Third Year (TY)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[#6E6E73] mb-1.5">
                  Primary Domain
                </label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#F5F5F2] dark:bg-[#0A0A0C] font-sans text-xs outline-none focus:border-terminal-green"
                >
                  <option>Systems & Linux Architecture</option>
                  <option>Web & Product Engineering</option>
                  <option>Machine Learning & Data</option>
                  <option>Media & Motion Design</option>
                  <option>Event Operations & Protocol</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-[#6E6E73] mb-1.5">
                Tell us what you've built or want to build (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="GitHub link, ideas, or what drives your curiosity..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/15 dark:border-white/15 bg-transparent font-sans text-xs outline-none focus:border-terminal-green resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-mono text-xs tracking-wider uppercase bg-[#111113] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#111113] font-semibold hover:bg-terminal-green hover:text-black dark:hover:bg-[#35FF7A] dark:hover:text-black transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <span>Submit Registration</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
