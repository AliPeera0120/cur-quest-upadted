import React from 'react';
import { GraduationCap, Home, Library, School } from 'lucide-react';
import { motion } from 'framer-motion';

const audiences = [
  {
    icon: GraduationCap,
    title: 'Students',
    description: 'Kids ages 8–16 who love to ask "why?" and want to find out for themselves through experiments and exploration.',
    gradient: 'from-[#055b8e] to-[#0a7bc0]',
  },
  {
    icon: Home,
    title: 'Families',
    description: 'Parents and guardians looking for quality STEM activities to do together at home or on weekends.',
    gradient: 'from-[#ed7219] to-[#f58c3d]',
  },
  {
    icon: Library,
    title: 'Libraries',
    description: 'Public libraries hosting engaging programs that bring communities together around science and learning.',
    gradient: 'from-[#055b8e] to-[#0a7bc0]',
  },
  {
    icon: School,
    title: 'Educators',
    description: 'Teachers and group leaders looking for hands-on activities and resources to inspire young learners.',
    gradient: 'from-[#ed7219] to-[#f58c3d]',
  },
];

export default function WhoItsFor() {
  return (
    <section className="py-20 bg-white">
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
            Who It's For
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            CuriosityQuest is designed for curious minds of all kinds
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center group"
            >
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${audience.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                <audience.icon className="w-10 h-10 text-white" />
              </div>
              <h3 
                className="font-bold text-[#055b8e] text-xl mb-2"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {audience.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {audience.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}