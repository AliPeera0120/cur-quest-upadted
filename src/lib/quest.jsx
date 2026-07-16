/**
 * Quest Passport — the learning-progress engine for CuriosityQuest.
 *
 * All progress is stored in the browser (localStorage), so kids keep their
 * passport between visits without needing an account. Wrap the app in
 * <QuestProvider> and read/update progress anywhere with useQuest().
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { toast } from '@/components/ui/use-toast';
import experiments from '@/data/experiments.json';
import virtualActivities from '@/data/virtualActivities.json';
import stemPosts from '@/data/stemPosts.json';

const STORAGE_KEY = 'cq_quest_passport_v1';

// ---------- XP + Levels ----------
export const XP_RULES = {
  experiment: { Beginner: 20, Medium: 35, Advanced: 50 },
  lesson: 25,
  post: 10,
  quizCorrect: 5,
  quizPerfectBonus: 15,
  playgroundHit: 5,
};

export const LEVELS = [
  { level: 1, name: 'Curious Cadet', emoji: '🐣', minXp: 0 },
  { level: 2, name: 'Junior Scientist', emoji: '🔬', minXp: 100 },
  { level: 3, name: 'Lab Explorer', emoji: '🧭', minXp: 250 },
  { level: 4, name: 'STEM Adventurer', emoji: '🚀', minXp: 500 },
  { level: 5, name: 'Quest Master', emoji: '🌟', minXp: 900 },
  { level: 6, name: 'Lab Legend', emoji: '🏆', minXp: 1400 },
];

export const levelForXp = (xp) =>
  [...LEVELS].reverse().find((l) => xp >= l.minXp) || LEVELS[0];

export const nextLevel = (xp) => LEVELS.find((l) => l.minXp > xp) || null;

// ---------- Topic totals (computed from real content) ----------
const topicTotals = experiments.reduce((acc, e) => {
  acc[e.topic] = (acc[e.topic] || 0) + 1;
  return acc;
}, {});

// ---------- Badges ----------
export const BADGES = [
  { id: 'first-quest', name: 'First Steps', emoji: '👣', desc: 'Complete your very first activity' },
  { id: 'hands-on-5', name: 'Hands-On Hero', emoji: '🧤', desc: 'Complete 5 experiments' },
  { id: 'hands-on-15', name: 'Experiment Master', emoji: '⚗️', desc: 'Complete 15 experiments' },
  { id: 'physics-whiz', name: 'Physics Whiz', emoji: '🎢', desc: 'Complete every physics experiment' },
  { id: 'chem-champion', name: 'Chemistry Champion', emoji: '🧪', desc: 'Complete every chemistry experiment' },
  { id: 'bio-boss', name: 'Biology Boss', emoji: '🌱', desc: 'Complete every biology experiment' },
  { id: 'engineer-elite', name: 'Engineering Elite', emoji: '🏗️', desc: 'Complete every engineering experiment' },
  { id: 'well-rounded', name: 'Well-Rounded', emoji: '🌈', desc: 'Do at least one experiment in every topic' },
  { id: 'coder-5', name: 'Code Cadet', emoji: '💻', desc: 'Finish 5 coding lessons' },
  { id: 'coder-15', name: 'Code Wizard', emoji: '🧙', desc: 'Finish 15 coding lessons' },
  { id: 'bookworm', name: 'Bookworm', emoji: '📚', desc: 'Read 5 "5 Minutes of STEM" posts' },
  { id: 'news-hound', name: 'News Hound', emoji: '🕵️', desc: 'Read 10 "5 Minutes of STEM" posts' },
  { id: 'quiz-taker', name: 'Quiz Rookie', emoji: '✏️', desc: 'Finish your first quiz' },
  { id: 'quiz-ace', name: 'Quiz Ace', emoji: '💯', desc: 'Score 100% on any quiz' },
  { id: 'brainiac', name: 'Brainiac', emoji: '🧠', desc: 'Score 80%+ on all four topic quizzes' },
  { id: 'sharpshooter', name: 'Sharpshooter', emoji: '🎯', desc: 'Hit 3 bullseyes in a row in the Physics Playground' },
  { id: 'lab-legend', name: 'Lab Legend', emoji: '🏆', desc: 'Reach the highest level' },
];

const evaluateBadges = (s) => {
  const expDone = Object.keys(s.completedExperiments);
  const expByTopic = {};
  expDone.forEach((id) => {
    const exp = experiments.find((e) => e.id === id);
    if (exp) expByTopic[exp.topic] = (expByTopic[exp.topic] || 0) + 1;
  });
  const totalDone = expDone.length + s.completedActivities.length + s.readPosts.length;
  const quizTopics = ['physics', 'biology', 'chemistry', 'engineering'];
  const quizzes80 = quizTopics.filter((t) => {
    const b = s.quizBest[t];
    return b && b.total > 0 && b.score / b.total >= 0.8;
  });

  const earned = new Set(s.badges);
  const checks = {
    'first-quest': totalDone >= 1,
    'hands-on-5': expDone.length >= 5,
    'hands-on-15': expDone.length >= 15,
    'physics-whiz': (expByTopic.physics || 0) >= (topicTotals.physics || 99),
    'chem-champion': (expByTopic.chemistry || 0) >= (topicTotals.chemistry || 99),
    'bio-boss': (expByTopic.biology || 0) >= (topicTotals.biology || 99),
    'engineer-elite': (expByTopic.engineering || 0) >= (topicTotals.engineering || 99),
    'well-rounded': Object.keys(topicTotals).every((t) => (expByTopic[t] || 0) >= 1),
    'coder-5': s.completedActivities.length >= 5,
    'coder-15': s.completedActivities.length >= 15,
    'bookworm': s.readPosts.length >= 5,
    'news-hound': s.readPosts.length >= 10,
    'quiz-taker': Object.keys(s.quizBest).length >= 1,
    'quiz-ace': Object.values(s.quizBest).some((b) => b.total > 0 && b.score === b.total),
    'brainiac': quizzes80.length >= 4,
    'sharpshooter': s.bestStreak >= 3,
    'lab-legend': levelForXp(s.xp).level >= 6,
  };

  const newBadges = [];
  Object.entries(checks).forEach(([id, ok]) => {
    if (ok && !earned.has(id)) newBadges.push(id);
  });
  return newBadges;
};

// ---------- Store ----------
const DEFAULT_STATE = {
  name: '',
  avatar: '🧑‍🔬',
  xp: 0,
  completedExperiments: {}, // id -> difficulty
  completedActivities: [], // ids
  readPosts: [], // ids
  quizBest: {}, // topic -> { score, total }
  playgroundHits: 0,
  bestStreak: 0,
  badges: [],
  log: [], // [{ ts, label, xp }]
};

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch { /* corrupted or unavailable storage — start fresh */ }
  return { ...DEFAULT_STATE };
};

