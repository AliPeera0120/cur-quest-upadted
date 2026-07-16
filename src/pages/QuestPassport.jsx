import React, { useState, useMemo } from 'react';
import { useQuest, BADGES, LEVELS } from '@/lib/quest';
import quizzes from '@/data/quizzes.json';
import experiments from '@/data/experiments.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Rocket, BookOpen, FlaskConical, Code, Award, Stamp, Brain,
  ChevronRight, RotateCcw, Sparkles, Check, X as XIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AVATARS = ['🧑‍🔬', '👩‍🔬', '👨‍🚀', '👩‍🚀', '🧑‍💻', '🦖', '🤖', '🦉', '🐙', '🦊', '⚡', '🌟'];

const TOPIC_META = {
  physics: { label: 'Physics', emoji: '🎢', color: 'bg-blue-500' },
  chemistry: { label: 'Chemistry', emoji: '🧪', color: 'bg-purple-500' },
  biology: { label: 'Biology', emoji: '🌱', color: 'bg-green-500' },
  engineering: { label: 'Engineering', emoji: '🏗️', color: 'bg-orange-500' },
};

const QUIZ_LENGTH = 5;

// ---------------- Quiz engine ----------------
function Quiz({ topic, onClose }) {
  const quest = useQuest();
  const questions = useMemo(() => {
    const bank = [...(quizzes[topic] || [])];
    // shuffle
    for (let i = bank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bank[i], bank[j]] = [bank[j], bank[i]];
    }
    return bank.slice(0, QUIZ_LENGTH);
  }, [topic]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[idx];
  const meta = TOPIC_META[topic];

  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const advance = () => {
    if (idx + 1 >= questions.length) {
      quest.recordQuizResult(topic, score, questions.length);
      setFinished(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl max-w-xl w-full mt-10 mb-10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${meta.color} text-white px-6 py-4 flex items-center justify-between`}>
          <h3 className="font-bold text-lg" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {meta.emoji} {meta.label} Quiz
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {!finished ? (
          <div className="p-6">
            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-3">
              <span>Question {idx + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <Progress value={(idx / questions.length) * 100} className="mb-5 h-2" />
            <p className="font-semibold text-gray-800 text-lg mb-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {q.q}
            </p>
            <div className="space-y-2.5">
              {q.options.map((opt, i) => {
                let style = 'border-gray-200 hover:border-[#055b8e] hover:bg-blue-50/50';
                if (picked !== null) {
                  if (i === q.answer) style = 'border-green-500 bg-green-50 text-green-800';
                  else if (i === picked) style = 'border-red-400 bg-red-50 text-red-700';
                  else style = 'border-gray-100 text-gray-400';
                }
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={picked !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-between ${style}`}
                  >
                    {opt}
                    {picked !== null && i === q.answer && <Check className="w-4 h-4 shrink-0" />}
                    {picked !== null && i === picked && i !== q.answer && <XIcon className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <AnimatePresence>
              {picked !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div className={`rounded-xl p-3.5 text-sm ${picked === q.answer ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                    <strong>{picked === q.answer ? 'Correct! ' : 'Not quite. '}</strong>
                    {q.explain}
                  </div>
                  <Button onClick={advance} className="w-full mt-4 bg-[#055b8e] hover:bg-[#044a73] rounded-xl gap-1">
                    {idx + 1 >= questions.length ? 'See Results' : 'Next Question'} <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-6xl mb-3">
              {score === questions.length ? '🏅' : score >= questions.length * 0.6 ? '🎉' : '💪'}
            </div>
            <h4 className="text-2xl font-bold text-[#055b8e] mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {score} / {questions.length}
            </h4>
            <p className="text-gray-500 text-sm mb-6">
              {score === questions.length
                ? 'Perfect score! You really know your stuff.'
                : score >= questions.length * 0.6
                  ? 'Nice work! Review the experiments and try for a perfect score.'
                  : 'Keep exploring! Try the hands-on experiments, then quiz again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={onClose} variant="outline" className="rounded-xl">Done</Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------- Passport page ----------------
export default function QuestPassport() {
  const quest = useQuest();
  const [editingProfile, setEditingProfile] = useState(!quest.name);
  const [draftName, setDraftName] = useState(quest.name);
  const [draftAvatar, setDraftAvatar] = useState(quest.avatar);
  const [quizTopic, setQuizTopic] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const expDoneByTopic = useMemo(() => {
    const by = {};
    Object.keys(quest.completedExperiments).forEach((id) => {
      const e = experiments.find((x) => x.id === id);
      if (e) by[e.topic] = (by[e.topic] || 0) + 1;
    });
    return by;
  }, [quest.completedExperiments]);

  const xpIntoLevel = quest.xp - quest.level.minXp;
  const xpForNext = quest.next ? quest.next.minXp - quest.level.minXp : 1;
  const levelPct = quest.next ? Math.min(100, (xpIntoLevel / xpForNext) * 100) : 100;

  const doneCount =
    Object.keys(quest.completedExperiments).length +
    quest.completedActivities.length +
    quest.readPosts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Quest Passport 🛂
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 max-w-2xl mx-auto"
          >
            Your STEM learning journey, all in one place. Do experiments, finish lessons,
            read posts, ace quizzes — earn XP, level up, and collect badges!
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Profile + level card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-8">
          {editingProfile ? (
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-[#055b8e] mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {quest.name ? 'Edit your explorer profile' : 'Create your explorer profile!'}
              </h2>
              <Input
                placeholder="Your explorer name..."
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={20}
                className="rounded-xl mb-4"
              />
              <div className="flex flex-wrap gap-2 mb-5">
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setDraftAvatar(a)}
                    className={`text-2xl w-11 h-11 rounded-xl border-2 transition-all ${
                      draftAvatar === a ? 'border-[#ed7219] bg-[#ed7219]/10 scale-110' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => {
                  quest.setProfile(draftName.trim() || 'Explorer', draftAvatar);
                  setEditingProfile(false);
                }}
                className="bg-[#ed7219] hover:bg-[#d86515] rounded-xl font-bold"
              >
                <Sparkles className="w-4 h-4 mr-1" /> Start My Quest
              </Button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{quest.avatar}</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {quest.name}
                  </h2>
                  <p className="text-[#055b8e] font-semibold">
                    {quest.level.emoji} Level {quest.level.level} — {quest.level.name}
                  </p>
                  <button
                    onClick={() => { setDraftName(quest.name); setDraftAvatar(quest.avatar); setEditingProfile(true); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    edit profile
                  </button>
                </div>
              </div>
              <div className="flex-1 lg:px-8">
                <div className="flex justify-between text-sm font-semibold mb-1.5">
                  <span className="text-gray-600">{quest.xp} XP</span>
                  <span className="text-gray-400">
                    {quest.next ? `${quest.next.minXp - quest.xp} XP to ${quest.next.name} ${quest.next.emoji}` : 'Max level reached! 🏆'}
                  </span>
                </div>
                <Progress value={levelPct} className="h-3" />
                <div className="flex justify-between mt-2">
                  {LEVELS.map((l) => (
                    <span
                      key={l.level}
                      title={l.name}
                      className={`text-lg ${quest.level.level >= l.level ? '' : 'grayscale opacity-30'}`}
                    >
                      {l.emoji}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-blue-50 rounded-2xl px-4 py-3">
                  <div className="text-2xl font-bold text-[#055b8e]">{doneCount}</div>
                  <div className="text-xs text-gray-500 font-medium">Quests Done</div>
                </div>
                <div className="bg-orange-50 rounded-2xl px-4 py-3">
                  <div className="text-2xl font-bold text-[#ed7219]">{quest.badges.length}</div>
                  <div className="text-xs text-gray-500 font-medium">Badges</div>
                </div>
                <div className="bg-green-50 rounded-2xl px-4 py-3">
                  <div className="text-2xl font-bold text-green-600">{quest.bestStreak}</div>
                  <div className="text-xs text-gray-500 font-medium">Best Streak</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Topic progress + quizzes */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#055b8e] mb-5 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <FlaskConical className="w-5 h-5" /> Experiment Progress
            </h3>
            <div className="space-y-4">
              {Object.entries(TOPIC_META).map(([topic, meta]) => {
                const total = quest.totals.topicTotals[topic] || 0;
                const done = expDoneByTopic[topic] || 0;
                return (
                  <div key={topic}>
                    <div className="flex justify-between text-sm font-semibold mb-1.5">
                      <span className="text-gray-700">{meta.emoji} {meta.label}</span>
                      <span className="text-gray-400">{done}/{total}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.color} rounded-full transition-all duration-500`}
                        style={{ width: total ? `${(done / total) * 100}%` : 0 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Code className="w-4 h-4 text-[#055b8e]" />
                Lessons: <strong>{quest.completedActivities.length}/{quest.totals.activities}</strong>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen className="w-4 h-4 text-[#055b8e]" />
                Posts read: <strong>{quest.readPosts.length}/{quest.totals.posts}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#055b8e] mb-2 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <Brain className="w-5 h-5" /> Knowledge Quizzes
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              5 questions each. Earn 5 XP per correct answer, +15 for a perfect score. Retake anytime to beat your best!
            </p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(TOPIC_META).map(([topic, meta]) => {
                const best = quest.quizBest[topic];
                return (
                  <button
                    key={topic}
                    onClick={() => setQuizTopic(topic)}
                    className="rounded-2xl border-2 border-gray-200 hover:border-[#ed7219] p-4 text-left transition-all group"
                  >
                    <div className="text-2xl mb-1">{meta.emoji}</div>
                    <div className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {meta.label}
                    </div>
                    <div className="text-xs mt-1">
                      {best ? (
                        <span className={best.score === best.total ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                          Best: {best.score}/{best.total} {best.score === best.total && '💯'}
                        </span>
                      ) : (
                        <span className="text-[#ed7219] font-semibold group-hover:underline">Take quiz →</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[#055b8e] mb-5 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <Award className="w-5 h-5" /> Badge Collection
            <span className="text-sm font-medium text-gray-400">({quest.badges.length}/{BADGES.length})</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {BADGES.map((b) => {
              const earned = quest.badges.includes(b.id);
              return (
                <div
                  key={b.id}
                  title={b.desc}
                  className={`rounded-2xl border-2 p-3 text-center transition-all ${
                    earned
                      ? 'border-[#ed7219]/40 bg-gradient-to-b from-orange-50 to-white shadow-sm'
                      : 'border-gray-100 bg-gray-50 grayscale opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-1">{b.emoji}</div>
                  <div className="text-xs font-bold text-gray-700 leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {b.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 leading-tight">{b.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Passport stamps + activity log */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#055b8e] mb-4 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <Stamp className="w-5 h-5" /> Passport Stamps
            </h3>
            {Object.keys(quest.completedExperiments).length === 0 ? (
              <p className="text-sm text-gray-400">
                No stamps yet! Open any experiment on the Activities page and tap
                <strong> "Stamp my passport"</strong> when you've done it.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.keys(quest.completedExperiments).map((id) => {
                  const e = experiments.find((x) => x.id === id);
                  if (!e) return null;
                  const meta = TOPIC_META[e.topic];
                  return (
                    <div
                      key={id}
                      className="rounded-xl border-2 border-dashed border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 rotate-[-1deg] hover:rotate-0 transition-transform"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      {meta?.emoji} {e.title}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[#055b8e] mb-4 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <Rocket className="w-5 h-5" /> Recent Activity
            </h3>
            {quest.log.length === 0 ? (
              <p className="text-sm text-gray-400">Your XP history will appear here. Go explore!</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {quest.log.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-gray-600 truncate pr-3">{entry.label}</span>
                    <span className="font-bold text-[#ed7219] shrink-0">+{entry.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reset */}
        <div className="text-center pb-4">
          {confirmReset ? (
            <div className="inline-flex items-center gap-3 text-sm">
              <span className="text-gray-600">Erase all progress? This can't be undone.</span>
              <Button
                size="sm" variant="destructive" className="rounded-xl"
                onClick={() => { quest.resetProgress(); setConfirmReset(false); setEditingProfile(true); setDraftName(''); setDraftAvatar('🧑‍🔬'); }}
              >
                Yes, reset
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="text-xs text-gray-300 hover:text-gray-500 inline-flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset passport
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {quizTopic && <Quiz topic={quizTopic} onClose={() => setQuizTopic(null)} />}
      </AnimatePresence>
    </div>
  );
}
