/* ============================================================================
   Content build.

   Reads the legacy `src/data/*.json` files — which are the real CuriosityQuest
   content and the thing most worth protecting in this rebuild — and emits the
   new catalog:

     src/content/catalog.json   strands, skills, lessons, achievements  (small,
                                loaded with the app so search and filtering
                                work instantly)
     src/content/bank.json      activities and questions                (larger,
                                lazily imported only when a lesson is opened)

   Nothing is deleted. Every experiment, coding lesson, quiz question, Arena
   level and STEM brief that exists today comes out the other side with a
   stable id, and each lesson records where it came from in `source` so a
   later edit can be traced back.

   Run with:  npm run content
   ========================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STRANDS, TOPIC_STRAND, ALL_SKILLS, skillForQuestion,
  EXPERIMENT_SKILLS, EXPERIMENT_QUESTION_TOPICS, CODING_SKILLS, SUBJECT_QUIZ_TOPICS,
} from './taxonomy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'src/data', f), 'utf8'));

const labQuestions = read('labQuestions.json');
const experiments = read('experiments.json');
const coding = read('virtualActivities.json');
const arenaLevels = read('arenaLevels.json');
const arenaUnits = read('arenaUnits.json');
const subjectQuizzes = read('quizzes.json');
const stemPosts = read('stemPosts.json');
const labEquipment = read('labEquipment.json');

/* --------------------------------------------------------------- helpers --- */
const slug = (s) => String(s).toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TOPIC_SLUG = Object.fromEntries(Object.keys(TOPIC_STRAND).map((t) => [t, slug(t)]));

/* Deterministic shuffle so the same build always produces the same lesson
   contents — a lesson that silently re-orders between deploys would break the
   "same lesson, comparable score" promise. */
function seededOrder(items, seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const rand = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  return items.map((v) => ({ v, k: rand() })).sort((a, b) => a.k - b.k).map((x) => x.v);
}

const gradeForLevel = (level) => (level === 1 ? [3, 5] : level === 2 ? [4, 7] : [6, 8]);

/* ------------------------------------------------- question bank, tagged --- */
const questions = [];
const questionsByTopic = {};
const questionsBySkill = {};

labQuestions.forEach((q, i) => {
  const topic = q.category;
  const skillId = skillForQuestion(q);
  const id = `q.bank.${TOPIC_SLUG[topic]}.${String(i).padStart(3, '0')}`;
  const record = {
    id,
    kind: 'multiple_choice',
    prompt: q.q,
    choices: q.options,
    answer: q.answer,
    explanation: q.explain,
    skillId,
    topic,
    difficulty: q.level,
  };
  questions.push(record);
  (questionsByTopic[topic] ||= []).push(record);
  (questionsBySkill[skillId] ||= []).push(record);
});

/* Subject quizzes are a separate, slightly harder bank kept as assessments. */
const quizQuestions = {};
Object.entries(subjectQuizzes).forEach(([subject, list]) => {
  quizQuestions[subject] = list.map((q, i) => {
    const topics = SUBJECT_QUIZ_TOPICS[subject];
    /* Assign each quiz question to the best-fitting topic in its subject by
       running the same classifier against each candidate topic and taking the
       first non-default hit; falls back to the subject's primary topic. */
    let skillId = null;
    let topic = topics[0];
    for (const t of topics) {
      const probe = { ...q, category: t };
      const candidate = skillForQuestion(probe);
      const list2 = questionsBySkill[candidate];
      if (candidate && list2) { skillId = candidate; topic = t; break; }
    }
    if (!skillId) skillId = skillForQuestion({ ...q, category: topic });
    const id = `q.quiz.${subject}.${String(i).padStart(2, '0')}`;
    const record = {
      id, kind: 'multiple_choice', prompt: q.q, choices: q.options, answer: q.answer,
      explanation: q.explain, skillId, topic, difficulty: 2,
    };
    questions.push(record);
    return record;
  });
});

