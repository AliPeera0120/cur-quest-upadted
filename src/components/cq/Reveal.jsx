import React, { useEffect, useRef, useState } from 'react';
import { cn } from './cn';

/**
 * Reveal-on-scroll. Opacity plus a 12px rise — enough to give the page a
 * sense of assembly, not enough to be a performance or vestibular problem.
 * Disconnects after firing once, and no-ops entirely under reduced motion.
 */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn('cq-reveal', className)}
      data-visible={visible ? 'true' : 'false'}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Counts up to a number when scrolled into view. Static under reduced motion. */
export function CountUp({ to = 0, duration = 900, suffix = '', prefix = '', className }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { setN(to); return undefined; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return;
      done.current = true;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / duration);
        setN(Math.round(to * (1 - (1 - p) ** 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return <span ref={ref} className={className}>{prefix}{n.toLocaleString()}{suffix}</span>;
}
