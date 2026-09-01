import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Check, X, Shield, Swords, Zap, Trophy, Info } from 'lucide-react';
import { Button, Badge, cn } from '@/components/cq';
import { UnitSprite, TowerSprite } from '@/components/arena/ArenaSprites';
import units from '@/data/arenaUnits.json';

/* ============================================================================
   Arena battle.

   This mechanic is the one genuinely distinctive thing the original site had,
   so it is preserved rather than replaced — and rebuilt around three fixes:

   1. It is no longer gated. Any battle can be opened at any time; difficulty
      is signposted instead of locked.
   2. Every answer is recorded as real evidence, tagged to the science skill
      it exercises, so playing a battle builds the same mastery record a quiz
      does. Previously the battle kept its own private tally.
   3. It works on a Chromebook and a tablet. The field scales with the
      viewport, deck buttons are proper touch targets, and the state of the
      battle is narrated to screen readers instead of existing only as pixels.

   The loop itself is unchanged, because it works: correct answers are the ONLY
   source of elixir, elixir deploys units, units bring down the tower. Getting
   the science right is the whole weapon.
   ========================================================================= */

const ELIXIR_MAX = 10;
const ELIXIR_START = 5;
const ELIXIR_BY_LEVEL = { 1: 2, 2: 3, 3: 4 };
const PLAYER_TOWER_HP = 1000;
const GROUND = 58;            // % from top where units stand
const LETTERS = ['A', 'B', 'C', 'D'];

const unitById = (id) => units.find((u) => u.id === id);