/* ---------------------------------------------------------------- lessons --- */
const lessons = [];
const activities = [];
let activitySeq = 0;

function addLesson(lesson, acts) {
  lessons.push(lesson);
  acts.forEach((a, i) => {
    activities.push({
      id: `a${String(++activitySeq).padStart(4, '0')}`,
      lessonId: lesson.id,
      position: i,
      required: a.required !== false,
      kind: a.kind,
      title: a.title || null,
      config: a.config || {},
      questionIds: a.questionIds || [],
    });
  });
}

/* --- 1. Topic missions: an Explorer tier and an Investigator tier ---------- */
const TIERS = [
  { key: 'explorer',     label: 'Explorer',     levels: [1, 2], take: 8,  difficulty: 1, grade: [3, 5],
    blurb: 'Start here. Builds the core ideas with plenty of support.' },
  { key: 'investigator', label: 'Investigator', levels: [2, 3], take: 8,  difficulty: 3, grade: [5, 8],
    blurb: 'Goes deeper, with the harder questions from this topic.' },
];

Object.keys(TOPIC_STRAND).forEach((topic) => {
  const strand = TOPIC_STRAND[topic];
  const pool = questionsByTopic[topic] || [];

  TIERS.forEach((tier) => {
    const eligible = pool.filter((q) => tier.levels.includes(q.difficulty));
    const picked = seededOrder(eligible, `${topic}:${tier.key}`).slice(0, Math.min(tier.take, eligible.length));
    if (picked.length < 4) return;
    const id = `mission.${TOPIC_SLUG[topic]}.${tier.key}`;
    const skillIds = [...new Set(picked.map((q) => q.skillId))];
    addLesson({
      id,
      title: `${topic}: ${tier.label}`,
      summary: `${tier.blurb} ${picked.length} questions across ${skillIds.length} ${skillIds.length === 1 ? 'skill' : 'skills'}.`,
      strandId: strand,
      subject: topic,
      gradeMin: tier.grade[0],
      gradeMax: tier.grade[1],
      difficulty: tier.difficulty,
      estMinutes: Math.max(6, Math.round(picked.length * 1.1)),
      objectives: skillIds.map((s) => ALL_SKILLS.find((x) => x.id === s)?.name).filter(Boolean),
      tags: ['#mission', `#${slug(topic)}`, `#${tier.key}`, tier.grade[0] <= 5 ? '#grades3-5' : '#grades6-8'],
      activityKinds: ['explain', 'quiz'],
      skills: skillIds.map((s) => ({ skillId: s, weight: 1 })),
      xpAward: 50,
      format: 'mission',
      status: 'published',
      source: { kind: 'labQuestions', topic, tier: tier.key },
    }, [
      { kind: 'explain', title: 'What you will practise',
        config: { skills: skillIds, note: `This mission draws on the ${topic} question bank.` } },
      { kind: 'quiz', title: `${topic} — ${tier.label}`,
        questionIds: picked.map((q) => q.id),
        config: { passPct: 70, shuffle: true, showExplanations: true } },
    ]);
  });

  /* --- 2. Quick Challenge: five questions, for exit tickets and short blocks */
  const quick = seededOrder(pool, `${topic}:quick`).slice(0, 5);
  if (quick.length === 5) {
    addLesson({
      id: `quick.${TOPIC_SLUG[topic]}`,
      title: `${topic}: 5-Question Challenge`,
      summary: `A five-question check on ${topic}. Designed to fit the last few minutes of a lesson.`,
      strandId: strand,
      subject: topic,
      gradeMin: 3, gradeMax: 8, difficulty: 2, estMinutes: 5,
      objectives: [`Quick check on ${topic}`],
      tags: ['#quick', '#exit-ticket', `#${slug(topic)}`],
      activityKinds: ['quiz'],
      skills: [...new Set(quick.map((q) => q.skillId))].map((s) => ({ skillId: s, weight: 0.6 })),
      xpAward: 20, format: 'quick', status: 'published',
      source: { kind: 'labQuestions', topic, tier: 'quick' },
    }, [
      { kind: 'quiz', title: `${topic} quick check`,
        questionIds: quick.map((q) => q.id),
        config: { passPct: 60, shuffle: true, showExplanations: true, compact: true } },
    ]);
  }
});

