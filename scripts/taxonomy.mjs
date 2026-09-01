/* ============================================================================
   The skill taxonomy.

   Six strands → sixteen topics → forty-one skills. The sixteen topics come
   from the existing question bank, so nothing had to be re-tagged by hand;
   the skills below subdivide them so mastery means something more specific
   than "did some physics".

   Classification is deliberately a set of explicit, ordered keyword rules
   rather than anything statistical: a teacher or CQ admin can read this file,
   disagree with a call, and fix it in one line. `scripts/build-content.mjs`
   asserts that every question matches a rule, so a new question can never
   silently fall into an "other" bucket.
   ========================================================================= */

export const STRANDS = [
  { id: 'forces', name: 'Forces & Energy',     blurb: 'Why things move, stop, push, pull, heat up and slow down.',            sort: 1 },
  { id: 'matter', name: 'Matter & Waves',      blurb: 'What stuff is made of, and how light, sound and electricity travel.',  sort: 2 },
  { id: 'life',   name: 'Life Science',        blurb: 'Cells, bodies, plants, animals and the systems that connect them.',    sort: 3 },
  { id: 'earth',  name: 'Earth & Space',       blurb: 'Weather, rocks, resources, and everything past the atmosphere.',       sort: 4 },
  { id: 'build',  name: 'Engineering & Tech',  blurb: 'Designing, testing, building and programming things that work.',       sort: 5 },
  { id: 'method', name: 'Science Practices',   blurb: 'Measuring, testing fairly, and how scientists actually work.',         sort: 6 },
];

/** Topic → strand. Topic strings match the existing question bank exactly. */
export const TOPIC_STRAND = {
  'Forces & Motion': 'forces',
  Energy: 'forces',
  'Matter & Materials': 'matter',
  'Electricity & Magnetism': 'matter',
  'Light & Sound': 'matter',
  'Cells & Genetics': 'life',
  'Plants & Animals': 'life',
  Ecosystems: 'life',
  'Human Body': 'life',
  'Earth & Weather': 'earth',
  'Rocks & Resources': 'earth',
  'Space & Astronomy': 'earth',
  'Engineering & Design': 'build',
  'Technology & Computers': 'build',
  'Measurement & Method': 'method',
  'Science All-Stars': 'method',
};

/**
 * Skills, grouped by topic. Rules are tested in order; the LAST entry for each
 * topic has no `match` and acts as that topic's default, so coverage is total
 * by construction while still being explicit about what the default is.
 */
