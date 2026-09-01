import React from 'react';
import { Heart, Instagram } from 'lucide-react';

const DONATE_URL = 'https://hcb.hackclub.com/donations/start/curiosityquest';
const INSTAGRAM_URL = 'https://www.instagram.com/curiosityquest25';

export default function FloatingActions() {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[50] flex flex-col items-end gap-2.5 print:hidden cb:bottom-6 cb:right-6"
      aria-label="CuriosityQuest links"
    >
      <FloatingLink
        href={DONATE_URL}
        label="Donate"
        title="Donate to CuriosityQuest"
        icon={Heart}
        className="border-orange-700 bg-orange-700 text-white hover:border-orange-800 hover:bg-orange-800"
      />
      <FloatingLink
        href={INSTAGRAM_URL}
        label="Follow us"
        title="Follow CuriosityQuest on Instagram"
        icon={Instagram}
        className="border-line bg-white text-ink-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      />
    </div>
  );
}

function FloatingLink({ href, label, title, icon: Icon, className }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={title}
      className={`pointer-events-auto inline-flex h-11 items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-bold shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