/* --- 3. Arena battles: the existing campaign, now unlocked ---------------- */
arenaLevels.forEach((lvl) => {
  const pool = lvl.topics.flatMap((t) => (questionsByTopic[t] || []).filter((q) => lvl.qLevels.includes(q.difficulty)));
  const fallback = pool.length >= 6 ? pool : lvl.topics.flatMap((t) => questionsByTopic[t] || []);
  const skillIds = [...new Set(fallback.map((q) => q.skillId))];
  const grade = gradeForLevel(Math.max(...lvl.qLevels));
  addLesson({
    id: `battle.${String(lvl.level).padStart(2, '0')}.${slug(lvl.boss)}`,
    title: lvl.boss,
    summary: `Arena battle ${lvl.level} of ${arenaLevels.length}. Correct answers charge your elixir — spend it to deploy units and bring down ${lvl.boss}.`,
    strandId: TOPIC_STRAND[lvl.topics[0]],
    subject: lvl.topics.join(' · '),
    gradeMin: grade[0], gradeMax: grade[1],
    difficulty: Math.max(...lvl.qLevels),
    estMinutes: 12,
    objectives: skillIds.map((s) => ALL_SKILLS.find((x) => x.id === s)?.name).filter(Boolean).slice(0, 5),
    tags: ['#battle', '#arena', `#chapter-${slug(lvl.chapter)}`],
    activityKinds: ['battle'],
    skills: skillIds.map((s) => ({ skillId: s, weight: 1 })),
    xpAward: 75, format: 'battle', status: 'published',
    source: { kind: 'arenaLevel', level: lvl.level, chapter: lvl.chapter },
    battle: {
      level: lvl.level, chapter: lvl.chapter, boss: lvl.boss, topics: lvl.topics,
      qLevels: lvl.qLevels, towerHp: lvl.towerHp, enemyRate: lvl.enemyRate,
      enemyDeck: lvl.enemyDeck, reward: lvl.reward,
    },
  }, [
    { kind: 'battle', title: `Battle: ${lvl.boss}`,
      questionIds: fallback.map((q) => q.id),
      config: {
        level: lvl.level, boss: lvl.boss, towerHp: lvl.towerHp,
        enemyDeck: lvl.enemyDeck, enemyRate: lvl.enemyRate, reward: lvl.reward,
        chapter: lvl.chapter,
      } },
  ]);
});

