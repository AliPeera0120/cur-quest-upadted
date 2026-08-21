import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Beaker, Monitor, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const activities = [
  {
    icon: Beaker,
    title: 'Hands-On Experiments',
    description: 'Real science projects you can do at home or in a group. Mix, build, test, and discover!',
    color: 'bg-[#ed7219]',
    link: 'Activities',
  },
  {
    icon: Monitor,
    title: 'Virtual STEM Activities',
    description: 'Learn coding basics, logic puzzles, and how computers think—no experience needed.',
    color: 'bg-[#055b8e]',
    link: 'Activities',
  },
  {
    icon: Calendar,
    title: 'Community Events',
    description: 'Join us at local libraries and community centers for free, fun STEM workshops.',
    color: 'bg-[#ed7219]',
    link: 'Events',
  },
  {
    icon: BookOpen,
    title: 'Weekly STEM Learning',
    description: 'New topics every week! Explore questions like "How do computers see?" and more.',
    color: 'bg-[#055b8e]',
    link: 'ThisWeekInSTEM',
  },
];

export default function WhatWeDo() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 
            className="text-3xl sm:text-4xl font-bold text-[#055b8e] mb-4"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            What We Do
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From kitchen chemistry to coding adventures, there's always something new to explore
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((activity, index) => (
            <motion.div
              key={activity.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                to={createPageUrl(activity.link)}
                className="block h-full bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all group border border-gray-100"
              >
                <div className={`w-14 h-14 rounded-xl ${activity.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <activity.icon className="w-7 h-7 text-white" />
                </div>
                <h3 
                  className="font-bold text-[#055b8e] text-xl mb-2"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {activity.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {activity.description}
                </p>
                <span className="inline-flex items-center text-[#ed7219] font-medium group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}