const QuestContext = createContext(null);

export function QuestProvider({ children }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable (private mode) — progress lives in memory only */ }
  }, [state]);

  const applyUpdate = useCallback((updater, label, xpGain) => {
    setState((prev) => {
      const next = updater({ ...prev });
      if (xpGain) {
        next.xp = prev.xp + xpGain;
        next.log = [{ ts: Date.now(), label, xp: xpGain }, ...prev.log].slice(0, 30);
      }

      // level-up check
      const prevLevel = levelForXp(prev.xp).level;
      const newLevel = levelForXp(next.xp).level;

      // badge check
      const newBadges = evaluateBadges(next);
      if (newBadges.length) next.badges = [...next.badges, ...newBadges];

      // celebrations (deferred so we don't toast during render)
      setTimeout(() => {
        if (xpGain) {
          toast({ title: `+${xpGain} XP`, description: label });
        }
        if (newLevel > prevLevel) {
          const l = levelForXp(next.xp);
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
          toast({ title: `🎉 Level up! You're now a ${l.name} ${l.emoji}` });
        }
        newBadges.forEach((id) => {
          const b = BADGES.find((x) => x.id === id);
          if (b) {
            confetti({ particleCount: 90, spread: 60, origin: { y: 0.7 } });
            toast({ title: `${b.emoji} Badge earned: ${b.name}!`, description: b.desc });
          }
        });
      }, 50);

      return next;
    });
  }, []);

  const api = {
    ...state,
    level: levelForXp(state.xp),
    next: nextLevel(state.xp),

    setProfile: (name, avatar) =>
      setState((prev) => ({ ...prev, name, avatar })),

    markExperimentDone: (exp) => {
      if (state.completedExperiments[exp.id]) return;
      const xp = XP_RULES.experiment[exp.difficulty] || 20;
      applyUpdate(
        (s) => ({ ...s, completedExperiments: { ...s.completedExperiments, [exp.id]: exp.difficulty } }),
        `Experiment complete: ${exp.title}`,
        xp
      );
    },

    markActivityDone: (act) => {
      if (state.completedActivities.includes(act.id)) return;
      applyUpdate(
        (s) => ({ ...s, completedActivities: [...s.completedActivities, act.id] }),
        `Lesson complete: ${act.title}`,
        XP_RULES.lesson
      );
    },

    markPostRead: (post) => {
      if (state.readPosts.includes(post.id)) return;
      applyUpdate(
        (s) => ({ ...s, readPosts: [...s.readPosts, post.id] }),
        `Read: ${post.title}`,
        XP_RULES.post
      );
    },

    recordQuizResult: (topic, score, total) => {
      const prevBest = state.quizBest[topic];
      const prevScore = prevBest ? prevBest.score : 0;
      const improvement = Math.max(0, score - prevScore);
      const xp =
        improvement * XP_RULES.quizCorrect +
        (score === total && prevScore !== total ? XP_RULES.quizPerfectBonus : 0);
      applyUpdate(
        (s) => ({
          ...s,
          quizBest: {
            ...s.quizBest,
            [topic]: score >= prevScore ? { score, total } : prevBest,
          },
        }),
        `Quiz: ${topic} (${score}/${total})`,
        xp
      );
    },

    recordPlaygroundHit: (streak) => {
      applyUpdate(
        (s) => ({
          ...s,
          playgroundHits: s.playgroundHits + 1,
          bestStreak: Math.max(s.bestStreak, streak),
        }),
        'Physics Playground bullseye!',
        XP_RULES.playgroundHit
      );
    },

    resetProgress: () => setState({ ...DEFAULT_STATE }),

    totals: {
      experiments: experiments.length,
      activities: virtualActivities.length,
      posts: stemPosts.length,
      topicTotals,
    },
  };

  return <QuestContext.Provider value={api}>{children}</QuestContext.Provider>;
}

export const useQuest = () => {
  const ctx = useContext(QuestContext);
  if (!ctx) throw new Error('useQuest must be used within a QuestProvider');
  return ctx;
};