/* --- 4. Hands-on experiments, with a short check for understanding -------- */
experiments.forEach((exp) => {
  const diff = exp.difficulty === 'Beginner' ? 1 : exp.difficulty === 'Advanced' ? 3 : 2;
  const grade = diff === 1 ? [3, 5] : diff === 2 ? [4, 7] : [6, 8];
  const qTopics = EXPERIMENT_QUESTION_TOPICS[exp.topic] || [];
  const pool = qTopics.flatMap((t) => questionsByTopic[t] || []);
  const check = seededOrder(pool, `exp:${exp.id}`).slice(0, 3);
  const skills = [
    ...(EXPERIMENT_SKILLS[exp.topic] || []),
    ...check.map((q) => q.skillId),
  ];
  addLesson({
    id: `experiment.${slug(exp.topic)}.${slug(exp.title)}`,
    title: exp.title,
    summary: exp.what_you_learn,
    strandId: TOPIC_STRAND[qTopics[0]] || 'method',
    subject: exp.topic.charAt(0).toUpperCase() + exp.topic.slice(1),
    gradeMin: grade[0], gradeMax: grade[1], difficulty: diff,
    estMinutes: diff === 1 ? 15 : diff === 2 ? 25 : 35,
    objectives: [exp.what_you_learn],
    tags: ['#hands-on', '#experiment', `#${exp.topic}`, `#${slug(exp.difficulty)}`],
    activityKinds: ['intro', 'build', 'reflect', 'quiz'],
    skills: [...new Set(skills)].map((s) => ({ skillId: s, weight: s.startsWith('eng.hands-on') || s.startsWith('method.observation') ? 1 : 0.7 })),
    xpAward: diff === 1 ? 30 : diff === 2 ? 45 : 60,
    format: 'experiment', status: 'published',
    source: { kind: 'experiment', legacyId: exp.id, order: exp.order },
  }, [
    { kind: 'intro', title: 'Before you start',
      config: { materials: exp.materials, safety: true, learn: exp.what_you_learn } },
    { kind: 'build', title: 'Run the experiment',
      config: { steps: exp.instructions.split(/\s*\d+\.\s+/).filter(Boolean) } },
    { kind: 'reflect', title: 'What happened?',
      required: false,
      config: { prompts: ['What did you observe?', 'What surprised you?', 'What would you change if you ran it again?'] } },
    { kind: 'quiz', title: 'Check your thinking',
      questionIds: check.map((q) => q.id),
      config: { passPct: 60, showExplanations: true, compact: true } },
  ]);
});

/* --- 5. Coding courses --------------------------------------------------- */
const CODING_ORDER = { Python: 1, Java: 2, 'HTML/CSS': 3 };
coding.forEach((act) => {
  const diff = act.difficulty === 'Beginner' ? 1 : act.difficulty === 'Advanced' ? 3 : 2;
  addLesson({
    id: `code.${slug(act.language)}.${String(act.order).padStart(2, '0')}.${slug(act.title)}`,
    title: act.title,
    summary: act.description,
    strandId: 'build',
    subject: act.language,
    gradeMin: diff === 1 ? 4 : 6, gradeMax: 8, difficulty: diff,
    estMinutes: act.activity_type === 'Project' ? 45 : act.activity_type === 'Program' ? 25 : 15,
    objectives: [act.description],
    tags: ['#coding', `#${slug(act.language)}`, `#${slug(act.activity_type)}`, `#${slug(act.difficulty)}`],
    activityKinds: ['explain', 'reflect'],
    skills: (CODING_SKILLS[act.language] || ['tech.programming']).map((s) => ({ skillId: s, weight: 0.8 })),
    xpAward: act.activity_type === 'Project' ? 60 : 25,
    format: 'course', status: 'published',
    source: { kind: 'coding', legacyId: act.id, language: act.language, order: act.order,
              track: CODING_ORDER[act.language] || 9, activityType: act.activity_type },
  }, [
    { kind: 'explain', title: act.title, config: { markdown: act.content, language: act.language } },
    { kind: 'reflect', title: 'Try it yourself', required: false,
      config: { prompts: ['Paste the code you wrote or describe what you changed.', 'What went wrong the first time?'] } },
  ]);
});