function shuffled(arr, seed = 1) {
  const a = [...arr];
  let s = seed;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BattleActivity({ activity, onAnswer, onProgress, onDone }) {
  const cfg = activity.config || {};
  const pool = useMemo(() => shuffled(activity.questions || [], (cfg.level || 1) * 7 + 3), [activity, cfg.level]);

  const [, tick] = useReducer((x) => x + 1, 0);
  const [outcome, setOutcome] = useState(null);
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState(pool[0] || null);
  const [picked, setPicked] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const [pops, setPops] = useState([]);

  const qIndex = useRef(0);
  const ended = useRef(false);
  const stats = useRef({ asked: 0, correct: 0, streak: 0, bestStreak: 0 });

  /* All fast-changing battle state lives in a ref and is committed to the DOM
     once per animation frame. Putting it in React state would re-render the
     whole tree sixty times a second for no benefit. */
  const g = useRef({
    elixir: ELIXIR_START,
    enemyEnergy: 0,
    playerHp: PLAYER_TOWER_HP,
    enemyHp: cfg.towerHp || 900,
    units: [],
    fx: [],
    nextId: 1,
    hitPlayer: 0,
    hitEnemy: 0,
    shake: 0,
    pendingE: 0,
    pendingP: 0,
    dmgTick: 0,
  });

  const enemyPerAnswer = 0.7 + ((cfg.level || 1) - 1) * 0.12;
  const enemyScale = 1 + ((cfg.level || 1) - 1) * 0.06;
  const deck = units;

  const addFx = (fx) => { g.current.fx.push({ id: g.current.nextId += 1, born: performance.now(), ...fx }); };

  const nextQuestion = useCallback(() => {
    if (!pool.length) return;
    qIndex.current = (qIndex.current + 1) % pool.length;
    setQuestion(pool[qIndex.current]);
    setPicked(null);
    setVerdict(null);
  }, [pool]);

  const trySpawnEnemy = useCallback(() => {
    const gc = g.current;
    const affordable = (cfg.enemyDeck || ['spark']).map(unitById).filter((u) => u && u.cost <= gc.enemyEnergy);
    if (!affordable.length) return;
    const unit = affordable.sort((a, b) => b.cost - a.cost)[0];
    gc.enemyEnergy -= unit.cost;
    gc.units.push({
      uid: (gc.nextId += 1), side: 'enemy', x: 90, id: unit.id,
      hp: Math.round(unit.hp * enemyScale), maxHp: Math.round(unit.hp * enemyScale),
      dmg: unit.dmg * enemyScale, speed: unit.speed, range: unit.range, lastShot: 0,
    });
    addFx({ kind: 'ring', x: 90, y: GROUND, color: 'var(--arena-foe)', ttl: 0.5 });
  }, [cfg.enemyDeck, enemyScale]);

  const answer = useCallback(async (choice) => {
    if (picked !== null || outcome || !question) return;
    setPicked(choice);
    const gc = g.current;
    gc.enemyEnergy += enemyPerAnswer;

    let res = null;
    try {
      res = await onAnswer(question, choice);
    } catch {
      res = { isCorrect: null, explanation: 'Could not save that answer — carry on.' };
    }
    setVerdict(res);
    stats.current.asked += 1;

    if (res?.isCorrect) {
      stats.current.correct += 1;
      stats.current.streak += 1;
      stats.current.bestStreak = Math.max(stats.current.bestStreak, stats.current.streak);
      const gain = ELIXIR_BY_LEVEL[question.difficulty] || 2;
      gc.elixir = Math.min(ELIXIR_MAX, gc.elixir + gain);
      const id = (gc.nextId += 1);
      setPops((p) => [...p, { id, amount: gain }]);
      setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 900);
      setAnnouncement(`Correct. Plus ${gain} elixir. You now have ${Math.floor(gc.elixir)}.`);
    } else {
      stats.current.streak = 0;
      setAnnouncement('Not quite. No elixir this time, and the enemy advances.');
    }

    trySpawnEnemy();
    onProgress?.(stats.current.asked, stats.current);
    setTimeout(() => { if (!ended.current) nextQuestion(); }, res?.isCorrect ? 900 : 2200);
  }, [picked, outcome, question, enemyPerAnswer, onAnswer, onProgress, trySpawnEnemy, nextQuestion]);

  const deploy = (unit) => {
    if (outcome) return;
    const gc = g.current;
    if (gc.elixir < unit.cost) return;
    gc.elixir -= unit.cost;
    gc.units.push({
      uid: (gc.nextId += 1), side: 'player', x: 10, id: unit.id,
      hp: unit.hp, maxHp: unit.hp, dmg: unit.dmg,
      speed: unit.speed, range: unit.range, lastShot: 0,
    });
    addFx({ kind: 'ring', x: 10, y: GROUND, color: 'var(--arena-ally)', ttl: 0.5 });
    setAnnouncement(`${unit.name} deployed. ${Math.floor(gc.elixir)} elixir left.`);
  };

  const finish = useCallback((res) => {
    if (ended.current) return;
    ended.current = true;
    const gc = g.current;
    const s = stats.current;
    const stars = res === 'win'
      ? (gc.playerHp / PLAYER_TOWER_HP >= 0.8 ? 3 : gc.playerHp / PLAYER_TOWER_HP >= 0.4 ? 2 : 1)
      : 0;
    setResult({ stars, asked: s.asked, correct: s.correct, bestStreak: s.bestStreak, won: res === 'win' });
    setOutcome(res);
    setAnnouncement(res === 'win'
      ? `Victory. You answered ${s.correct} of ${s.asked} correctly.`
      : `Your tower fell. You answered ${s.correct} of ${s.asked} correctly.`);
  }, []);

  /* Movement and combat animate in real time; spawns are answer-gated. */
  useEffect(() => {
    let raf;
    let last = performance.now();
    const step = (dt, now) => {
      const gc = g.current;
      if (outcome) return;
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
          if (now - u.lastShot > 320) {
            u.lastShot = now;
            if (u.range > 12) addFx({ kind: 'proj', x: u.x, y: GROUND - 2, tx: target.x, ttl: 0.4 });
            else addFx({ kind: 'spark', x: (u.x + target.x) / 2, y: GROUND, ttl: 0.3 });
          }
        } else if (u.side === 'player' && u.x >= 82) {
          gc.enemyHp -= u.dmg * dt; gc.pendingE += u.dmg * dt; gc.hitEnemy = 0.2; gc.shake = 0.25;
        } else if (u.side === 'enemy' && u.x <= 18) {
          gc.playerHp -= u.dmg * dt; gc.pendingP += u.dmg * dt; gc.hitPlayer = 0.2; gc.shake = 0.25;
        } else {
          u.x += (u.side === 'player' ? 1 : -1) * u.speed * dt;
          u.x = Math.max(6, Math.min(94, u.x));
        }
      }
      for (const u of gc.units) {
        if (u.hp <= 0 && !u.dead) { u.dead = true; addFx({ kind: 'burst', x: u.x, y: GROUND, ttl: 0.4 }); }
      }
      gc.units = gc.units.filter((u) => u.hp > 0);

      gc.dmgTick -= dt;
      if (gc.dmgTick <= 0) {
        gc.dmgTick = 0.5;
        if (gc.pendingE >= 1) { addFx({ kind: 'dmg', x: 86, y: 30, text: `-${Math.round(gc.pendingE)}`, ttl: 0.9 }); gc.pendingE = 0; }
        if (gc.pendingP >= 1) { addFx({ kind: 'dmg', x: 12, y: 30, text: `-${Math.round(gc.pendingP)}`, ttl: 0.9 }); gc.pendingP = 0; }
      }
      for (const f of gc.fx) if (f.kind === 'proj') f.x += (f.tx > f.x ? 1 : -1) * 60 * dt;
      gc.hitPlayer = Math.max(0, gc.hitPlayer - dt);
      gc.hitEnemy = Math.max(0, gc.hitEnemy - dt);
      gc.shake = Math.max(0, gc.shake - dt);
      gc.fx = gc.fx.filter((f) => (now - f.born) / 1000 < f.ttl);

      if (gc.enemyHp <= 0) { gc.enemyHp = 0; finish('win'); }
      else if (gc.playerHp <= 0) { gc.playerHp = 0; finish('lose'); }
    };
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt, now);
      tick();
      if (!ended.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [outcome, finish]);

  const gc = g.current;
  const playerPct = Math.max(0, (gc.playerHp / PLAYER_TOWER_HP) * 100);
  const enemyPct = Math.max(0, (gc.enemyHp / (cfg.towerHp || 900)) * 100);
  const elixir = Math.floor(gc.elixir);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <style>{`
        @keyframes abBob {0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes abRing {from{transform:translate(-50%,-50%) scale(.3);opacity:.85}to{transform:translate(-50%,-50%) scale(1.9);opacity:0}}
        @keyframes abFloat {from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-30px);opacity:0}}
        @keyframes abSpark {from{transform:translate(-50%,-50%) scale(.4);opacity:1}to{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
        @keyframes abShake {0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
        @keyframes abPop {0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-26px);opacity:0}}
      `}</style>

      {/* The battle exists visually; this is how it exists for a screen reader. */}
      <p aria-live="polite" className="cq-sr">{announcement}</p>

      {/* Tower health */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-arena-text-2">
            <Shield size={13} aria-hidden="true" className="text-arena-ally" /> Your tower
          </p>
          <div role="meter" aria-valuenow={Math.round(playerPct)} aria-valuemin={0} aria-valuemax={100}
            aria-label="Your tower health"
            className="h-2.5 overflow-hidden rounded-pill bg-arena-surface-2">
            <div className="h-full rounded-pill bg-arena-ally transition-[width] duration-2"
              style={{ width: `${playerPct}%` }} />
          </div>
        </div>
        <div>
          <p className="mb-1.5 flex items-center justify-end gap-1.5 text-xs font-semibold text-arena-text-2">
            {cfg.boss || 'Enemy'} <Swords size={13} aria-hidden="true" className="text-arena-foe" />
          </p>
          <div role="meter" aria-valuenow={Math.round(enemyPct)} aria-valuemin={0} aria-valuemax={100}
            aria-label={`${cfg.boss || 'Enemy'} tower health`}
            className="flex h-2.5 justify-end overflow-hidden rounded-pill bg-arena-surface-2">
            <div className="h-full rounded-pill bg-arena-foe transition-[width] duration-2"
              style={{ width: `${enemyPct}%` }} />
          </div>
        </div>
      </div>

      {/* Battlefield. Aspect-ratio keeps it usable from 360px to a smartboard. */}
      <div
        className="relative mt-3 w-full overflow-hidden rounded-lg border border-arena-line"
        style={{ aspectRatio: '16 / 8', minHeight: 220, animation: gc.shake > 0 ? 'abShake .3s' : 'none' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#132C46 0%,#16344F 45%,#1B4038 46%,#1D4B3C 100%)' }} />
        <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: 'radial-gradient(circle at left,rgba(63,182,242,.18),transparent 70%)' }} />
        <div className="absolute inset-y-0 right-0 w-1/3" style={{ background: 'radial-gradient(circle at right,rgba(244,99,90,.16),transparent 70%)' }} />
        <div className="absolute" style={{ left: '50%', top: `${GROUND - 4}%`, bottom: '6%', width: 2, background: 'rgba(255,255,255,.12)' }} />

        <div className="absolute" style={{ left: '2%', top: `${GROUND - 30}%`, width: '13%', aspectRatio: '58/92', filter: gc.hitPlayer > 0 ? 'brightness(1.9)' : 'none' }}>
          <TowerSprite variant="player" />
        </div>
        <div className="absolute" style={{ right: '2%', top: `${GROUND - 30}%`, width: '13%', aspectRatio: '58/92', transform: 'scaleX(-1)', filter: gc.hitEnemy > 0 ? 'brightness(1.9)' : 'none' }}>
          <TowerSprite variant="enemy" />
        </div>

        {gc.units.map((u) => (
          <div key={u.uid} className="absolute"
            style={{ left: `${u.x}%`, top: `${GROUND - 12}%`, width: '9%', aspectRatio: '1', transform: 'translateX(-50%)' }}>
            <div className="absolute -top-2 left-1/2 h-1.5 w-8 -translate-x-1/2 overflow-hidden rounded-pill bg-black/30">
              <div className="h-full rounded-pill"
                style={{ width: `${(u.hp / u.maxHp) * 100}%`, background: u.side === 'player' ? 'var(--arena-ally)' : 'var(--arena-foe)' }} />
            </div>
            <div style={{
              transform: u.side === 'enemy' ? 'scaleX(-1)' : 'none',
              animation: 'abBob 1.2s ease-in-out infinite',
              filter: `drop-shadow(0 3px 4px rgba(0,0,0,.4)) ${u.side === 'enemy' ? 'hue-rotate(-12deg) saturate(1.25)' : ''}`,
            }}>
              <UnitSprite id={u.id} />
            </div>
          </div>
        ))}

        {gc.fx.map((f) => {
          if (f.kind === 'ring') return <div key={f.id} className="absolute rounded-pill border-4" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 40, height: 40, borderColor: f.color, animation: 'abRing .5s ease-out forwards' }} />;
          if (f.kind === 'spark') return <div key={f.id} className="absolute rounded-pill" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 22, height: 22, background: 'radial-gradient(circle,#FDE68A,transparent 70%)', animation: 'abSpark .3s ease-out forwards' }} />;
          if (f.kind === 'burst') return <div key={f.id} className="absolute rounded-pill" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 34, height: 34, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,rgba(255,255,255,.55),transparent 70%)', animation: 'abSpark .4s ease-out forwards' }} />;
          if (f.kind === 'proj') return <div key={f.id} className="absolute rounded-pill" style={{ left: `${f.x}%`, top: `${f.y}%`, width: 11, height: 11, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,#CFF6FF,#3FB6F2)', boxShadow: '0 0 10px #3FB6F2' }} />;
          if (f.kind === 'dmg') return <div key={f.id} className="cq-data absolute text-sm" style={{ left: `${f.x}%`, top: `${f.y}%`, color: '#FF9089', animation: 'abFloat .9s ease-out forwards' }}>{f.text}</div>;
          return null;
        })}
      </div>

      {/* Elixir */}
      <div className="relative mt-4">
        <div className="flex items-center gap-3">
          <Zap size={18} aria-hidden="true" className="shrink-0 text-arena-elixir-2" />
          <div className="flex flex-1 gap-1" role="meter" aria-valuenow={elixir} aria-valuemin={0} aria-valuemax={ELIXIR_MAX} aria-label="Elixir">
            {Array.from({ length: ELIXIR_MAX }).map((_, i) => (
              <div key={i} className="h-3.5 flex-1 rounded-pill transition-colors duration-2"
                style={{ background: i < elixir ? 'var(--arena-elixir)' : 'var(--arena-surface-2)' }} />
            ))}
          </div>
          <span className="cq-data w-7 shrink-0 text-right text-lg text-arena-elixir-2">{elixir}</span>
        </div>
        {pops.map((p) => (
          <div key={p.id} className="cq-data absolute right-9 -top-1 text-sm text-arena-elixir-2"
            style={{ animation: 'abPop .9s ease-out forwards' }}>+{p.amount}</div>
        ))}
      </div>

      {/* Deck — real touch targets, cost stated as text not just colour. */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {deck.map((u) => {
          const affordable = gc.elixir >= u.cost;
          const canPlay = affordable && !outcome;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => canPlay && deploy(u)}
              disabled={!canPlay}
              title={u.blurb}
              aria-label={`Deploy ${u.name}, costs ${u.cost} elixir. ${u.blurb}`}
              className={cn(
                'flex min-h-[var(--tap-kid)] flex-col items-center gap-1 rounded-md border p-2 transition-all duration-1',
                canPlay
                  ? 'border-arena-line-2 bg-arena-surface hover:-translate-y-0.5 hover:border-arena-ally'
                  : 'border-arena-line bg-arena-surface/60 opacity-55',
              )}
            >
              <span className="h-8 w-8"><UnitSprite id={u.id} /></span>
              <span className="w-full truncate text-center text-[0.6875rem] font-semibold leading-tight text-arena-text-2">
                {u.name}
              </span>
              <span className={cn('cq-data inline-flex items-center gap-0.5 text-xs',
                affordable ? 'text-arena-elixir-2' : 'text-arena-muted')}>
                <Zap size={11} aria-hidden="true" /> {u.cost}
              </span>
            </button>
          );
        })}
      </div>

      {/* Question */}
      {!outcome && question ? (
        <div className="mt-5 rounded-lg border border-arena-line bg-arena-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-arena-text-2">
              Answer correctly to charge elixir
            </p>
            <Badge tone="info">+{ELIXIR_BY_LEVEL[question.difficulty] || 2} elixir</Badge>
          </div>
          <p className="mt-3 font-display text-lg font-bold leading-snug text-arena-text">{question.prompt}</p>
          <div role="group" aria-label="Answer choices" className="mt-4 grid gap-2 sm:grid-cols-2">
            {question.choices.map((opt, i) => {
              const isPicked = i === picked;
              const isAnswer = picked !== null && verdict?.isCorrect !== null
                && (verdict?.isCorrect ? isPicked : verdict?.answer === i);
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => answer(i)}
                  className={cn(
                    'flex min-h-[var(--tap-kid)] items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-1',
                    picked === null && 'border-arena-line-2 bg-arena-surface-2 hover:-translate-y-px hover:border-arena-ally',
                    picked !== null && isPicked && verdict?.isCorrect && 'border-success-700 bg-success-100 text-success-700',
                    picked !== null && isPicked && verdict?.isCorrect === false && 'border-danger-600 bg-danger-100 text-danger-700',
                    picked !== null && !isPicked && isAnswer && 'border-success-700 bg-success-100 text-success-700',
                    picked !== null && !isPicked && !isAnswer && 'border-arena-line opacity-50',
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-arena-surface-3 text-xs font-bold text-arena-text">
                    {picked !== null && isPicked && verdict?.isCorrect ? <Check size={14} aria-hidden="true" />
                      : picked !== null && isPicked && verdict?.isCorrect === false ? <X size={14} aria-hidden="true" />
                      : LETTERS[i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {picked !== null && verdict ? (
            <p className={cn('mt-3.5 flex items-start gap-2 rounded-md p-3.5 text-sm leading-relaxed',
              verdict.isCorrect ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700')}>
              <Info size={15} aria-hidden="true" className="mt-0.5 shrink-0 opacity-70" />
              <span>
                <strong className="font-semibold">{verdict.isCorrect ? 'Correct. ' : 'Not quite. '}</strong>
                {verdict.explanation || question.explanation}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Outcome */}
      {outcome && result ? (
        <div className="mt-5 rounded-lg border border-arena-line bg-arena-surface p-6 text-center">
          {result.won ? (
            <>
              <div className="flex justify-center gap-1" aria-hidden="true">
                {[1, 2, 3].map((s) => (
                  <Trophy key={s} size={30}
                    className={s <= result.stars ? 'text-arena-gold' : 'text-arena-line-2'} />
                ))}
              </div>
              <h3 className="mt-3 text-h3 text-arena-text">Tower down.</h3>
              <p className="mt-2 text-arena-text-2">
                You beat {cfg.boss} with {result.correct} of {result.asked} answers correct
                {result.bestStreak >= 3 ? `, including a run of ${result.bestStreak} in a row` : ''}.
              </p>
            </>
          ) : (
            <>
              <Shield size={34} aria-hidden="true" className="mx-auto text-arena-muted" />
              <h3 className="mt-3 text-h3 text-arena-text">Your tower fell.</h3>
              <p className="mt-2 text-arena-text-2">
                You answered {result.correct} of {result.asked} correctly — that all still counts
                toward your skills. Deploy earlier next time and keep the elixir moving.
              </p>
            </>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => onDone?.({ asked: result.asked, correct: result.correct, won: result.won, stars: result.stars })}>
              See what you learned
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
