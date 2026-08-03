import React, { useState, useRef, useEffect, useReducer, useMemo } from 'react';
import { useQuest, ARENA_TOTAL_LEVELS } from '@/lib/quest';
import units from '@/data/arenaUnits.json';
import levels from '@/data/arenaLevels.json';
import labQuestions from '@/data/labQuestions.json';
import { UnitSprite, TowerSprite } from '@/components/arena/ArenaSprites';
import { Button } from '@/components/ui/button';
import {
  Swords, Shield, Star, Lock, Coins, Check, Play, Trophy, Info, ArrowLeft,
  Zap, FlaskConical, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const unitById = (id) => units.find((u) => u.id === id);

// Battle tuning
const ELIXIR_MAX = 10;
const ELIXIR_START = 5;
const ELIXIR_BY_QLEVEL = { 1: 2, 2: 3, 3: 4 }; // elixir earned per correct answer, by question difficulty
const PLAYER_TOWER_HP = 1000;
const GROUND_TOP = 58; // % from top where units stand

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Lab-powered army bonus: every instrument makes units +4% stronger.
const armyBonus = (labCount) => 1 + 0.04 * labCount;

// ---------------- Battle ----------------
function Battle({ level, labCount, onExit, onComplete }) {
  const quest = useQuest();
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const endedRef = useRef(false);
  const [outcome, setOutcome] = useState(null);
  const [result, setResult] = useState(null);
  const [elixirPops, setElixirPops] = useState([]);

  const bonus = armyBonus(labCount);
  const unlocked = units.filter((u) => u.unlockLab <= labCount);

  const questionPool = useMemo(() => {
    const pool = labQuestions.filter(
      (q) => level.topics.includes(q.category) && level.qLevels.includes(q.level)
    );
    const fb = pool.length >= 4 ? pool : labQuestions.filter((q) => level.topics.includes(q.category));
    return shuffle(fb);
  }, [level]);

  const qIdxRef = useRef(0);
  const [question, setQuestion] = useState(questionPool[0]);
  const [picked, setPicked] = useState(null);
  const stats = useRef({ correct: 0, total: 0, streak: 0, bestStreak: 0, byTopic: {} });

  const g = useRef({
    elixir: ELIXIR_START,
    enemyEnergy: 0,
    playerHp: PLAYER_TOWER_HP,
    enemyHp: level.towerHp,
    units: [],
    fx: [],
    nextId: 1,
    towerHitP: 0, towerHitE: 0, shake: 0,
    pendingDmgE: 0, pendingDmgP: 0, dmgTick: 0,
  });

  const enemyPerAnswer = 0.7 + (level.level - 1) * 0.12;

  const addFx = (fx) => { g.current.fx.push({ id: g.current.nextId++, born: performance.now(), ...fx }); };

  const nextQuestion = () => {
    qIdxRef.current = (qIdxRef.current + 1) % questionPool.length;
    setQuestion(questionPool[qIdxRef.current]);
    setPicked(null);
  };

  const answer = (i) => {
    if (picked !== null || outcome) return;
    setPicked(i);
    const correct = i === question.answer;
    const s = stats.current;
    const gc = g.current;
    s.total += 1;
    const cat = question.category;
    s.byTopic[cat] = s.byTopic[cat] || { correct: 0, total: 0 };
    s.byTopic[cat].total += 1;

    // enemy advances a little on every answer (self-paced, no clock)
    gc.enemyEnergy += enemyPerAnswer;

    if (correct) {
      s.correct += 1;
      s.byTopic[cat].correct += 1;
      s.streak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      const gain = ELIXIR_BY_QLEVEL[question.level] || 2;
      gc.elixir = Math.min(ELIXIR_MAX, gc.elixir + gain);
      const popId = gc.nextId++;
      setElixirPops((p) => [...p, { id: popId, amount: gain }]);
      setTimeout(() => setElixirPops((p) => p.filter((x) => x.id !== popId)), 900);
    } else {
      s.streak = 0;
    }
    // enemy tries to spawn after each answer
    trySpawnEnemy();
    setTimeout(() => { if (!endedRef.current) nextQuestion(); }, correct ? 600 : 1500);
  };

  const deploy = (unit) => {
    if (outcome) return;
    const gc = g.current;
    if (gc.elixir < unit.cost) return;
    gc.elixir -= unit.cost;
    gc.units.push({
      uid: gc.nextId++, side: 'player', x: 10, id: unit.id,
      hp: Math.round(unit.hp * bonus), maxHp: Math.round(unit.hp * bonus),
      dmg: unit.dmg * bonus, speed: unit.speed, range: unit.range,
      lastShot: 0,
    });
    addFx({ kind: 'ring', x: 10, y: GROUND_TOP, color: '#38bdf8', ttl: 0.5 });
  };

  const trySpawnEnemy = () => {
    const gc = g.current;
    const affordable = level.enemyDeck.map(unitById).filter((u) => u.cost <= gc.enemyEnergy);
    if (!affordable.length) return;
    const unit = affordable.sort((a, b) => b.cost - a.cost)[0];
    gc.enemyEnergy -= unit.cost;
    const escale = 1 + (level.level - 1) * 0.06; // enemies get a little tougher each level
    gc.units.push({
      uid: gc.nextId++, side: 'enemy', x: 90, id: unit.id,
      hp: Math.round(unit.hp * escale), maxHp: Math.round(unit.hp * escale),
      dmg: unit.dmg * escale, speed: unit.speed, range: unit.range, lastShot: 0,
    });
    addFx({ kind: 'ring', x: 90, y: GROUND_TOP, color: '#ef4444', ttl: 0.5 });
  };

  // Game loop (movement + combat animate in real time; spawns are answer-gated)
  useEffect(() => {
    let raf;
    let last = performance.now();
    const step = (dt, now) => {
      const gc = g.current;
      if (outcome) return;
      const living = gc.units.filter((u) => u.hp > 0);
      for (const u of living) {
        const foes = living.filter((o) => o.side !== u.side && o.hp > 0);
        let target = null, best = Infinity;
        for (const f of foes) {
          const d = Math.abs(f.x - u.x);
          if (d < best) { best = d; target = f; }
        }
        if (target && best <= u.range) {
          target.hp -= u.dmg * dt;
          if (now - u.lastShot > 320) {
            u.lastShot = now;
            if (u.range > 12) {
              addFx({ kind: 'proj', x: u.x, y: GROUND_TOP - 2, tx: target.x, side: u.side, ttl: 0.4 });
            } else {
              addFx({ kind: 'spark', x: (u.x + target.x) / 2, y: GROUND_TOP, ttl: 0.3 });
            }
          }
        } else if (u.side === 'player' && u.x >= 82) {
          gc.enemyHp -= u.dmg * dt; gc.pendingDmgE += u.dmg * dt; gc.towerHitE = 0.2; gc.shake = 0.25;
        } else if (u.side === 'enemy' && u.x <= 18) {
          gc.playerHp -= u.dmg * dt; gc.pendingDmgP += u.dmg * dt; gc.towerHitP = 0.2; gc.shake = 0.25;
        } else {
          u.x += (u.side === 'player' ? 1 : -1) * u.speed * dt;
          u.x = Math.max(6, Math.min(94, u.x));
        }
      }
      // deaths -> burst
      for (const u of gc.units) {
        if (u.hp <= 0 && !u.dead) { u.dead = true; addFx({ kind: 'burst', x: u.x, y: GROUND_TOP, ttl: 0.4 }); }
      }
      gc.units = gc.units.filter((u) => u.hp > 0);

      // floating tower damage numbers (batched)
      gc.dmgTick -= dt;
      if (gc.dmgTick <= 0) {
        gc.dmgTick = 0.5;
        if (gc.pendingDmgE >= 1) { addFx({ kind: 'dmg', x: 88, y: 34, text: `-${Math.round(gc.pendingDmgE)}`, color: '#fca5a5', ttl: 0.9 }); gc.pendingDmgE = 0; }
        if (gc.pendingDmgP >= 1) { addFx({ kind: 'dmg', x: 12, y: 34, text: `-${Math.round(gc.pendingDmgP)}`, color: '#fca5a5', ttl: 0.9 }); gc.pendingDmgP = 0; }
      }

      // projectiles travel
      for (const f of gc.fx) {
        if (f.kind === 'proj') { const dir = f.tx > f.x ? 1 : -1; f.x += dir * 60 * dt; }
      }
      gc.towerHitP = Math.max(0, gc.towerHitP - dt);
      gc.towerHitE = Math.max(0, gc.towerHitE - dt);
      gc.shake = Math.max(0, gc.shake - dt);
      gc.fx = gc.fx.filter((f) => (now - f.born) / 1000 < f.ttl);

      if (gc.enemyHp <= 0) { gc.enemyHp = 0; finish('win'); }
      else if (gc.playerHp <= 0) { gc.playerHp = 0; finish('lose'); }
    };
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt, now);
      forceRender();
      if (!endedRef.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome]);

  const finish = (res) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const gc = g.current, s = stats.current;
    if (res === 'win') {
      const pct = gc.playerHp / PLAYER_TOWER_HP;
      const stars = pct >= 0.8 ? 3 : pct >= 0.4 ? 2 : 1;
      const coins = level.reward + s.correct * 5;
      setResult({ stars, correct: s.correct, total: s.total, coins });
      confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
      quest.completeArenaLevel({
        level: level.level, stars, correct: s.correct, total: s.total,
        topicStats: s.byTopic, runStreak: s.bestStreak, coins,
      });
    } else {
      setResult({ stars: 0, correct: s.correct, total: s.total, coins: 0 });
    }
    setOutcome(res);
  };

  const gc = g.current;
  const playerPct = Math.max(0, (gc.playerHp / PLAYER_TOWER_HP) * 100);
  const enemyPct = Math.max(0, (gc.enemyHp / level.towerHp) * 100);
  const elixir = Math.floor(gc.elixir);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <style>{`
        @keyframes aBob {0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes aRing {from{transform:translate(-50%,-50%) scale(.3);opacity:.8}to{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
        @keyframes aFloat {from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-30px);opacity:0}}
        @keyframes aPop {0%{transform:scale(0)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
        @keyframes aSpark {from{transform:translate(-50%,-50%) scale(.4);opacity:1}to{transform:translate(-50%,-50%) scale(1.7);opacity:0}}
        @keyframes aShake {0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
        @keyframes aElixPop {0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-24px);opacity:0}}
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onExit} className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#055b8e]">
          <ArrowLeft className="w-4 h-4" /> Leave
        </button>
        <div className="text-sm font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Level {level.level} · {level.boss}
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-600">
          <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" />{stats.current.correct}/{stats.current.total}</span>
          <span className="flex items-center gap-1 text-[#ed7219]"><TrendingUp className="w-4 h-4" />+{Math.round((bonus - 1) * 100)}%</span>
        </div>
      </div>

      {/* Tower HP bars */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-1"><Shield className="w-4 h-4 text-[#055b8e]" /> Your Tower</div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#055b8e] to-[#38bdf8] transition-all" style={{ width: `${playerPct}%` }} /></div>
        </div>
        <div>
          <div className="flex items-center justify-end gap-2 text-xs font-bold text-gray-600 mb-1">{level.boss} <Swords className="w-4 h-4 text-red-500" /></div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-l from-red-600 to-red-400 transition-all ml-auto" style={{ width: `${enemyPct}%` }} /></div>
        </div>
      </div>

      {/* Battlefield */}
      <div
        className={`relative w-full rounded-3xl overflow-hidden border-2 border-gray-200 shadow-inner mb-4 ${gc.shake > 0 ? '' : ''}`}
        style={{ height: 340, animation: gc.shake > 0 ? 'aShake .3s' : 'none' }}
      >
        {/* sky + ground layers */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#dbeafe 0%,#eff6ff 45%,#dcfce7 46%,#bbf7d0 100%)' }} />
        <div className="absolute inset-x-0" style={{ top: `${GROUND_TOP - 2}%`, bottom: 0, background: 'repeating-linear-gradient(90deg,rgba(5,91,142,0.06) 0 2px,transparent 2px 40px)' }} />
        <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: 'radial-gradient(circle at left,rgba(56,189,248,0.18),transparent 70%)' }} />
        <div className="absolute inset-y-0 right-0 w-1/3" style={{ background: 'radial-gradient(circle at right,rgba(239,68,68,0.16),transparent 70%)' }} />
        <div className="absolute" style={{ left: '50%', top: `${GROUND_TOP - 4}%`, bottom: '6%', width: 2, background: 'rgba(100,116,139,0.25)' }} />

        {/* Towers */}
        <div className="absolute" style={{ left: '2%', top: `${GROUND_TOP - 30}%`, width: 58, height: 92, filter: gc.towerHitP > 0 ? 'brightness(1.8)' : 'none' }}>
          <TowerSprite variant="player" />
        </div>
        <div className="absolute" style={{ right: '2%', top: `${GROUND_TOP - 30}%`, width: 58, height: 92, transform: 'scaleX(-1)', filter: gc.towerHitE > 0 ? 'brightness(1.8)' : 'none' }}>
          <TowerSprite variant="enemy" />
        </div>

        {/* Units */}
        {gc.units.map((u) => (
          <div key={u.uid} className="absolute" style={{ left: `${u.x}%`, top: `${GROUND_TOP - 12}%`, width: 46, height: 46, transform: 'translateX(-50%)' }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-black/15 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(u.hp / u.maxHp) * 100}%`, backgroundColor: u.side === 'player' ? '#22c55e' : '#f87171' }} />
            </div>
            <div style={{ width: 46, height: 46, transform: u.side === 'enemy' ? 'scaleX(-1)' : 'none', animation: 'aBob 1.2s ease-in-out infinite', filter: `drop-shadow(0 3px 3px rgba(0,0,0,.25)) ${u.side === 'enemy' ? 'hue-rotate(-10deg) saturate(1.3)' : ''}` }}>
              <UnitSprite id={u.id} />
            </div>
          </div>
        ))}

        {/* Effects */}
        {gc.fx.map((f) => {
          if (f.kind === 'ring') return <div key={f.id} className="absolute rounded-full border-4" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 44, height: 44, borderColor: f.color, animation: 'aRing .5s ease-out forwards' }} />;
          if (f.kind === 'spark') return <div key={f.id} className="absolute rounded-full" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 22, height: 22, background: 'radial-gradient(circle,#fde68a,transparent 70%)', animation: 'aSpark .3s ease-out forwards' }} />;
          if (f.kind === 'burst') return <div key={f.id} className="absolute rounded-full" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 34, height: 34, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,rgba(148,163,184,.8),transparent 70%)', animation: 'aSpark .4s ease-out forwards' }} />;
          if (f.kind === 'proj') return <div key={f.id} className="absolute rounded-full" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 12, height: 12, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,#a5f3fc,#06b6d4)', boxShadow: '0 0 8px #22d3ee' }} />;
          if (f.kind === 'dmg') return <div key={f.id} className="absolute font-extrabold text-sm" style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color, animation: 'aFloat .9s ease-out forwards', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{f.text}</div>;
          return null;
        })}
      </div>

      {/* Elixir bar */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          <div className="flex-1 flex gap-1">
            {Array.from({ length: ELIXIR_MAX }).map((_, i) => (
              <div key={i} className="h-4 flex-1 rounded-full transition-all" style={{ background: i < elixir ? 'linear-gradient(180deg,#c084fc,#7c3aed)' : '#ede9fe', boxShadow: i < elixir ? 'inset 0 1px 2px rgba(255,255,255,.5)' : 'none' }} />
            ))}
          </div>
          <span className="text-lg font-extrabold text-purple-600 w-7 text-right">{elixir}</span>
        </div>
        {elixirPops.map((p) => (
          <div key={p.id} className="absolute right-8 -top-1 text-purple-600 font-extrabold text-sm" style={{ animation: 'aElixPop .9s ease-out forwards' }}>+{p.amount}</div>
        ))}
      </div>

      {/* Deck */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {units.map((u) => {
          const isUnlocked = u.unlockLab <= labCount;
          const affordable = gc.elixir >= u.cost;
          const canPlay = isUnlocked && affordable && !outcome;
          return (
            <button
              key={u.id}
              onClick={() => canPlay && deploy(u)}
              disabled={!canPlay}
              title={u.blurb}
              className={`relative rounded-xl border-2 p-2 text-center transition-all ${
                canPlay ? 'border-gray-200 hover:border-[#ed7219] bg-white hover:-translate-y-0.5' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className={`w-9 h-9 mx-auto ${isUnlocked ? '' : 'opacity-30'}`}><UnitSprite id={u.id} /></div>
              <div className={`text-[10px] font-bold leading-tight truncate ${isUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>{u.name}</div>
              {isUnlocked ? (
                <div className={`flex items-center justify-center gap-0.5 text-xs font-bold ${affordable ? 'text-purple-600' : 'text-gray-300'}`}>
                  <Zap className="w-3 h-3" /> {u.cost}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-0.5 text-[10px] font-bold text-gray-400">
                  <Lock className="w-3 h-3" /> Lab {u.unlockLab}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Question */}
      {!outcome && question && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Answer correctly to charge elixir</span>
            <span>{question.category}{(ELIXIR_BY_QLEVEL[question.level] || 2) > 2 ? ` · +${ELIXIR_BY_QLEVEL[question.level]} elixir` : ''}</span>
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
                <button key={i} onClick={() => answer(i)} disabled={picked !== null}
                  className={`text-left px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all flex items-center justify-between ${style}`}>
                  {opt}
                  {picked !== null && i === question.answer && <Check className="w-4 h-4 shrink-0" />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className={`mt-3 text-sm rounded-xl p-3 ${picked === question.answer ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
              <strong>{picked === question.answer ? `Correct. +${ELIXIR_BY_QLEVEL[question.level] || 2} elixir. ` : 'Not quite. '}</strong>{question.explain}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {outcome && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
              {outcome === 'win' ? (
                <>
                  <div className="flex justify-center gap-1 mb-3">
                    {[1, 2, 3].map((s) => <Star key={s} className={`w-9 h-9 ${s <= result.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />)}
                  </div>
                  <h3 className="text-2xl font-bold text-[#055b8e] mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Victory!</h3>
                  <p className="text-gray-500 text-sm mb-4">You defeated {level.boss} with {result.correct}/{result.total} correct answers.</p>
                  <div className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 font-bold rounded-full px-4 py-1.5 mb-2"><Coins className="w-4 h-4" /> +{result.coins} coins</div>
                  <p className="text-xs text-gray-400 mb-6">Spend coins in the Science Lab to power up your army.</p>
                </>
              ) : (
                <>
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-gray-700 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>Tower Down</h3>
                  <p className="text-gray-500 text-sm mb-6">You answered {result.correct}/{result.total} correctly. Build up your lab and try again.</p>
                </>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={onExit} variant="outline" className="rounded-xl">Level Map</Button>
                <Button onClick={onComplete} className="bg-[#ed7219] hover:bg-[#d86515] rounded-xl">{outcome === 'win' ? 'Continue' : 'Try Again'}</Button>
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
  const labCount = quest.lab.length;

  const cleared = quest.arena.level;
  const chapters = useMemo(() => {
    const map = {};
    levels.forEach((l) => { (map[l.chapter] = map[l.chapter] || []).push(l); });
    return map;
  }, []);

  if (activeLevel) {
    return (
      <div className="min-h-screen bg-gray-50 py-4">
        <Battle key={battleKey} level={activeLevel} labCount={labCount}
          onExit={() => setActiveLevel(null)} onComplete={() => setActiveLevel(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Science Arena
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/80 max-w-2xl mx-auto">
            Every correct science answer charges your elixir. Deploy your army, topple the enemy tower,
            and battle through the campaign. The bigger your Science Lab, the stronger your units.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Trophy} value={`${cleared}/${ARENA_TOTAL_LEVELS}`} label="Levels Cleared" tint="bg-blue-50 text-[#055b8e]" />
          <StatCard icon={Star} value={`${Object.values(quest.arena.stars).reduce((a, b) => a + b, 0)}/${ARENA_TOTAL_LEVELS * 3}`} label="Stars" tint="bg-yellow-50 text-yellow-500" />
          <StatCard icon={TrendingUp} value={`+${Math.round((armyBonus(labCount) - 1) * 100)}%`} label="Army Power" tint="bg-orange-50 text-[#ed7219]" />
          <StatCard icon={Coins} value={quest.coins.toLocaleString()} label="Coins" tint="bg-yellow-50 text-yellow-500" />
        </div>

        {/* Loop explainer */}
        <div className="bg-gradient-to-br from-[#055b8e] to-[#044a73] text-white rounded-2xl p-5 mb-8">
          <h3 className="font-bold mb-2 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <Info className="w-5 h-5 text-[#ed7219]" /> How the Arena and Lab work together
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm text-white/85">
            <p><strong>1. Answer to fight.</strong> Correct answers are the only way to earn elixir. Spend it to deploy units and destroy the enemy tower.</p>
            <p><strong>2. Win coins.</strong> Every battle you win pays out Research Coins based on how well you answered.</p>
            <p className="flex items-start gap-1"><FlaskConical className="w-4 h-4 shrink-0 mt-0.5 text-[#ed7219]" /> <span><strong>3. Power up.</strong> Spend coins in the Science Lab. Each instrument makes your whole army stronger and unlocks new units for the next battle.</span></p>
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-8">
          {Object.entries(chapters).map(([chapter, chLevels]) => (
            <div key={chapter}>
              <h2 className="font-bold text-[#055b8e] text-lg mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>{chapter}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {chLevels.map((l) => {
                  const locked = l.level > cleared + 1;
                  const done = l.level <= cleared;
                  const stars = quest.arena.stars[l.level] || 0;
                  return (
                    <button key={l.level}
                      onClick={() => { if (!locked) { setBattleKey((k) => k + 1); setActiveLevel(l); } }}
                      disabled={locked}
                      className={`text-left rounded-2xl border-2 p-4 transition-all ${
                        locked ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : done ? 'border-green-200 bg-green-50/40 hover:border-green-300'
                          : 'border-[#ed7219]/40 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
                      }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-400">Level {l.level}</span>
                        {locked ? <Lock className="w-4 h-4 text-gray-300" /> : done ? <Check className="w-4 h-4 text-green-500" /> : <Play className="w-4 h-4 text-[#ed7219]" />}
                      </div>
                      <div className="font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>{l.boss}</div>
                      <div className="text-xs text-gray-500 mb-2">{l.topics.join(' · ')}</div>
                      <div className="flex gap-0.5">{[1, 2, 3].map((s) => <Star key={s} className={`w-4 h-4 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />)}</div>
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

function StatCard({ icon: Icon, value, label, tint }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}><Icon className="w-5 h-5" /></div>
      <div>
        <div className="text-xl font-bold text-[#055b8e]">{value}</div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
      </div>
    </div>
  );
}