/* --- 6. Subject assessments (usable as pre/post checks) ------------------ */
Object.entries(quizQuestions).forEach(([subject, list]) => {
  const skillIds = [...new Set(list.map((q) => q.skillId))];
  ['pre', 'post'].forEach((phase) => {
    addLesson({
      id: `assess.${subject}.${phase}`,
      title: `${subject.charAt(0).toUpperCase() + subject.slice(1)} ${phase === 'pre' ? 'Pre-Check' : 'Post-Check'}`,
      summary: phase === 'pre'
        ? `Twelve questions to find out what students already know about ${subject} before you teach it.`
        : `The same twelve questions, so you can see exactly how much moved.`,
      strandId: TOPIC_STRAND[list[0].topic] || 'method',
      subject: subject.charAt(0).toUpperCase() + subject.slice(1),
      gradeMin: 4, gradeMax: 8, difficulty: 2, estMinutes: 12,
      objectives: skillIds.map((s) => ALL_SKILLS.find((x) => x.id === s)?.name).filter(Boolean),
      tags: ['#assessment', `#${subject}`, `#${phase}-check`],
      activityKinds: ['quiz'],
      skills: skillIds.map((s) => ({ skillId: s, weight: 1.2 })),
      xpAward: 40, format: 'assessment', status: 'published',
      source: { kind: 'subjectQuiz', subject, phase },
    }, [
      { kind: 'quiz', title: `${subject} ${phase}-check`,
        questionIds: list.map((q) => q.id),
        config: { passPct: 0, shuffle: false, showExplanations: phase === 'post', assessment: true } },
    ]);
  });
});

/* --- 7. STEM briefs (the "5 Minutes of STEM" archive) ------------------- */
stemPosts.forEach((post) => {
  addLesson({
    id: `brief.${post.week_date}.${slug(post.title)}`,
    title: post.title,
    summary: post.summary,
    strandId: post.topic === 'technology' ? 'build' : post.topic === 'biology' ? 'life' : post.topic === 'engineering' ? 'build' : 'method',
    subject: '5 Minutes of STEM',
    gradeMin: 4, gradeMax: 8, difficulty: 1, estMinutes: 5,
    objectives: [post.summary],
    tags: ['#brief', '#reading', `#${post.topic}`],
    activityKinds: ['explain'],
    skills: [{ skillId: 'method.observation', weight: 0.3 }],
    xpAward: 10, format: 'brief', status: 'published',
    source: { kind: 'stemPost', legacyId: post.id, weekDate: post.week_date },
    brief: {
      weekDate: post.week_date,
      realWorld: post.real_world_connection,
      funFact: post.fun_fact,
    },
  }, [
    { kind: 'explain', title: post.title,
      config: { markdown: post.content, realWorld: post.real_world_connection, funFact: post.fun_fact } },
  ]);
});

/* ----------------------------------------------------------- achievements --- */
const achievements = [
  { id: 'first-mission',    name: 'First Mission',       description: 'Finish your first lesson.',                        icon: 'flag',      category: 'starting',   xp: 25,  criteria: { lessonsCompleted: 1 } },
  { id: 'experimenter',     name: 'Experimenter',        description: 'Complete 10 hands-on experiments.',                icon: 'flask',     category: 'hands-on',   xp: 100, criteria: { format: 'experiment', completed: 10 } },
  { id: 'lab-veteran',      name: 'Lab Veteran',         description: 'Complete 25 hands-on experiments.',                icon: 'flask',     category: 'hands-on',   xp: 200, criteria: { format: 'experiment', completed: 25 } },
  { id: 'problem-solver',   name: 'Problem Solver',      description: 'Answer 250 questions correctly.',                  icon: 'target',    category: 'practice',   xp: 150, criteria: { questionsCorrect: 250 } },
  { id: 'master-scientist', name: 'Master Scientist',    description: 'Reach Mastered on 10 different skills.',           icon: 'award',     category: 'mastery',    xp: 250, criteria: { skillsMastered: 10 } },
  { id: 'skill-starter',    name: 'Getting Somewhere',   description: 'Reach Proficient on your first skill.',            icon: 'trending',  category: 'mastery',    xp: 50,  criteria: { skillsProficient: 1 } },
  { id: 'curiosity-champ',  name: 'Curiosity Champion',  description: 'Practise a skill in all six science strands.',     icon: 'compass',   category: 'breadth',    xp: 200, criteria: { strandsTouched: 6 } },
  { id: 'engineer',         name: 'Engineer',            description: 'Complete 5 engineering challenges.',               icon: 'wrench',    category: 'breadth',    xp: 100, criteria: { strand: 'build', completed: 5 } },
  { id: 'arena-first',      name: 'First Victory',       description: 'Win your first Arena battle.',                     icon: 'swords',    category: 'arena',      xp: 60,  criteria: { format: 'battle', completed: 1 } },
  { id: 'arena-champion',   name: 'Arena Champion',      description: 'Win every battle in the Arena campaign.',          icon: 'trophy',    category: 'arena',      xp: 400, criteria: { format: 'battle', completed: arenaLevels.length } },
  { id: 'comeback',         name: 'Comeback',            description: 'Improve a lesson score by 25 points or more.',     icon: 'trending',  category: 'growth',     xp: 100, criteria: { improvement: 25 } },
  { id: 'coder',            name: 'Code Cadet',          description: 'Finish 10 coding lessons.',                        icon: 'terminal',  category: 'breadth',    xp: 100, criteria: { format: 'course', completed: 10 } },
  { id: 'reader',           name: 'Well Read',           description: 'Read 8 "5 Minutes of STEM" briefs.',               icon: 'book',      category: 'breadth',    xp: 60,  criteria: { format: 'brief', completed: 8 } },
  { id: 'passport-half',    name: 'Half the Map',        description: 'Reach Developing or better in 3 strands.',         icon: 'map',       category: 'breadth',    xp: 120, criteria: { strandsDeveloping: 3 } },
  { id: 'deep-diver',       name: 'Deep Diver',          description: 'Reach Mastered on every skill in one strand.',     icon: 'layers',    category: 'mastery',    xp: 300, criteria: { strandMastered: 1 } },
];

