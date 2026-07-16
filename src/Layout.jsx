import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Menu, X, Instagram, Heart, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [playMenuOpen, setPlayMenuOpen] = useState(false);

  // Interactive features grouped under a "Play & Learn" dropdown
  const playLinks = [
    { name: 'Physics Playground', page: 'PhysicsPlayground', desc: 'Launch projectiles and explore gravity' },
    { name: 'Science Lab Tycoon', page: 'ScienceLab', desc: 'Answer questions to build your lab' },
    { name: 'Quest Passport', page: 'QuestPassport', desc: 'Track XP, badges, and progress' },
  ];
  const playPages = playLinks.map((l) => l.page);

  const navLinks = [
    { name: 'Home', page: 'Home' },
    { name: 'Activities', page: 'Activities' },
    { name: 'Events', page: 'Events' },
    { name: '5 Minutes of STEM', page: 'ThisWeekInSTEM' },
    { name: 'Careers', page: 'CareersInSTEM' },
    { name: 'Make an Impact', page: 'MakeAnImpact' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Instagram Floating Button */}
      <motion.a
        href="https://www.instagram.com/curiosityquest25?igsh=MWoybDB1YW9xZjM4Zg%3D%3D&utm_source=qr"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white px-4 py-3 rounded-full shadow-xl font-semibold cursor-pointer"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.08 }}
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        <Instagram className="w-5 h-5" />
        <span className="text-sm">Follow Us!</span>
      </motion.a>

      <motion.a
        href="https://hcb.hackclub.com/donations/start/curiosityquest"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-br from-[#ed7219] to-[#d86515] text-white px-4 py-3 rounded-full shadow-xl font-semibold cursor-pointer"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        whileHover={{ scale: 1.08 }}
        style={{ fontFamily: 'Nunito, sans-serif' }}
      >
        <Heart className="w-5 h-5" />
        <span className="text-sm">Donate Now</span>
      </motion.a>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        
        :root {
          --color-orange: #ed7219;
          --color-blue: #055b8e;
          --color-white: #ffffff;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Nunito', sans-serif;
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link 
              to={createPageUrl('Home')} 
              className="flex items-center gap-2 group"
            >
              <img 
                src="/images/logo.png"
                alt="CuriosityQuest Logo"
                className="w-10 h-10 md:w-12 md:h-12 object-contain transform group-hover:scale-105 transition-transform"
              />
              <span className="text-xl md:text-2xl font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                CuriosityQuest
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to={createPageUrl('Home')}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all ${
                  currentPageName === 'Home'
                    ? 'bg-[#055b8e] text-white'
                    : 'text-gray-700 hover:bg-[#055b8e]/10 hover:text-[#055b8e]'
                }`}
              >
                Home
              </Link>
              <Link
                to={createPageUrl('Activities')}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all ${
                  currentPageName === 'Activities'
                    ? 'bg-[#055b8e] text-white'
                    : 'text-gray-700 hover:bg-[#055b8e]/10 hover:text-[#055b8e]'
                }`}
              >
                Activities
              </Link>

              {/* Play & Learn dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setPlayMenuOpen(true)}
                onMouseLeave={() => setPlayMenuOpen(false)}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-base font-medium transition-all ${
                    playPages.includes(currentPageName)
                      ? 'bg-[#055b8e] text-white'
                      : 'text-gray-700 hover:bg-[#055b8e]/10 hover:text-[#055b8e]'
                  }`}
                >
                  Play &amp; Learn
                  <ChevronDown className={`w-4 h-4 transition-transform ${playMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {playMenuOpen && (
                  <div className="absolute left-0 top-full pt-2 w-72 z-50">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
                      {playLinks.map((link) => (
                        <Link
                          key={link.page}
                          to={createPageUrl(link.page)}
                          className={`block px-4 py-3 rounded-xl transition-all ${
                            currentPageName === link.page
                              ? 'bg-[#055b8e]/10'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {link.name}
                          </div>
                          <div className="text-sm text-gray-500">{link.desc}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {navLinks.slice(2).map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`px-4 py-2 rounded-lg text-base font-medium transition-all ${
                    currentPageName === link.page
                      ? 'bg-[#055b8e] text-white'
                      : 'text-gray-700 hover:bg-[#055b8e]/10 hover:text-[#055b8e]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#055b8e]" />
              ) : (
                <Menu className="w-6 h-6 text-[#055b8e]" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4">
            <nav className="flex flex-col px-4 gap-2">
              {navLinks.slice(0, 2).map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-lg font-medium transition-all ${
                    currentPageName === link.page
                      ? 'bg-[#055b8e] text-white'
                      : 'text-gray-700 hover:bg-[#055b8e]/10'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Play & Learn group */}
              <div className="mt-1 mb-1">
                <div className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Play &amp; Learn
                </div>
                {playLinks.map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-lg font-medium transition-all ${
                      currentPageName === link.page
                        ? 'bg-[#055b8e] text-white'
                        : 'text-gray-700 hover:bg-[#055b8e]/10'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {navLinks.slice(2).map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-lg font-medium transition-all ${
                    currentPageName === link.page
                      ? 'bg-[#055b8e] text-white'
                      : 'text-gray-700 hover:bg-[#055b8e]/10'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#055b8e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/images/logo.png"
                  alt="CuriosityQuest Logo"
                  className="w-10 h-10 object-contain"
                />
                <span className="text-xl font-bold" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  CuriosityQuest
                </span>
              </div>
              <p className="text-white/80 leading-relaxed">
                Inspiring the next generation of scientists, engineers, and innovators through hands-on learning and discovery.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Explore
              </h4>
              <nav className="flex flex-col gap-2">
                {[...navLinks, ...playLinks].map((link) => (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mission */}
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Our Mission
              </h4>
              <p className="text-white/80 leading-relaxed">
                Making STEM education accessible, engaging, and fun for curious minds everywhere.
              </p>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className="font-bold text-lg mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Contact Us
              </h4>
              <p className="text-white/80 mb-2">Have questions or want to get involved?</p>
              <a
                href="mailto:curiosity.quest25@gmail.com"
                className="text-[#ed7219] hover:text-orange-300 transition-colors font-medium"
              >
                curiosity.quest25@gmail.com
              </a>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>© {new Date().getFullYear()} CuriosityQuest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}