import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Menu, X, Instagram, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openTab, setOpenTab] = useState(null);

  // Three main hub tabs. Each hub highlights when you're on it or any of its child pages,
  // and reveals its child pages on hover.
  const navTabs = [
    { name: 'Home', page: 'Home', children: [] },
    {
      name: 'About Us', page: 'AboutUs', children: [
        { name: 'Overview', page: 'AboutUs', desc: 'Our mission, team, and story' },
        { name: 'Events', page: 'Events', desc: 'Free STEM events near you' },
        { name: 'Careers in STEM', page: 'CareersInSTEM', desc: 'Explore science career paths' },
        { name: 'Make an Impact', page: 'MakeAnImpact', desc: 'Support and get involved' },
      ],
    },
    {
      name: 'Activities', page: 'Learn', children: [
        { name: 'Hands-On Experiments', page: 'Activities', desc: '72 experiments to try at home' },
        { name: 'Coding Courses', page: 'Activities', query: 'tab=code', desc: 'Python, Java, and web' },
        { name: '5 Minutes of STEM', page: 'ThisWeekInSTEM', desc: 'Quick, fascinating reads' },
      ],
    },
    {
      name: 'Interactive Play', page: 'Play', children: [
        { name: 'Science Arena', page: 'ScienceArena', desc: 'Battle campaign fueled by your answers' },
        { name: 'Science Lab Tycoon', page: 'ScienceLab', desc: 'Answer questions, build a lab' },
        { name: 'Quest Passport', page: 'QuestPassport', desc: 'Track XP, badges, and progress' },
      ],
    },
  ];
  const childPages = (tab) => tab.children.map((c) => c.page);
  const isTabActive = (tab) => currentPageName === tab.page || childPages(tab).includes(currentPageName);
  const linkTo = (c) => `${createPageUrl(c.page)}${c.query ? `?${c.query}` : ''}`;

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
              {navTabs.map((tab) => (
                tab.children.length === 0 ? (
                  <Link
                    key={tab.page}
                    to={createPageUrl(tab.page)}
                    className={`px-4 py-2 rounded-lg text-base font-medium transition-all ${
                      isTabActive(tab)
                        ? 'bg-[#055b8e] text-white'
                        : 'text-gray-700 hover:bg-[#055b8e]/10 hover:text-[#055b8e]'
                    }`}
                  >
                    {tab.name}
                  </Link>
                ) : (
                  <div
                    key={tab.page}
                    className="relative"
                    onMouseEnter={() => setOpenTab(tab.page)}
                    onMouseLeave={() => setOpenTab(null)}
                  >
                    <Link
                      to={createPageUrl(tab.page)}
                      className={`px-4 py-2 rounded-lg text-base font-medium transition-all inline-block ${
                        isTabActive(tab)
                          ? 'bg-[#055b8e] text-white'
                          : 'text-gray-700 hover:bg-[#055b8e]/10 hover:text-[#055b8e]'
                      }`}
                    >
                      {tab.name}
                    </Link>
                    {openTab === tab.page && (
                      <div className="absolute left-0 top-full pt-2 w-72 z-50">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2">
                          {tab.children.map((c) => (
                            <Link
                              key={c.name}
                              to={linkTo(c)}
                              className={`block px-4 py-2.5 rounded-xl transition-all ${
                                currentPageName === c.page ? 'bg-[#055b8e]/10' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="font-semibold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                                {c.name}
                              </div>
                              <div className="text-sm text-gray-500">{c.desc}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
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
            <nav className="flex flex-col px-4 gap-1">
              {navTabs.map((tab) => (
                <div key={tab.page} className={tab.children.length ? 'mb-1' : ''}>
                  <Link
                    to={createPageUrl(tab.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-lg font-medium transition-all ${
                      currentPageName === tab.page
                        ? 'bg-[#055b8e] text-white'
                        : 'text-gray-700 hover:bg-[#055b8e]/10'
                    }`}
                  >
                    {tab.name}
                  </Link>
                  {tab.children.map((c) => (
                    <Link
                      key={c.name}
                      to={linkTo(c)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block ml-4 px-4 py-2.5 rounded-xl text-base font-medium transition-all ${
                        currentPageName === c.page
                          ? 'text-[#055b8e]'
                          : 'text-gray-500 hover:text-[#055b8e]'
                      }`}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
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
                {[
                  { name: 'About Us', page: 'AboutUs' },
                  { name: 'Activities', page: 'Learn' },
                  { name: 'Interactive Play', page: 'Play' },
                  { name: '5 Minutes of STEM', page: 'ThisWeekInSTEM' },
                  { name: 'Events', page: 'Events' },
                  { name: 'Careers', page: 'CareersInSTEM' },
                  { name: 'Make an Impact', page: 'MakeAnImpact' },
                ].map((link) => (
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