import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Kicker, Reveal } from '@/components/cq';
import { Band, TextLink } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';
import team from '@/data/team.json';

const EMAIL = 'curiosity.quest25@gmail.com';

const PROGRAMS = [
  {
    number: '01',
    title: 'Community STEM Events',
    description: 'Hands-on workshops created with libraries, recreation departments, and local partners.',
    to: '/programs',
    action: 'View events',
  },
  {
    number: '02',
    title: 'STEM Activities & Curriculum',
    description: 'Practical experiments and learning resources that make STEM approachable and engaging.',
    to: '/explore/experiments',
    action: 'Explore activities',
  },
  {
    number: '03',
    title: '5 Minutes of STEM',
    description: 'Short, accessible explainers that help students explore one new STEM idea at a time.',
    to: '/explore/briefs',
    action: 'Start reading',
  },
  {
    number: '04',
    title: 'Science Arena',
    description: 'An interactive learning platform where students explore freely and teachers can see mastery.',
    to: '/arena',
    action: 'Enter the Arena',
  },
];

export default function Home() {
  return (
    <>
      <Meta
        title="Hands-on STEM, built by students"
        description="CuriosityQuest is expanding access to hands-on STEM education throughout the community through free workshops, educational resources, and interactive learning."
      />

      <section className="cq-wash border-b border-line bg-white">
        <div className="cq-container py-12 cb:py-16">
          <div className="grid items-center gap-10 cb:grid-cols-[1.05fr_0.95fr] cb:gap-16">
            <div className="min-w-0">
              <Kicker pill>Student-led STEM nonprofit</Kicker>
              <h1 className="mt-5 max-w-[14ch] text-display text-ink-900">
                Hands-on STEM, built by students.
              </h1>
              <p className="mt-5 max-w-[46rem] text-lead leading-relaxed text-ink-600">
                Expanding access to hands-on STEM education throughout the community.
                We create free workshops, practical learning resources, and interactive
                science experiences for young people.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button to="/programs" size="lg" variant="accent">
                  Explore What We Built <ArrowRight size={17} aria-hidden="true" />
                </Button>
                <Button to="/get-involved#volunteer" size="lg" variant="primary">Volunteer</Button>
                <Button href={`mailto:${EMAIL}`} size="lg" variant="ghost">Email Us</Button>
              </div>

              <div className="mt-9 grid max-w-[44rem] gap-4 border-t border-line pt-6 sm:grid-cols-3">
                {[
                  ['Community workshops', 'Hands-on programs with local partners'],
                  ['Free resources', 'Experiments and short STEM explainers'],
                  ['Science Arena', 'Interactive learning for students and teachers'],
                ].map(([title, body]) => (
                  <div key={title}>
                    <p className="text-sm font-bold text-ink-900">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <Reveal className="min-w-0">
              <div className="overflow-hidden rounded-lg border border-line bg-paper-2 shadow-md">
                <img
                  src="/images/hands-on-workshop.jpg"
                  alt="Children taking part in a hands-on CuriosityQuest STEM activity"
                  className="aspect-[4/3] w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                <div className="flex items-center justify-between gap-4 border-t border-line bg-white px-5 py-4">
                  <p className="text-sm font-semibold text-ink-800">Learning by building, testing, and asking questions.</p>
                  <span className="shrink-0 rounded-pill bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">Free programs</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="team" className="border-b border-line bg-white">
        <div className="cq-container py-12 cb:py-14">
          <Reveal className="max-w-[42rem]">
            <Kicker pill>Meet the team</Kicker>
            <h2 className="mt-4 text-h2">The students behind CuriosityQuest.</h2>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {team.map((member, index) => (
              <Reveal key={member.id} delay={index * 60} className="overflow-hidden rounded-lg border border-line bg-paper-2">
                <img
                  src={member.image}
                  alt={`${member.name}, ${member.role} at CuriosityQuest`}
                  className="aspect-[4/3] w-full object-cover object-top"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
                <div className="p-5">
                  <h3 className="text-h4 font-bold text-ink-900">{member.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-blue-600">{member.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <TextLink to="/about" className="mt-6">Read our story</TextLink>
        </div>
      </section>

      <section className="bg-paper-2">
        <div className="cq-container cq-section--tight">
          <div className="grid items-center gap-10 cb:grid-cols-2 cb:gap-16">
            <Reveal>
              <img
                src="/images/community-event.jpg"
                alt="CuriosityQuest student leaders at a community STEM event"
                className="aspect-[4/3] w-full rounded-lg object-cover shadow-sm"
              />
            </Reveal>
            <Reveal delay={80}>
              <Kicker pill>In the community</Kicker>
              <h2 className="mt-4 text-h2">Programs built with local partners.</h2>
              <p className="mt-4 text-lead leading-relaxed text-ink-600">
                We organize hands-on STEM programs with libraries, recreation departments,
                schools, and community organizations. Each partnership helps us reach students
                where they already learn, gather, and feel at home.
              </p>
              <p className="mt-5 text-sm font-semibold text-ink-700">
                10+ community events <span className="mx-2 text-ink-300">·</span> $1,000+ raised to support programming
              </p>
              <TextLink to="/programs" className="mt-6">See our community events</TextLink>
            </Reveal>
          </div>
        </div>
      </section>

      <Band
        kicker="Programs & resources"
        title="Four clear ways to explore."
        lede="Start with a community program, use a ready-to-go activity, or explore STEM in a few focused minutes."
        dense
      >
        <div className="grid border-y border-line sm:grid-cols-2 cb:grid-cols-4">
          {PROGRAMS.map((program, index) => (
            <Reveal
              as="article"
              key={program.title}
              delay={index * 50}
              className={`flex min-h-[16rem] flex-col py-7 sm:px-6 cb:px-7 ${
                index ? 'border-t border-line sm:border-l sm:border-t-0' : ''
              } ${index === 2 ? 'sm:border-l-0 sm:border-t cb:border-l cb:border-t-0' : ''}`}
            >
              <p className="cq-data text-micro font-semibold text-orange-700">{program.number}</p>
              <h3 className="mt-5 text-h4 font-bold text-blue-700">{program.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">{program.description}</p>
              <TextLink to={program.to} className="mt-6">{program.action}</TextLink>
            </Reveal>
          ))}
        </div>
      </Band>

      <section className="border-y border-line bg-paper-2">
        <div className="cq-container cq-section--tight">
          <div className="grid gap-8 rounded-lg border border-line bg-white p-7 shadow-sm cb:grid-cols-[1.2fr_auto] cb:items-end cb:gap-12 cb:p-10">
            <div className="max-w-[46rem]">
              <Kicker pill>Get involved</Kicker>
              <h2 className="mt-4 text-h2 text-ink-900">Help bring more STEM experiences into the community.</h2>
              <p className="mt-4 text-lead leading-relaxed text-ink-600">
                We welcome organizations, schools, volunteers, and sponsors who want to expand access to hands-on learning.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button to="/get-involved" variant="accent" size="lg">Partner With Us</Button>
              <Button to="/get-involved" variant="outline" size="lg">Volunteer</Button>
              <Button to="/explore" variant="ghost" size="lg">Explore Our Programs</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
