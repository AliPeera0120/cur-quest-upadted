import React from 'react';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Events() {
  const upcomingEvents = [
    {
      title: "Phoenixville Library STEM Event",
      date: "June 17th, 2026",
      time: "2:30 PM - 3:15 PM",
      ageGroup: "Ages 8-11",
      location: "Phoenixville Library",
      description: "Join us at the Phoenixville Library for a fun, hands-on STEM session! Kids ages 8–11 will explore exciting science experiments and discover how science, technology, engineering, and math show up in everyday life. Come ready to experiment, discover, and have a blast!",
      posterUrl: "/images/event-phoenixville-library.png"
    }
  ];

  const events = [
    {
      title: "CuriosityQuest at Earth Day Phoenixville",
      date: "April 18th, 2026",
      time: "12:00 PM – 4:00 PM",
      ageGroup: "All Ages",
      location: "Reservoir Park, Phoenixville",
      description: "Join us at Phoenixville Earth Day for an afternoon of hands-on STEM and real-world environmental learning. We'll be running interactive experiments where you can explore how science helps protect our planet, including a live oil spill cleanup demo and more activities using everyday materials. Come by, get involved, and see how STEM can make a real impact in our ecosystem. Bring friends, stop by our booth, and learn something new!",
      posterUrl: "/images/event-earth-day.png"
    },
    {
      title: "Elephant Toothpaste Adventure",
      date: "July 23rd, 2025",
      time: "2:00 PM - 2:45 PM",
      ageGroup: "Ages 8-11",
      location: "Phoenixville Area Library",
      description: "Time to mix science and fun and make foam fly! In this exciting experiment, kids will create a foamy explosion that looks just like a giant tube of toothpaste—perfect for an elephant! Using simple ingredients like hydrogen peroxide, soap, and yeast, they'll learn about chemical reactions and how substances break down to create bubbles and foam. It's a hands-on, exciting way to see science in action while having a blast doing it!",
      posterUrl: "/images/event-science-fun.png"
    },
    {
      title: "Lava Lamp Fun",
      date: "July 16th, 2025",
      time: "2:00 PM - 2:45 PM",
      ageGroup: "Ages 8-11",
      location: "Phoenixville Area Library",
      description: "Get ready for some fizzy fun! In this experiment, kids will make their very own lava lamps using water, oil, Alka-Seltzer, and a splash of food coloring. Kids will get to see science in action while learning about density and chemical reactions in a way that's super fun and easy to understand. This event gives kids the chance to have fun and learn new things in the summer.",
      posterUrl: "/images/event-science-fun.png"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#ed7219] mb-4"
          >
            <Calendar className="w-7 h-7 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Events
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/80 max-w-2xl mx-auto"
          >
            Hands-on STEM experiments and community learning experiences
          </motion.p>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-4">
        <h2 className="text-2xl font-bold text-[#055b8e] mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No upcoming events yet — check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden"
              >
                <div className="grid lg:grid-cols-5 gap-0">
                  {event.posterUrl && (
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#ed7219]/10 to-[#055b8e]/10 p-6 flex items-center justify-center">
                      <img
                        src={event.posterUrl}
                        alt={`${event.title} Poster`}
                        className="w-full max-w-xs rounded-xl shadow-lg"
                      />
                    </div>
                  )}
                  <div className={`${event.posterUrl ? 'lg:col-span-3' : 'lg:col-span-5'} p-6 lg:p-8`}>
                    <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full px-3 py-1 mb-3">Upcoming</span>
                    <h3 className="text-2xl font-bold text-[#055b8e] mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>{event.title}</h3>
                    <p className="text-[#ed7219] font-semibold mb-4">{event.date}</p>
                    <div className="flex flex-wrap gap-3 mb-4 text-sm">
                      <span className="flex items-center gap-1 bg-[#055b8e]/5 rounded-full px-3 py-1">
                        <Clock className="w-4 h-4 text-[#055b8e]" />
                        <span className="text-[#055b8e] font-medium">{event.time}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-[#055b8e]/5 rounded-full px-3 py-1">
                        <MapPin className="w-4 h-4 text-[#ed7219]" />
                        <span className="text-[#055b8e] font-medium">{event.location}</span>
                      </span>
                      <span className="flex items-center gap-1 bg-[#ed7219]/10 rounded-full px-3 py-1">
                        <Users className="w-4 h-4 text-[#ed7219]" />
                        <span className="text-[#ed7219] font-medium">{event.ageGroup}</span>
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Events */}
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-12">
        <h2 className="text-2xl font-bold text-[#055b8e] mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>Previous Events</h2>
        <div className="space-y-8">
          {events.map((event, index) => (
            <motion.section
              key={event.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className="bg-white rounded-2xl overflow-hidden shadow border border-gray-100"
            >
              <div className="grid lg:grid-cols-5 gap-0">
                {/* Poster Image */}
                <div className="lg:col-span-2 bg-gradient-to-br from-[#ed7219]/10 to-[#055b8e]/10 p-6 flex items-center justify-center">
                  <img 
                    src={event.posterUrl}
                    alt={`${event.title} Poster`}
                    className="w-full max-w-xs rounded-xl shadow-lg"
                  />
                </div>

                {/* Event Details */}
                <div className="lg:col-span-3 p-6 lg:p-8">
                  <h3 
                    className="text-2xl font-bold text-[#055b8e] mb-1"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {event.title}
                  </h3>
                  <p className="text-[#ed7219] font-semibold mb-4">{event.date}</p>

                  <div className="flex flex-wrap gap-3 mb-4 text-sm">
                    <span className="flex items-center gap-1 bg-[#055b8e]/5 rounded-full px-3 py-1">
                      <MapPin className="w-4 h-4 text-[#ed7219]" />
                      <span className="text-[#055b8e] font-medium">{event.location}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-[#055b8e]/5 rounded-full px-3 py-1">
                      <Clock className="w-4 h-4 text-[#055b8e]" />
                      <span className="text-[#055b8e] font-medium">{event.time}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-[#ed7219]/10 rounded-full px-3 py-1">
                      <Users className="w-4 h-4 text-[#ed7219]" />
                      <span className="text-[#ed7219] font-medium">{event.ageGroup}</span>
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed">{event.description}</p>
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-[#055b8e] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-lg mb-2">
            Questions about our events?
          </p>
          <a 
            href="mailto:curiosity.quest25@gmail.com" 
            className="text-[#ed7219] hover:underline font-semibold"
          >
            curiosity.quest25@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}