/* ------------------------------------------------------------------ write --- */
const catalog = {
  builtAt: null, /* deliberately null: a build timestamp would make the file
                    churn on every run and pollute git diffs */
  strands: STRANDS,
  skills: ALL_SKILLS.map(({ id, strand, topic, name, blurb, sort }) => ({ id, strandId: strand, topic, name, blurb, sort })),
  lessons: lessons.map((l) => ({ ...l, version: 1 })),
  achievements,
  arenaUnits,
  labEquipment,
  stats: {
    lessons: lessons.length,
    questions: questions.length,
    skills: ALL_SKILLS.length,
    byFormat: lessons.reduce((a, l) => ({ ...a, [l.format]: (a[l.format] || 0) + 1 }), {}),
  },
};

const bank = {
  activities,
  questions: questions.reduce((acc, q) => { acc[q.id] = q; return acc; }, {}),
};

/* A third, tiny file. The public marketing pages need real counts and a few
   real lessons to show, but they must not pull a quarter-megabyte catalog into
   the first paint — so they get this instead, and the full catalog is a lazy
   chunk fetched only when someone enters the Arena. */
const FEATURED = [
  'battle.01.inertia-imp',
  'mission.forces-motion.explorer',
  'mission.energy.investigator',
  'quick.ecosystems',
  'assess.physics.pre',
];
const featured = lessons
  .filter((l) => FEATURED.includes(l.id))
  .concat(
    ['experiment', 'course', 'brief'].map((f) => lessons.find((l) => l.format === f)).filter(Boolean),
  )
  .map((l) => ({
    id: l.id, title: l.title, summary: l.summary, strandId: l.strandId, subject: l.subject,
    gradeMin: l.gradeMin, gradeMax: l.gradeMax, difficulty: l.difficulty,
    estMinutes: l.estMinutes, format: l.format, tags: l.tags,
  }));

/* Three real questions, shipped with the marketing bundle so the homepage can
   let a visitor actually answer one instead of describing what answering is
   like. Picked by hand for breadth and for being answerable without setup. */
