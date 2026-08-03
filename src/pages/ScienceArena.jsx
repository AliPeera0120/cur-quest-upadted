import React, { useState, useRef, useEffect, useReducer, useMemo } from 'react';
import { useQuest, ARENA_TOTAL_LEVELS } from '@/lib/quest';
import units from '@/data/arenaUnits.json';
import levels from '@/data/arenaLevels.json';
import labQuestions from '@/data/labQuestions.json';
import { Button } from '@/components/ui/button';
import {
  Swords, Zap, Bot, Cog, Flame, Snowflake, Atom, Shield, Star, Lock,
  Coins, Check, Play, Trophy, Info, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UNIT_ICONS = { Zap, Bot, Cog, Flame, Snowflake, Atom };
const unitById = (id) => units.find((u) => u.id === id);

// Battle tuning
const ELIXIR_MAX = 10;
const ELIXIR_REGEN = 0.5; // per second from time
const CORRECT_ELIXIR = 3; // instant elixir for a correct answer
const PLAYER_TOWER_HP = 1000;

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------- Battle ----------------
function Battle({ level, onExit, onComplete }) {
  const quest = useQuest();
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const endedRef = useRef(false);
  const [outcome, setOutcome] = useState(null); // 'win' | 'lose'
  const [result, setResult] = useState(null); // { stars, correct, total, coins }

  const unlocked = units.filter((u) => u.unlockLevel <= quest.arena.level);

  const questionPool = useMemo(() => {
    const pool = labQuestions.filter(
      (q) => level.topics.includes(q.category) && level.qLevels.includes(q.level)
    );
    const fallback = pool.length >= 4 ? pool : labQuestions.filter((q) => level.topics.includes(q.category));
    return shuffle(fallback);
  }, [level]);

  const qIdxRef = useRef(0);
  const [question, setQuestion] = useState(questionPool[0]);
  const [picked, setPicked] = useState(null);

  const stats = useRef({ correct: 0, total: 0, streak: 0, bestStreak: 0, byTopic: {} });

  const g = useRef({
    elixir: 5,
    enemyElixir: 0,
    enemyCooldown: 2,
    playerHp: PLAYER_TOWER_HP,
    enemyHp: level.towerHp,
    units: [],
    nextId: 1,
  });

  const nextQuestion = () => {
    qIdxRef.current += 1;
    if (qIdxRef.current >= questionPool.length) qIdxRef.current = 0;
    setQuestion(questionPool[qIdxRef.current]);
    setPicked(null);
  };

  const answer = (i) => {
    if (picked !== null || outcome) return;
    setPicked(i);
    const correct = i === question.answer;
    const s = stats.current;
    s.total += 1;
    const cat = question.category;
    s.byTopic[cat] = s.byTopic[cat] || { correct: 0, total: 0 };
    s.byTopic[cat].total += 1;
    if (correct) {
      s.correct += 1;
      s.byTopic[cat].correct += 1;
      s.streak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      g.current.elixir = Math.min(ELIXIR_MAX, g.current.elixir + CORRECT_ELIXIR);
    } else {
      s.streak = 0;
    }
    setTimeout(() => { if (!endedRef.current) nextQuestion(); }, correct ? 650 : 1600);
  };

  const deploy = (unit) => {
    if (outcome) return;
    const gc = g.current;
    if (gc.elixir < unit.cost) return;
    gc.elixir -= unit.cost;
    gc.units.push({
      uid: gc.nextId++, side: 'player', x: 8,
      hp: unit.hp, maxHp: unit.hp, dmg: unit.dmg, speed: unit.speed, range: unit.range,
      color: unit.color, icon: unit.icon,
    });
  };

  const spawnEnemy = () => {
    const gc = g.current;
    const affordable = level.enemyDeck.map(unitById).filter((u) => u.cost <= gc.enemyElixir);
    if (!affordable.length) return;
    const unit = affordable.sort((a, b) => b.cost - a.cost)[0];
    gc.enemyElixir -= unit.cost;
    gc.units.push({
      uid: gc.nextId++, side: 'enemy', x: 92,
      hp: unit.hp, maxHp: unit.hp, dmg: unit.dmg, speed: unit.speed, range: unit.range,
      color: '#dc2626', icon: unit.icon,
    });
  };

  // Game loop
  useEffect(() => {
    let raf;
    let last = performance.now();
    const step = (dt) => {
      const gc = g.current;
      if (outcome) return;
      gc.elixir = Math.min(ELIXIR_MAX, gc.elixir + ELIXIR_REGEN * dt);
      gc.enemyElixir = Math.min(ELIXIR_MAX, gc.enemyElixir + level.enemyRate * dt);
      gc.enemyCooldown -= dt;
      if (gc.enemyCooldown <= 0) {
        spawnEnemy();
        gc.enemyCooldown = 2.2 + Math.random() * 2.2;
      }

      const living = gc.units.filter((u) => u.hp > 0);
      for (const u of living) {
        const foes = living.filter((o) => o.side !== u.side && o.hp > 0);
        let target = null;
        let best = Infinity;
        for (const f of foes) {
          const d = Math.abs(f.x - u.x);
          if (d < best) { best = d; target = f; }
        }
        if (target && best <= u.range) {
          target.hp -= u.dmg * dt;
        } else if (u.side === 'player' && u.x >= 88) {
          gc.enemyHp -= u.dmg * dt;
        } else if (u.side === 'enemy' && u.x <= 12) {
          gc.playerHp -= u.dmg * dt;
        } else {
          u.x += (u.side === 'player' ? 1 : -1) * u.speed * dt;
          u.x = Math.max(4, Math.min(96, u.x));
        }
      }
      gc.units = living.filter((u) => u.hp > 0);

      if (gc.enemyHp <= 0) { gc.enemyHp = 0; finish('win'); }
      else if (gc.playerHp <= 0) { gc.playerHp = 0; finish('lose'); }
    };
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt);
      forceRender();
      if (!endedRef.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  const finish = (result_) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const gc = g.current;
    const s = stats.current;
    if (result_ === 'win') {
      const pct = gc.playerHp / PLAYER_TOWER_HP;
      const stars = pct >= 0.8 ? 3 : pct >= 0.4 ? 2 : 1;
      const coins = level.reward + s.correct * 5;
      setResult({ stars, correct: s.correct, total: s.total, coins });
      quest.completeArenaLevel({
        level: level.level, stars, correct: s.correct, total: s.total,
        topicStats: s.byTopic, runStreak: s.bestStreak, coins,
      });
    } else {
      setResult({ stars: 0, correct: s.correct, total: s.total, coins: 0 });
    }
    setOutcome(result_);
  };

  const gc = g.current;
  const playerPct = Math.max(0, (gc.playerHp / PLAYER_TOWER_HP) * 100);
  const enemyPct = Math.max(0, (gc.enemyHp / level.towerHp) * 100);
  const elixir = Math.floor(gc.elixir);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#055b8e]">
          <ArrowLeft className="w-4 h-4" /> Leave battle
        </button>
        <div className="text-sm font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Level {level.level} · {level.boss}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
          <Check className="w-4 h-4 text-green-500" /> {stats.current.correct}/{stats.current.total}
        </div>
      </div>

      {/* Tower HP bars */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1">
            <Shield className="w-4 h-4 text-[#055b8e]" /> Your Tower
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#055b8e] transition-all" style={{ width: `${playerPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-end gap-2 text-xs font-semibold text-gray-600 mb-1">
            {level.boss} <Swords className="w-4 h-4 text-red-500" />
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 transition-all ml-auto" style={{ width: `${enemyPct}%` }} />
          </div>
        </div>
      </div>

      {/* Battle lane */}
      <div className="relative h-40 rounded-2xl bg-gradient-to-r from-[#055b8e]/10 via-gray-50 to-red-500/10 border border-gray-200 overflow-hidden mb-4">
        {/* Towers */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-16 rounded-lg bg-[#055b8e] flex items-center justify-center text-white">
          <Shield className="w-5 h-5" />
        </div>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-16 rounded-lg bg-red-500 flex items-center justify-center text-white">
          <Swords className="w-5 h-5" />
        </div>
        {/* Units */}
        {gc.units.map((u) => {
          const Icon = UNIT_ICONS[u.icon] || Bot;
          return (
            <div
              key={u.uid}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${u.x}%` }}
            >
              <div className="w-7 h-1 bg-black/10 rounded-full mb-0.5 overflow-hidden">
                <div className="h-full" style={{ width: `${(u.hp / u.maxHp) * 100}%`, backgroundColor: u.side === 'player' ? '#22c55e' : '#f87171' }} />
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow" style={{ backgroundColor: u.color }}>
                <Icon className="w-4 h-4 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Elixir + unit deck */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Elixir</span>
          <div className="flex-1 flex gap-1">
            {Array.from({ length: ELIXIR_MAX }).map((_, i) => (
              <div key={i} className={`h-3 flex-1 rounded-full ${i < elixir ? 'bg-purple-500' : 'bg-purple-100'}`} />
            ))}
          </div>
          <span className="text-sm font-bold text-purple-600 w-6 text-right">{elixir}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {unlocked.map((u) => {
            const Icon = UNIT_ICONS[u.icon] || Bot;
            const affordable = gc.elixir >= u.cost;
            return (
              <button
                key={u.id}
                onClick={() => deploy(u)}
                disabled={!affordable || !!outcome}
                title={u.blurb}
                className={`rounded-xl border-2 p-2 text-center transition-all ${
                  affordable && !outcome ? 'border-gray-200 hover:border-[#ed7219] bg-white' : 'border-gray-100 bg-gray-50 opacity-50'
                }`}
              >
                <div className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1" style={{ backgroundColor: u.color }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-[10px] font-bold text-gray-700 leading-tight truncate">{u.name}</div>
                <div className="flex items-center justify-center gap-0.5 text-xs font-bold text-purple-600">
                  <Zap className="w-3 h-3" /> {u.cost}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question panel */}
      {!outcome && question && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Answer correctly to earn elixir</span>
            <span>{question.category}</span>
          </div>
          <p className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>{question.q}</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              let style = 'border-gray-200 hover:border-[#055b8e] hover:bg-blue-50/50';
              if (picked !== null) {
                if (i === question.answer) style = 'border-green-500 bg-green-50 text-green-800';
                else if (i === picked) style = 'border-red-400 bg-red-50 text-red-700';
                else style = 'border-gray-100 text-gray-400';
              }
              return (
                <button
                  key={i}
                  onClick={() => answer(i)}
                  disabled={picked !== null}
                  className={`text-left px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-between ${style}`}
                >
                  {opt}
                  {picked !== null && i === question.answer && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className={`mt-3 text-sm rounded-xl p-3 ${picked === question.answer ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
              <strong>{picked === question.answer ? `Correct. +${CORRECT_ELIXIR} elixir. ` : 'Not quite. '}</strong>
              {question.explain}
            </div>
          )}
        </div>
      )}

      {/* Result overlay */}
      <AnimatePresence>
        {outcome && result && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl"
            >
              {outcome === 'win' ? (
                <>
                  <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3].map((s) => (
                      <Star key={s} className={`w-9 h-9 ${s <= result.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <h3 className="text-2xl font-bold text-[#055b8e] mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Victory!</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    You defeated {level.boss} with {result.correct}/{result.total} correct answers.
                  </p>
                  <div className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-full px-4 py-1.5 mb-6">
                    <Coins className="w-4 h-4" /> +{result.coins} coins
                  </div>
                </>
              ) : (
                <>
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-gray-700 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Tower Down</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    You answered {result.correct}/{result.total} correctly. Keep answering to earn elixir faster, then try again.
                  </p>
                </>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={onExit} variant="outline" className="rounded-xl">Level Map</Button>
                <Button onClick={onComplete} className="bg-[#ed7219] hover:bg-[#d86515] rounded-xl">
                  {outcome === 'win' ? 'Continue' : 'Try Again'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------- Level map ----------------
export default function ScienceArena() {
  const quest = useQuest();
  const [activeLevel, setActiveLevel] = useState(null);
  const [battleKey, setBattleKey] = useState(0);

  const cleared = quest.arena.level;
  const chapters = useMemo(() => {
    const map = {};
    levels.forEach((l) => { (map[l.chapter] = map[l.chapter] || []).push(l); });
    return map;
  }, []);

  if (activeLevel) {
    return (
      <div className="min-h-screen bg-gray-50 py-4">
        <Battle
          key={battleKey}
          level={activeLevel}
          onExit={() => setActiveLevel(null)}
          onComplete={() => {
            // win -> go to next unlocked level map; retry -> restart same battle
            setActiveLevel(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Science Arena
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-white/80 max-w-2xl mx-auto"
          >
            Every correct science answer charges your elixir. Spend it to deploy units, topple the
            enemy tower, and battle your way through the campaign.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress + how to play */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#055b8e]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#055b8e]">{cleared}/{ARENA_TOTAL_LEVELS}</div>
              <div className="text-xs text-gray-500 font-medium">Levels Cleared</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#055b8e]">
                {Object.values(quest.arena.stars).reduce((a, b) => a + b, 0)}/{ARENA_TOTAL_LEVELS * 3}
              </div>
              <div className="text-xs text-gray-500 font-medium">Stars Earned</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <Coins className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#055b8e]">{quest.coins.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium">Coins</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-8 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#055b8e] shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            <strong>How to play:</strong> answer the science questions to fill your elixir bar. Tap a unit
            card you can afford to send it into battle. Destroy the enemy tower before yours falls. Harder
            questions and answer streaks help you win faster.
          </p>
        </div>

        {/* Chapters and levels */}
        <div className="space-y-8">
          {Object.entries(chapters).map(([chapter, chapterLevels]) => (
            <div key={chapter}>
              <h2 className="font-bold text-[#055b8e] text-lg mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {chapter}
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {chapterLevels.map((l) => {
                  const locked = l.level > cleared + 1;
                  const done = l.level <= cleared;
                  const stars = quest.arena.stars[l.level] || 0;
                  return (
                    <button
                      key={l.level}
                      onClick={() => { if (!locked) { setBattleKey((k) => k + 1); setActiveLevel(l); } }}
                      disabled={locked}
                      className={`text-left rounded-2xl border-2 p-4 transition-all ${
                        locked
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : done
                            ? 'border-green-200 bg-green-50/40 hover:border-green-300'
                            : 'border-[#ed7219]/40 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400">Level {l.level}</span>
                        {locked ? <Lock className="w-4 h-4 text-gray-300" />
                          : done ? <Check className="w-4 h-4 text-green-500" />
                          : <Play className="w-4 h-4 text-[#ed7219]" />}
                      </div>
                      <div className="font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>{l.boss}</div>
                      <div className="text-xs text-gray-500 mb-2">{l.topics.join(' · ')}</div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star key={s} className={`w-4 h-4 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
