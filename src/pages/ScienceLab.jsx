import React, { useState, useMemo, useRef } from 'react';
import { useQuest, COIN_RULES } from '@/lib/quest';
import equipment from '@/data/labEquipment.json';
import quizzes from '@/data/quizzes.json';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FlaskConical, Search, Thermometer, Scale, Flame, Sprout, Magnet, Microscope,
  CircuitBoard, Wind, Telescope, Fish, CloudSun, Bot, Printer, Zap, Dna, Fan,
  Rainbow, Server, Atom, Sparkles, Shield, Globe,
  Coins, TrendingUp, Lock, Check, X as XIcon, Beaker, ChevronRight, Play, Store,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICONS = {
  FlaskConical, Search, Thermometer, Scale, Flame, Sprout, Magnet, Microscope,
  CircuitBoard, Wind, Telescope, Fish, CloudSun, Bot, Printer, Zap, Dna, Fan,
  Rainbow, Server, Atom, Sparkles, Shield, Globe,
};

const SESSION_LENGTH = 8;

const allQuestions = Object.entries(quizzes).flatMap(([topic, qs]) =>
  qs.map((q) => ({ ...q, topic }))
);

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------- Research session (question game) ----------------
function ResearchSession({ onClose }) {
  const quest = useQuest();
  const questions = useMemo(() => shuffle(allQuestions).slice(0, SESSION_LENGTH), []);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [lastAward, setLastAward] = useState(null);
  const [finished, setFinished] = useState(false);
  const recordedRef = useRef(false);

  const q = questions[idx];

  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) {
      const newStreak = streak + 1;
      const base = COIN_RULES.perCorrectAnswer + (newStreak - 1) * COIN_RULES.streakBonus;
      const award = Math.round(base * quest.labMultiplier);
      setCorrect((c) => c + 1);
      setStreak(newStreak);
      setCoinsEarned((c) => c + award);
      setLastAward(award);
    } else {
      setStreak(0);
      setLastAward(0);
    }
  };

  const advance = () => {
    if (idx + 1 >= questions.length) {
      if (!recordedRef.current) {
        recordedRef.current = true;
        quest.recordResearchSession(correct, questions.length, coinsEarned);
      }
      setFinished(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
      setLastAward(null);
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
        <div className="bg-[#055b8e] text-white px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <Beaker className="w-5 h-5" /> Research Session
          </h3>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Coins className="w-4 h-4 text-yellow-300" /> {coinsEarned}
            </span>
            <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!finished ? (
          <div className="p-6">
            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-3">
              <span>Question {idx + 1} of {questions.length}</span>
              <span className="capitalize">{q.topic}</span>
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                  <div className={`rounded-xl p-3.5 text-sm flex items-start justify-between gap-3 ${picked === q.answer ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                    <span><strong>{picked === q.answer ? 'Correct. ' : 'Not quite. '}</strong>{q.explain}</span>
                    {picked === q.answer && lastAward > 0 && (
                      <span className="flex items-center gap-1 font-bold text-yellow-600 shrink-0">
                        <Coins className="w-4 h-4" /> +{lastAward}
                      </span>
                    )}
                  </div>
                  {streak >= 2 && picked === q.answer && (
                    <p className="text-xs text-[#ed7219] font-semibold mt-2">
                      Streak x{streak} — bonus coins added to each answer!
                    </p>
                  )}
                  <Button onClick={advance} className="w-full mt-4 bg-[#055b8e] hover:bg-[#044a73] rounded-xl gap-1">
                    {idx + 1 >= questions.length ? 'Collect Coins' : 'Next Question'} <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Coins className="w-14 h-14 text-yellow-500 mx-auto mb-3" />
            <h4 className="text-2xl font-bold text-[#055b8e] mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {coinsEarned} coins earned
            </h4>
            <p className="text-gray-500 text-sm mb-6">
              {correct} of {questions.length} correct. Spend your coins on new equipment to boost future earnings.
            </p>
            <Button onClick={onClose} className="bg-[#ed7219] hover:bg-[#d86515] rounded-xl">
              Back to My Lab
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------- Lab page ----------------
export default function ScienceLab() {
  const quest = useQuest();
  const [sessionOpen, setSessionOpen] = useState(false);
  const [tab, setTab] = useState('lab'); // 'lab' | 'shop'

  const owned = quest.lab;
  const ownedItems = equipment.filter((e) => owned.includes(e.id));
  const boostPct = Math.round((quest.labMultiplier - 1) * 100);
  const nextItem = equipment.find((e) => !owned.includes(e.id));

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
            Science Lab Tycoon
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 max-w-2xl mx-auto"
          >
            Answer science questions to earn Research Coins, then spend them to build your
            dream laboratory. Every instrument you add boosts how many coins you earn.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stat bar */}
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#055b8e]">{quest.coins.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium">Research Coins</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#055b8e]">+{boostPct}%</div>
              <div className="text-xs text-gray-500 font-medium">Earning Boost</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-[#055b8e]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#055b8e]">{owned.length}/{equipment.length}</div>
              <div className="text-xs text-gray-500 font-medium">Equipment Owned</div>
            </div>
          </div>
          <button
            onClick={() => setSessionOpen(true)}
            className="bg-[#ed7219] hover:bg-[#d86515] transition-colors rounded-2xl px-5 py-4 shadow-sm text-white flex items-center justify-center gap-2 font-bold"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <Play className="w-5 h-5" /> Start Research
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('lab')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              tab === 'lab' ? 'bg-[#055b8e] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> My Lab
          </button>
          <button
            onClick={() => setTab('shop')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              tab === 'shop' ? 'bg-[#055b8e] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Store className="w-4 h-4" /> Equipment Shop
          </button>
        </div>

        {/* My Lab */}
        {tab === 'lab' && (
          <div>
            {ownedItems.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                <Beaker className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Your laboratory is empty
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  Start a research session to earn your first coins, then visit the Equipment Shop
                  to buy your very first instrument.
                </p>
                <Button onClick={() => setSessionOpen(true)} className="bg-[#ed7219] hover:bg-[#d86515] rounded-xl gap-2">
                  <Play className="w-4 h-4" /> Start Your First Research Session
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-[#055b8e] mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {quest.name ? `${quest.name}'s Laboratory` : 'My Laboratory'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Lab value: {quest.labValue.toLocaleString()} coins invested · Earning boost +{boostPct}%
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {ownedItems.map((item) => {
                    const Icon = ICONS[item.icon] || FlaskConical;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-4 text-center group relative"
                        title={item.description}
                      >
                        <div
                          className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-2"
                          style={{ backgroundColor: `${item.color}1a` }}
                        >
                          <Icon className="w-7 h-7" style={{ color: item.color }} />
                        </div>
                        <div className="text-xs font-bold text-gray-700 leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {item.name}
                        </div>
                        <div className="text-[11px] text-green-600 font-semibold mt-1">+{Math.round(item.boost * 100)}% boost</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shop */}
        {tab === 'shop' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map((item) => {
              const Icon = ICONS[item.icon] || FlaskConical;
              const isOwned = owned.includes(item.id);
              const canAfford = quest.coins >= item.cost;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isOwned ? 'border-green-200 bg-green-50/40' : 'border-gray-100 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}1a` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {item.name}
                      </h4>
                      <span className="text-xs text-gray-400">{item.category}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 min-h-[48px]">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 font-bold text-gray-700">
                        <Coins className="w-4 h-4 text-yellow-500" /> {item.cost.toLocaleString()}
                      </span>
                      <span className="text-xs text-green-600 font-semibold">+{Math.round(item.boost * 100)}%</span>
                    </div>
                    {isOwned ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <Check className="w-4 h-4" /> Owned
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!canAfford}
                        onClick={() => quest.purchaseLabItem(item)}
                        className={`rounded-lg text-xs ${canAfford ? 'bg-[#055b8e] hover:bg-[#044a73]' : 'bg-gray-200 text-gray-400'}`}
                      >
                        {canAfford ? 'Buy' : <><Lock className="w-3 h-3 mr-1" /> {(item.cost - quest.coins).toLocaleString()} more</>}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <div className="mt-8 bg-gradient-to-br from-[#055b8e] to-[#044a73] rounded-2xl p-6 text-white">
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <Sparkles className="w-5 h-5 text-[#ed7219]" /> How Your Lab Grows
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-white/85">
            <p><strong>1. Research.</strong> Answer science questions in a research session. Each correct answer earns Research Coins, and answer streaks earn bonus coins.</p>
            <p><strong>2. Build.</strong> Spend coins in the Equipment Shop on real scientific instruments, from beakers all the way to an electron microscope.</p>
            <p><strong>3. Boost.</strong> Every instrument raises your earning boost, so a bigger lab means more coins per correct answer. {nextItem ? `Next up: ${nextItem.name}.` : 'You own everything. Incredible work!'}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sessionOpen && <ResearchSession onClose={() => setSessionOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