export const SKILLS_BY_TOPIC = {
  'Forces & Motion': [
    { id: 'forces.newton-laws',     name: "Newton's Laws",        match: /newton|inertia|action force|equal and opposite|acceleration|keeps moving|pushes off|steady speed/i },
    { id: 'forces.friction',        name: 'Friction',             match: /friction|slide|slides|smooth ice|rough grass|grip/i },
    { id: 'forces.gravity',         name: 'Gravity & Weight',     match: /gravity|pulls objects down|dropped together|lands first|falling/i },
    { id: 'forces.simple-machines', name: 'Simple Machines',      match: /lever|seesaw|ramp|inclined plane|pulley|simple machine|wedge|screw/i },
    { id: 'forces.push-pull',       name: 'Pushes & Pulls',       blurb: 'Identifying forces acting on an object.' },
  ],
  Energy: [
    { id: 'energy.transformation',  name: 'Energy Transformation', match: /changes mostly into|turns into|change form|conservation of energy|energy change happens|keeps changing back and forth/i },
    { id: 'energy.heat-transfer',   name: 'Heat Transfer',         match: /heat move|conduction|convection|radiation|warm air rising|through empty space/i },
    { id: 'energy.stored-motion',   name: 'Stored & Moving Energy',match: /stored energy|potential|kinetic|top of a hill|rubber band|pendulum/i },
    { id: 'energy.forms',           name: 'Forms of Energy',       blurb: 'Naming and spotting light, heat, sound, electrical and chemical energy.' },
  ],
  'Matter & Materials': [
    { id: 'matter.changes',    name: 'Physical & Chemical Change', match: /chemical change|physical change|mixture|dissolve|dissolves|solution|puddle slowly dries|freezes|boils and turns/i },
    { id: 'matter.properties', name: 'Density & Particles',        match: /density|mass packed|sink while|floats|particles|molecules/i },
    { id: 'matter.states',     name: 'States of Matter',           blurb: 'Solids, liquids and gases, and how matter behaves in each.' },
  ],
  'Electricity & Magnetism': [
    { id: 'em.magnetism', name: 'Magnetism',        match: /magnet|poles|magnetic|electromagnet/i },
    { id: 'em.static',    name: 'Static Charge',    match: /static|balloon|rubbing|charged particles/i },
    { id: 'em.circuits',  name: 'Circuits',         blurb: 'Complete paths, conductors, insulators and series circuits.' },
  ],
  'Light & Sound': [
    { id: 'waves.sound', name: 'Sound Waves',  match: /sound|vibrat|pitch|drum|guitar string|thunder|travels through solids/i },
    { id: 'waves.light', name: 'Light & Optics', blurb: 'Shadows, reflection, refraction and colour.' },
  ],
  'Cells & Genetics': [
    { id: 'life.heredity', name: 'Heredity & Traits', match: /trait|inherited|genes|dna|chromosome|parents|offspring|learned behavior|passed down|baby animal/i },
    { id: 'life.cells',    name: 'Cell Structure',    blurb: 'Cells as building blocks, and what the parts of a cell do.' },
  ],
  'Plants & Animals': [
    { id: 'life.plants',  name: 'Plant Structure & Growth', match: /plant|root|flower|leaves|cactus|stem|from the sun to help them grow/i },
    { id: 'life.animals', name: 'Animal Life & Adaptation', blurb: 'Life cycles, animal groups, classification and adaptations.' },
  ],
  Ecosystems: [
    { id: 'life.food-webs', name: 'Food Chains & Webs', match: /food chain|food web|predator|producer|decompos|plant-eaters|starting source of energy|hunt and eat/i },
    { id: 'life.habitats',  name: 'Habitats & Balance',  blurb: 'Habitats, biodiversity, competition and what happens when a web is disturbed.' },
  ],
  'Human Body': [
    { id: 'body.senses',  name: 'Senses & Skin',   match: /senses|smell|skin/i },
    { id: 'body.systems', name: 'Body Systems',    blurb: 'Circulatory, respiratory, skeletal, digestive and nervous systems.' },
  ],
  'Earth & Weather': [
    { id: 'earth.water-cycle', name: 'The Water Cycle',       match: /water cycle|turns into a gas|water vapor|condensation|cools and turns back/i },
    { id: 'earth.atmosphere',  name: 'Atmosphere & Seasons',  match: /seasons|layer of gases|atmosphere|sun gives earth/i },
    { id: 'earth.weather',     name: 'Weather & Climate',     blurb: 'Daily weather, clouds, precipitation, wind and how climate differs.' },
  ],
  'Rocks & Resources': [
    { id: 'earth.resources', name: 'Natural Resources',        match: /natural resource|renewable|nonrenewable|recycl|using items again/i },
    { id: 'earth.rocks',     name: 'Rocks & Earth Processes',  blurb: 'Rock types, soil, fossils, erosion, volcanoes and plate movement.' },
  ],
  'Space & Astronomy': [
    { id: 'space.observing',    name: 'Observing Space',   match: /telescope|light-year|astronaut|appear to float|sun mostly made of/i },
    { id: 'space.earth-motion', name: 'Earth, Sun & Moon', match: /daytime and nighttime|phases of the moon|different seasons|orbits earth/i },
    { id: 'space.solar-system', name: 'The Solar System',  blurb: 'Planets, the Sun, orbits and the scale of the solar system.' },
  ],
  'Engineering & Design': [
    { id: 'eng.structures', name: 'Structures & Materials', match: /bridge|tower|triangle|shape|stable|expansion joint|heavy trucks|strong wind/i },
    { id: 'eng.modelling',  name: 'Models & Robotics',      match: /robot|model|simulation/i },
    { id: 'eng.design-process', name: 'Design Process',     blurb: 'Defining a problem, prototyping, testing and iterating.' },
  ],
  'Technology & Computers': [
    { id: 'tech.programming', name: 'Programming Logic', match: /loop|order of steps|debugging|algorithm|program/i },
    { id: 'tech.safety',      name: 'Digital Safety',    match: /safe online|password/i },
    { id: 'tech.computing',   name: 'How Computers Work',blurb: 'Inputs, outputs, hardware, software, the internet and sensors.' },
  ],
  'Measurement & Method': [
    { id: 'method.fair-tests',  name: 'Fair Tests & Variables', match: /variable|control group|fair test|fair, what should you do/i },
    { id: 'method.inquiry',     name: 'Scientific Inquiry',     match: /hypothesis|observation and an inference|conclusion|first things scientists/i },
    { id: 'method.measurement', name: 'Measurement & Tools',    blurb: 'Choosing the right tool and the right metric unit.' },
  ],
  'Science All-Stars': [
    { id: 'method.history', name: 'Scientists & Discoveries', blurb: 'Who worked out what, and how their work still shows up today.' },
  ],
};

