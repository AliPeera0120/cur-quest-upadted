import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Rocket, Target, RotateCcw, Trophy, Flame, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

// ----- World constants -----
const CANVAS_W = 960;
const CANVAS_H = 480;
const GROUND_H = 46;
const SCALE = 6; // pixels per meter
const LAUNCH_X = 60; // px
const BALL_R = 7; // px
const TARGET_HALF_WIDTH_M = 3; // hit tolerance in meters

const PLANETS = {
  earth: {
    name: 'Earth', g: 9.8, emoji: '🌍',
    sky: ['#7ec8f7', '#cdeaff'], ground: '#5aa845',
    fact: 'Gravity on Earth pulls everything down at 9.8 m/s² — that\'s why a ball and a feather fall differently only because of air!',
  },
  moon: {
    name: 'Moon', g: 1.62, emoji: '🌕',
    sky: ['#1a1a2e', '#3d3d5c'], ground: '#9a9a9a',
    fact: 'The Moon\'s gravity is 6× weaker than Earth\'s. Astronaut Alan Shepard hit a golf ball here — it flew for miles!',
  },
  mars: {
    name: 'Mars', g: 3.71, emoji: '🔴',
    sky: ['#d98e5a', '#f5c9a0'], ground: '#b5541c',
    fact: 'Mars has about 1/3 of Earth\'s gravity. If you can jump 1 meter high on Earth, you could jump almost 3 meters on Mars!',
  },
  jupiter: {
    name: 'Jupiter', g: 24.79, emoji: '🟠',
    sky: ['#c9a06a', '#e8d4a9'], ground: '#8a6237',
    fact: 'Jupiter\'s gravity is 2.5× stronger than Earth\'s. A ball thrown here comes crashing down fast — you\'d weigh over 2× more!',
  },
};

const randomTarget = (g) => {
  const v0max = 50;
  const maxRange = Math.min(140, (v0max * v0max) / g * 0.9);
  const min = 25;
  return min + Math.random() * (maxRange - min);
};