const SAMPLE_IDS = ['forces.friction', 'life.food-webs', 'eng.structures', 'space.earth-motion'];
const sampleQuestions = SAMPLE_IDS
  .map((skillId) => {
    const pool = questionsBySkill[skillId] || [];
    return pool.find((q) => q.difficulty === 1) || pool.find((q) => q.difficulty === 2) || pool[0];
  })
  .filter(Boolean)
  .map((q) => ({
    id: q.id, prompt: q.prompt, choices: q.choices, answer: q.answer,
    explanation: q.explanation, topic: q.topic, difficulty: q.difficulty,
    skillId: q.skillId,
    skillName: ALL_SKILLS.find((s) => s.id === q.skillId)?.name || q.topic,
    strandId: TOPIC_STRAND[q.topic],
  }));

const summary = {
  sampleQuestions,
  stats: {
    ...catalog.stats,
    activities: activities.length,
    strands: STRANDS.length,
    experiments: lessons.filter((l) => l.format === 'experiment').length,
    codingLessons: lessons.filter((l) => l.format === 'course').length,
    battles: lessons.filter((l) => l.format === 'battle').length,
    briefs: lessons.filter((l) => l.format === 'brief').length,
  },
  strands: STRANDS.map((s) => ({
    ...s,
    skillCount: ALL_SKILLS.filter((k) => k.strand === s.id).length,
    lessonCount: lessons.filter((l) => l.strandId === s.id).length,
  })),
  featured,
};

fs.mkdirSync(path.join(root, 'src/content'), { recursive: true });
fs.writeFileSync(path.join(root, 'src/content/summary.json'), `${JSON.stringify(summary, null, 1)}\n`);
fs.writeFileSync(path.join(root, 'src/content/catalog.json'), `${JSON.stringify(catalog, null, 1)}\n`);
fs.writeFileSync(path.join(root, 'src/content/bank.json'), `${JSON.stringify(bank)}\n`);

/* ------------------------------------------------------------ integrity --- */
const errors = [];
const qIds = new Set(questions.map((q) => q.id));
const skillIds = new Set(ALL_SKILLS.map((s) => s.id));
for (const a of activities) {
  for (const id of a.questionIds) if (!qIds.has(id)) errors.push(`activity ${a.id} references missing question ${id}`);
}
for (const l of lessons) {
  for (const s of l.skills) if (!skillIds.has(s.skillId)) errors.push(`lesson ${l.id} references missing skill ${s.skillId}`);
  if (!activities.some((a) => a.lessonId === l.id)) errors.push(`lesson ${l.id} has no activities`);
}
const dupes = lessons.map((l) => l.id).filter((id, i, arr) => arr.indexOf(id) !== i);
if (dupes.length) errors.push(`duplicate lesson ids: ${[...new Set(dupes)].join(', ')}`);

/* Nothing from the legacy files may be dropped on the floor. */
const covered = (kind, n) => {
  const got = lessons.filter((l) => l.source.kind === kind).length;
  if (got < n) errors.push(`only ${got} of ${n} ${kind} items were migrated`);
};
covered('experiment', experiments.length);
covered('coding', coding.length);
covered('arenaLevel', arenaLevels.length);
covered('stemPost', stemPosts.length);

if (errors.length) {
  console.error('\nContent build FAILED:');
  errors.forEach((e) => console.error(`  · ${e}`));
  process.exit(1);
}

const kb = (p) => `${(fs.statSync(path.join(root, p)).size / 1024).toFixed(0)} KB`;
console.log('Content build OK');
console.log(`  strands ......... ${catalog.strands.length}`);
console.log(`  skills .......... ${catalog.skills.length}`);
console.log(`  lessons ......... ${lessons.length}   ${Object.entries(catalog.stats.byFormat).map(([k, v]) => `${k}:${v}`).join('  ')}`);
console.log(`  activities ...... ${activities.length}`);
console.log(`  questions ....... ${questions.length}`);
console.log(`  achievements .... ${achievements.length}`);
console.log(`  summary.json .... ${kb('src/content/summary.json')}`);
console.log(`  catalog.json .... ${kb('src/content/catalog.json')}`);
console.log(`  bank.json ....... ${kb('src/content/bank.json')}`);