/** Skills that only hands-on and coding content feeds, so they need no rules. */
export const EXTRA_SKILLS = [
  { id: 'eng.hands-on',        strand: 'build',  name: 'Hands-On Building',   blurb: 'Following a build procedure carefully and making it work.' },
  { id: 'method.observation',  strand: 'method', name: 'Careful Observation', blurb: 'Noticing and recording what actually happened.' },
  { id: 'tech.python',         strand: 'build',  name: 'Python',              blurb: 'Variables, loops, functions and small programs in Python.' },
  { id: 'tech.java',           strand: 'build',  name: 'Java',                blurb: 'Types, classes and control flow in Java.' },
  { id: 'tech.web',            strand: 'build',  name: 'HTML & CSS',          blurb: 'Structuring and styling a web page.' },
];

export const ALL_SKILLS = [
  ...Object.entries(SKILLS_BY_TOPIC).flatMap(([topic, list], ti) =>
    list.map((s, i) => ({
      id: s.id,
      strand: TOPIC_STRAND[topic],
      topic,
      name: s.name,
      blurb: s.blurb || `${s.name} — part of ${topic}.`,
      sort: ti * 10 + i,
    })),
  ),
  ...EXTRA_SKILLS.map((s, i) => ({ ...s, topic: null, sort: 900 + i })),
];

/**
 * Classify one question. Never returns null — the last rule for a topic is its
 * default.
 *
 * Matching runs in widening passes: the prompt alone first, then the prompt
 * plus the explanation, then the answer options as well. Without that, a
 * ramp question whose explanation happens to mention "slide" gets pulled into
 * Friction. Narrow-first keeps precision high while the wider passes still
 * catch questions whose prompt is vague on its own.
 */
export function skillForQuestion(question) {
  const list = SKILLS_BY_TOPIC[question.category];
  if (!list) throw new Error(`Unknown topic: ${question.category}`);
  const passes = [
    question.q,
    `${question.q} ${question.explain || ''}`,
    `${question.q} ${question.explain || ''} ${(question.options || []).join(' ')}`,
  ];
  for (const hay of passes) {
    const matched = list.find((s) => s.match && s.match.test(hay));
    if (matched) return matched.id;
  }
  return list[list.length - 1].id;
}

/** Experiment topic → the skills a hands-on build in that topic exercises. */
export const EXPERIMENT_SKILLS = {
  physics:     ['forces.push-pull', 'energy.forms', 'eng.hands-on', 'method.observation'],
  chemistry:   ['matter.changes', 'matter.states', 'eng.hands-on', 'method.observation'],
  biology:     ['life.plants', 'life.animals', 'eng.hands-on', 'method.observation'],
  engineering: ['eng.design-process', 'eng.structures', 'eng.hands-on', 'method.observation'],
};

/** Experiment topic → which question topics can supply its check-for-understanding. */
export const EXPERIMENT_QUESTION_TOPICS = {
  physics: ['Forces & Motion', 'Energy'],
  chemistry: ['Matter & Materials'],
  biology: ['Plants & Animals', 'Cells & Genetics', 'Human Body'],
  engineering: ['Engineering & Design', 'Measurement & Method'],
};

export const CODING_SKILLS = {
  Python: ['tech.python', 'tech.programming'],
  Java: ['tech.java', 'tech.programming'],
  'HTML/CSS': ['tech.web', 'tech.computing'],
};

export const SUBJECT_QUIZ_TOPICS = {
  physics: ['Forces & Motion', 'Energy', 'Light & Sound'],
  chemistry: ['Matter & Materials'],
  biology: ['Cells & Genetics', 'Plants & Animals', 'Human Body', 'Ecosystems'],
  engineering: ['Engineering & Design', 'Technology & Computers'],
};