export default function PhysicsPlayground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // Controls (state drives UI; refs drive the animation loop)
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(60);
  const [planetKey, setPlanetKey] = useState('earth');
  const [showHint, setShowHint] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flying, setFlying] = useState(false);
  const [lastShot, setLastShot] = useState(null); // { distance, maxHeight, time, hit }
  const [message, setMessage] = useState('Set your angle and power, then launch! 🚀');

  const stateRef = useRef({
    angle: 45, power: 60, planetKey: 'earth', showHint: false,
    targetDist: randomTarget(PLANETS.earth.g),
    ball: null, // { t, trail: [...] }
    landed: null,
  });

  // keep refs in sync with UI state
  useEffect(() => { stateRef.current.angle = angle; }, [angle]);
  useEffect(() => { stateRef.current.power = power; }, [power]);
  useEffect(() => { stateRef.current.showHint = showHint; }, [showHint]);
  useEffect(() => {
    stateRef.current.planetKey = planetKey;
    stateRef.current.targetDist = randomTarget(PLANETS[planetKey].g);
    stateRef.current.ball = null;
    stateRef.current.landed = null;
    setLastShot(null);
    setFlying(false);
    setMessage(`Welcome to ${PLANETS[planetKey].name}! Gravity here is ${PLANETS[planetKey].g} m/s². 🎯`);
  }, [planetKey]);

  const v0FromPower = (p) => 10 + (p / 100) * 40; // 10–50 m/s

  const launch = useCallback(() => {
    const s = stateRef.current;
    if (s.ball) return;
    s.ball = { t: 0, trail: [] };
    s.landed = null;
    setFlying(true);
    setMessage('Whoosh! 🚀');
  }, []);

  const resetTarget = useCallback(() => {
    const s = stateRef.current;
    s.targetDist = randomTarget(PLANETS[s.planetKey].g);
    s.ball = null;
    s.landed = null;
    setLastShot(null);
    setFlying(false);
    setMessage('New target placed. You got this! 🎯');
  }, []);

  // ----- Drawing + physics loop -----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const groundY = CANVAS_H - GROUND_H;
    const mToPx = (xm, ym) => [LAUNCH_X + xm * SCALE, groundY - ym * SCALE];

    const draw = (now) => {
      const s = stateRef.current;
      const planet = PLANETS[s.planetKey];
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const v0 = v0FromPower(s.power);
      const rad = (s.angle * Math.PI) / 180;
      const vx = v0 * Math.cos(rad);
      const vy = v0 * Math.sin(rad);

      // --- physics step ---
      if (s.ball) {
        s.ball.t += dt;
        const t = s.ball.t;
        const xm = vx * t;
        const ym = vy * t - 0.5 * planet.g * t * t;

        if (ym <= 0 && t > 0.1) {
          // landed
          const landT = (2 * vy) / planet.g;
          const dist = vx * landT;
          const maxH = (vy * vy) / (2 * planet.g);
          const hit = Math.abs(dist - s.targetDist) <= TARGET_HALF_WIDTH_M;
          s.landed = { xm: dist };
          s.ball = null;
          setFlying(false);
          setLastShot({ distance: dist, maxHeight: maxH, time: landT, hit });
          if (hit) {
            setScore((sc) => sc + 10);
            setStreak((st) => st + 1);
            setMessage('🎉 BULLSEYE! Amazing shot!');
            confetti({ particleCount: 130, spread: 75, origin: { y: 0.7 } });
            s.targetDist = randomTarget(planet.g);
          } else {
            setStreak(0);
            const off = dist - s.targetDist;
            setMessage(
              off > 0
                ? `Overshot by ${off.toFixed(1)} m — try less power or a steeper angle!`
                : `Short by ${(-off).toFixed(1)} m — add power or flatten your angle!`
            );
          }
        } else {
          s.ball.trail.push([xm, Math.max(ym, 0)]);
          if (s.ball.trail.length > 400) s.ball.trail.shift();
        }
      }

      // --- render ---
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, planet.sky[0]);
      skyGrad.addColorStop(1, planet.sky[1]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // stars on dark skies
      if (s.planetKey === 'moon') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 40; i++) {
          const sx = (i * 137.5) % CANVAS_W;
          const sy = (i * 89.3) % (CANVAS_H - 150);
          ctx.fillRect(sx, sy, 2, 2);
        }
      }

      // ground
      ctx.fillStyle = planet.ground;
      ctx.fillRect(0, groundY, CANVAS_W, GROUND_H);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, groundY, CANVAS_W, 5);

      // distance markers every 25 m
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      for (let m = 25; m <= 150; m += 25) {
        const [mx] = mToPx(m, 0);
        if (mx < CANVAS_W - 10) {
          ctx.fillRect(mx, groundY, 2, 8);
          ctx.fillText(`${m}m`, mx, groundY + 24);
        }
      }

      // target
      const [tx] = mToPx(s.targetDist, 0);
      const tw = TARGET_HALF_WIDTH_M * SCALE;
      ctx.fillStyle = '#e63946';
      ctx.fillRect(tx - tw, groundY - 6, tw * 2, 6);
      ctx.fillStyle = '#fff';
      ctx.fillRect(tx - tw / 2, groundY - 6, tw, 6);
      // flag
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, groundY - 6);
      ctx.lineTo(tx, groundY - 40);
      ctx.stroke();
      ctx.fillStyle = '#ed7219';
      ctx.beginPath();
      ctx.moveTo(tx, groundY - 40);
      ctx.lineTo(tx + 22, groundY - 33);
      ctx.lineTo(tx, groundY - 26);
      ctx.closePath();
      ctx.fill();

      // hint: predicted path (dotted)
      if (s.showHint && !s.ball) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const totalT = (2 * vy) / planet.g;
        for (let i = 0; i <= 30; i++) {
          const t = (totalT * i) / 30;
          const xm = vx * t;
          const ym = vy * t - 0.5 * planet.g * t * t;
          const [px, py] = mToPx(xm, ym);
          if (px < CANVAS_W) {
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // trail
      const trail = s.ball?.trail || [];
      ctx.fillStyle = 'rgba(237,114,25,0.5)';
      trail.forEach(([xm, ym], i) => {
        if (i % 4 !== 0) return;
        const [px, py] = mToPx(xm, ym);
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // launcher (cannon)
      const [cx, cy] = [LAUNCH_X, groundY];
      ctx.save();
      ctx.translate(cx, cy - 10);
      ctx.rotate(-rad);
      ctx.fillStyle = '#055b8e';
      ctx.fillRect(0, -7, 44, 14);
      ctx.restore();
      ctx.fillStyle = '#044a73';
      ctx.beginPath();
      ctx.arc(cx, cy - 8, 16, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - 16, cy - 8, 32, 8);

      // ball
      if (s.ball) {
        const t = s.ball.t;
        const xm = vx * t;
        const ym = Math.max(vy * t - 0.5 * planet.g * t * t, 0);
        const [px, py] = mToPx(xm, ym);
        ctx.fillStyle = '#ed7219';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py - BALL_R, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // landed marker
      if (s.landed) {
        const [lx] = mToPx(s.landed.xm, 0);
        ctx.fillStyle = '#ed7219';
        ctx.beginPath();
        ctx.arc(lx, groundY - BALL_R, BALL_R, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const planet = PLANETS[planetKey];
  const v0 = v0FromPower(power);

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
            Physics Playground 🚀
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 max-w-2xl mx-auto"
          >
            Launch the ball and hit the target! Change the angle, power, and even the planet —
            and discover how gravity shapes every throw.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Score bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
              <Trophy className="w-5 h-5 text-[#ed7219]" />
              <span className="font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Score: {score}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
              <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
              <span className="font-bold text-[#055b8e]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Streak: {streak}
              </span>
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600">{message}</p>
        </div>

        {/* Game canvas */}
        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full h-auto block"
          />
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#055b8e] mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              🎛️ Launch Controls
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Angle</span>
                  <span className="text-[#ed7219] font-bold">{angle}°</span>
                </div>
                <Slider value={[angle]} min={10} max={80} step={1} onValueChange={([v]) => setAngle(v)} />
              </div>
              <div>
                <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                  <span>Power</span>
                  <span className="text-[#ed7219] font-bold">{v0.toFixed(0)} m/s</span>
                </div>
                <Slider value={[power]} min={0} max={100} step={1} onValueChange={([v]) => setPower(v)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-yellow-500" /> Show predicted path
                </span>
                <Switch checked={showHint} onCheckedChange={setShowHint} />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={launch}
                  disabled={flying}
                  className="flex-1 bg-[#ed7219] hover:bg-[#d86515] rounded-xl font-bold gap-2"
                >
                  <Rocket className="w-4 h-4" /> Launch!
                </Button>
                <Button onClick={resetTarget} variant="outline" className="rounded-xl gap-2">
                  <RotateCcw className="w-4 h-4" /> New Target
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#055b8e] mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              🪐 Pick a Planet
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(PLANETS).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setPlanetKey(key)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-bold border-2 transition-all ${
                    planetKey === key
                      ? 'border-[#ed7219] bg-[#ed7219]/10 text-[#055b8e]'
                      : 'border-gray-200 text-gray-600 hover:border-[#055b8e]/40'
                  }`}
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {p.emoji} {p.name}
                  <span className="block text-xs font-medium text-gray-500">g = {p.g} m/s²</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{planet.fact}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#055b8e] mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              🔬 The Science
            </h3>
            {lastShot ? (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance traveled</span>
                  <span className="font-bold text-[#055b8e]">{lastShot.distance.toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max height</span>
                  <span className="font-bold text-[#055b8e]">{lastShot.maxHeight.toFixed(1)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Flight time</span>
                  <span className="font-bold text-[#055b8e]">{lastShot.time.toFixed(2)} s</span>
                </div>
                <div className={`rounded-xl p-3 text-xs font-medium ${lastShot.hit ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                  {lastShot.hit ? 'Direct hit! 🎯' : 'Adjust and try again!'}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 space-y-3 leading-relaxed">
                <p>Launch a ball to see real physics numbers here!</p>
                <p className="bg-blue-50 text-[#055b8e] rounded-xl p-3 text-xs">
                  <strong>Did you know?</strong> A projectile flies farthest at a 45° angle
                  (when there's no air resistance). Its path is a curve called a <strong>parabola</strong>.
                </p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
              Range = v² × sin(2θ) ÷ g
            </div>
          </div>
        </div>

        {/* Challenge ideas */}
        <div className="mt-8 bg-gradient-to-br from-[#055b8e] to-[#044a73] rounded-2xl p-6 text-white">
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <Target className="w-5 h-5 text-[#ed7219]" /> Try These Challenges!
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-white/85">
            <p>1️⃣ Hit the same target twice using two <strong>different</strong> angles. (Hint: 30° and 60° travel the same distance!)</p>
            <p>2️⃣ Find the target on the Moon, then switch to Jupiter. How much more power do you need?</p>
            <p>3️⃣ Get a streak of 3 bullseyes without using the predicted path hint. Lab Legend status! 🏆</p>
          </div>
        </div>
      </div>
    </div>
  );
}
