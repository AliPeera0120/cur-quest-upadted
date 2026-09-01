import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button, Kicker, Reveal } from '@/components/cq';
import { Band, TextLink } from '@/components/marketing/Sections.jsx';
import Meta from '@/shell/Meta.jsx';
import team from '@/data/team.json';

const IMPACT = [
  { value: '10+', label: 'Community events' },
  { value: '$1,000+', label: 'Donations & funding raised' },
];

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
        title="Student-led STEM programs with measurable community impact"
        description="CuriosityQuest expands access to hands-on STEM education through community workshops, educational resources, and student-led outreach."
      />

      <section className="relative overflow-hidden border-b border-blue-700 bg-blue-800 text-white">
        <div className="cq-container py-16 cb:py-20">
          <div className="max-w-[58rem]">
            <Kicker onDark pill>Student-led STEM nonprofit</Kicker>
            <h1 className="mt-6 text-display text-white">CuriosityQuest</h1>
            <p className="mt-5 max-w-[48rem] text-lead leading-relaxed text-white/80">
              Expanding access to hands-on STEM education through community workshops,
              educational resources, and student-led outreach.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#impact" size="lg" variant="accent">
                Explore Our Impact <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <Button to="/get-involved" size="lg" variant="onDark">Get Involved</Button>
            </div>
          </div>

          <dl id="impact" className="mt-10 grid max-w-[46rem] overflow-hidden rounded-lg border border-white/15 bg-white/[0.06] sm:grid-cols-2">
            {IMPACT.map((item, index) => (
              <div
                key={item.label}
                className={`px-6 py-6 cb:px-8 ${index ? 'border-t border-white/15 sm:border-l sm:border-t-0' : ''}`}
              >
                <dd className="cq-data text-[clamp(2rem,1.5rem+1.7vw,3rem)] font-bold text-white">{item.value}</dd>
                <dt className="mt-1 text-sm font-medium text-white/65">{item.label}</dt>
              </div>
            ))}
          </dl>
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

      <section className="border-b border-line bg-white">
        <div className="cq-container cq-section--tight">
          <div className="grid gap-8 cb:grid-cols-[0.8fr_1.2fr] cb:gap-16">
            <Reveal>
              <Kicker pill>What we do</Kicker>
              <h2 className="mt-4 text-h2">We turn curiosity into hands-on learning.</h2>
            </Reveal>
            <Reveal delay={80} className="max-w-[44rem] space-y-4 text-lead leading-relaxed text-ink-600">
              <p>
                CuriosityQuest is a student-led nonprofit that brings practical STEM experiences to children and families. We create workshops, activities, and educational content that make science feel accessible—not distant or intimidating.
              </p>
              <p>
                Our work gives young learners more opportunities to build, test, ask questions, and discover what they can do.
              </p>
            </Reveal>
          </div>
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

      <section className="bg-blue-800 text-white">
        <div className="cq-container cq-section--tight">
          <div className="grid gap-8 cb:grid-cols-[1.2fr_auto] cb:items-end cb:gap-12">
            <div className="max-w-[46rem]">
              <Kicker onDark pill>Get involved</Kicker>
              <h2 className="mt-4 text-h2 text-white">Help bring more STEM experiences into the community.</h2>
              <p className="mt-4 text-lead leading-relaxed text-white/70">
                We welcome organizations, schools, volunteers, and sponsors who want to expand access to hands-on learning.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button to="/get-involved" variant="accent" size="lg">Partner With Us</Button>
              <Button to="/get-involved" variant="onDark" size="lg">Volunteer</Button>
              <Button to="/explore" variant="outlineOnDark" size="lg">Explore Our Programs</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
