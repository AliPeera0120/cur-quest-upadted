import React from 'react';
import { motion } from 'framer-motion';

const team = [
  {
    name: 'Alijawad Peera',
    role: 'Founder',
    image: 'https://media.base44.com/images/public/696594fc2acba2d4bc584513/8724722ea_Screenshot2026-04-06at110713PM.png',
    bio: "Hi! I'm Alijawad, a junior at Spring-Ford High School, and I'm hoping to pursue biomedical engineering in the future. I founded CuriosityQuest because I've always loved science, but more importantly, I wanted to make STEM something that feels exciting and accessible for everyone. Being able to create hands-on experiences for kids in my community means a lot to me, and I hope to inspire curiosity while working toward a future where I can make a real impact in engineering.",
  },
  {
    name: 'Naitik Chaudhary',
    role: 'Director of Outreach',
    image: 'https://media.base44.com/images/public/696594fc2acba2d4bc584513/ee6aca45e_Screenshot2026-04-06at110720PM.png',
    bio: "Hi! I'm Naitik, a freshman at Spring-Ford High School, and I'm planning to pursue quantitative finance. I joined CuriosityQuest because I wanted to help bring more opportunities to students who might not always have access to STEM resources. I enjoy working on outreach and building connections in the community, and it's really rewarding to know we're helping more students discover new interests and experiences.",
  },
  {
    name: 'Sparsh Kumar',
    role: 'Director of Communications',
    image: 'https://media.base44.com/images/public/696594fc2acba2d4bc584513/83ca71469_Screenshot2026-04-06at110727PM.png',
    bio: "Hi! I'm Sparsh, a freshman at Spring-Ford High School, and I'm interested in pursuing electrical engineering. I joined CuriosityQuest because I really liked the idea of making STEM more engaging and reaching more students through creative content. I enjoy working on how we present our ideas and connect with people, and I write our weekly newsletter, 5 Minutes Of STEM. It's been exciting to be part of something that encourages others to explore technology and innovation.",
  },
  {
    name: 'Sausan Fazel',
    role: 'Director of Marketing',
    image: 'https://media.base44.com/images/public/696594fc2acba2d4bc584513/f1205f4e0_Screenshot2026-04-06at110741PM.png',
    bio: "Hi, I'm Sausan, a freshman at Parkland High School, and I enjoy science and hope to pursue something in the science field. I love the idea of STEM because it can help students learn and be creative. I also enjoy editing videos and making them more engaging for people to watch. I am interested in helping present STEM ideas in a creative way.",
  },
];

export default function OurTeam() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Our Team
          </h2>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Meet the passionate students behind CuriosityQuest.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start"
            >
              <div className="w-24 h-24 rounded-full flex-shrink-0 border-4 border-[#055b8e]/20 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {member.name}
                </h3>
                <p className="text-[#ed7219] font-semibold text-sm mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}