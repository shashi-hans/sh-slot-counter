import React, {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface SlotCounterRef {
  /** Re-run the rolling animation toward the current `value`. */
  startAnimation: () => void;
  /**
   * Jump to a value with NO animation. Defaults to `startValue`, then `value`.
   * Resolves issue #59 (no way to reset the counter).
   */
  reset: (value?: string | number) => void;
}

export interface SlotCounterProps {
  /** Value to display. A number, or a string that may contain separators (e.g. "1,234.5"). */
  value: string | number;
  /** Value shown before the first animation. Defaults to a zero-filled mask of `value`. */
  startValue?: string | number;
  /** Total roll duration in seconds. Default `0.7`. */
  duration?: number;
  /** Per-character stagger in seconds; the rightmost digit starts first. Default `0.05`. */
  delay?: number;
  /** Number of full 0–9 passes before landing. Higher = longer spin. Default `1`. */
  spins?: number;
  /** Roll direction. Default `'bottom-up'`. */
  direction?: 'bottom-up' | 'top-down';
  /** Animate on mount. Default `true`. */
  animateOnMount?: boolean;
  /**
   * Honor the user's `prefers-reduced-motion` setting by skipping the roll.
   * Default `false` (always animate). Set `true` to skip the roll for users who
   * prefer reduced motion (recommended for accessibility).
   */
  respectReducedMotion?: boolean;
  /** CSS transition easing for the roll. Default `'cubic-bezier(0.16, 1, 0.3, 1)'`. */
  easing?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Accessible label. Defaults to the current value as text. */
  'aria-label'?: string;
}

const isDigit = (c: string) => c >= '0' && c <= '9';
const maskZeros = (s: string) => s.replace(/\d/g, '0');

/** Build the digit sequence from `from` to `to`, with `spins` full 0–9 passes. */
function buildSeq(from: number, to: number, spins: number): number[] {
  const steps = spins * 10 + ((to - from + 10) % 10);
  const seq: number[] = [];
  for (let i = 0; i <= steps; i += 1) seq.push((from + i) % 10);
  return seq; // seq[0] === from, seq[last] === to
}

interface ReelProps {
  seq: number[];
  cellH: number;
  duration: number;
  delay: number;
  easing: string;
  direction: 'bottom-up' | 'top-down';
  animate: boolean;
  animateKey: number;
}

/** A single digit column. One-shot transition — never loops (fixes #63). */
function Reel({ seq, cellH, duration, delay, easing, direction, animate, animateKey }: ReelProps) {
  const colRef = useRef<HTMLDivElement>(null);
  const len = seq.length;
  const topDown = direction === 'top-down';
  const order = topDown ? [...seq].reverse() : seq; // both land showing `to`
  const startOffset = topDown ? -(len - 1) * cellH : 0;
  const endOffset = topDown ? 0 : -(len - 1) * cellH;

  // Transform is driven imperatively (never via React style) so React re-renders
  // cannot clobber a roll in progress. This is a fresh mount per animateKey.
  useLayoutEffect(() => {
    const col = colRef.current;
    if (!col) return;
    if (!animate) {
      col.style.transition = 'none';
      col.style.transform = `translateY(${endOffset}px)`;
      return;
    }
    // 1) Snap to the PREVIOUS digit with no transition.
    col.style.transition = 'none';
    col.style.transform = `translateY(${startOffset}px)`;
    // 2) Force layout so this start frame is committed before the transition is armed.
    void col.getBoundingClientRect();
    // 3) Arm the transition and roll once to the target — synchronously, same pass.
    col.style.transition = `transform ${duration}s ${easing} ${delay}s`;
    col.style.transform = `translateY(${endOffset}px)`;
  }, [animateKey, cellH, animate, startOffset, endOffset, duration, delay, easing]);

  return (
    <span
      style={{
        display: 'inline-block',
        height: cellH,
        overflow: 'hidden',
        verticalAlign: 'top',
      }}
    >
      {/* Transform is set imperatively in the layout effect (before paint), so React
          never owns it and cannot reset a roll on an unrelated re-render. */}
      <div ref={colRef} style={{ willChange: 'transform' }}>
        {order.map((d, i) => (
          <div key={i} style={{ height: cellH, lineHeight: `${cellH}px`, textAlign: 'center' }}>
            {d}
          </div>
        ))}
      </div>
    </span>
  );
}

const SlotCounter = forwardRef<SlotCounterRef, SlotCounterProps>(function SlotCounter(
  {
    value,
    startValue,
    duration = 0.7,
    delay = 0.05,
    spins = 1,
    direction = 'bottom-up',
    animateOnMount = true,
    respectReducedMotion = false,
    easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
    className,
    style,
    'aria-label': ariaLabel,
  },
  ref
) {
  const valueStr = useMemo(() => String(value), [value]);

  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [cellH, setCellH] = useState(0);
  // The whole roll is captured atomically: `from` and `to` are committed together
  // in one state update, so no effect-ordering can corrupt `from` into the new value.
  const [roll, setRoll] = useState<{
    from: string;
    to: string;
    key: number;
    animate: boolean;
  }>(() => ({
    from: String(startValue ?? maskZeros(valueStr)),
    to: valueStr,
    key: animateOnMount ? 1 : 0,
    animate: animateOnMount,
  }));
  const mountedRef = useRef(false);

  const prefersReducedMotion =
    respectReducedMotion &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Measure one line box; robust to font loading / layout shifts.
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => setCellH(el.getBoundingClientRect().height);
    measure();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => ro?.disconnect();
  }, []);

  // Roll from the previous target to the new value whenever `value` changes.
  // (Mount is handled by the initial state above.)
  useLayoutEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setRoll((prev) => ({ from: prev.to, to: valueStr, key: prev.key + 1, animate: true }));
  }, [valueStr]);

  useImperativeHandle(
    ref,
    () => ({
      startAnimation: () =>
        setRoll((prev) => ({ from: prev.to, to: valueStr, key: prev.key + 1, animate: true })),
      reset: (v) => {
        const next = String(v ?? startValue ?? maskZeros(valueStr));
        setRoll((prev) => ({ from: next, to: next, key: prev.key + 1, animate: false }));
      },
    }),
    [startValue, valueStr]
  );

  const target = roll.to;
  const fromStr = roll.from;
  const animate = roll.animate && !prefersReducedMotion && cellH > 0;
  const showStatic = prefersReducedMotion || cellH === 0;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    whiteSpace: 'pre',
    fontVariantNumeric: 'tabular-nums',
    ...style,
  };

  return (
    <span
      ref={wrapperRef}
      className={className}
      style={wrapperStyle}
      role="img"
      aria-label={ariaLabel ?? target}
    >
      {/* Sizer: real text in normal flow — anchors width AND baseline (fixes #86). */}
      <span aria-hidden="true" style={{ visibility: showStatic ? 'visible' : 'hidden' }}>
        {target}
      </span>

      {/* Overlay: animated reels, absolutely positioned so layout never shifts. */}
      {!showStatic && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-start',
            whiteSpace: 'pre',
            pointerEvents: 'none',
          }}
        >
          {target.split('').map((c, i) => {
            if (!isDigit(c)) {
              return (
                <span key={i} style={{ height: cellH, lineHeight: `${cellH}px` }}>
                  {c}
                </span>
              );
            }
            const r = target.length - 1 - i; // distance from the right
            const fromChar = fromStr[fromStr.length - 1 - r];
            const fromDigit = fromChar && isDigit(fromChar) ? Number(fromChar) : 0;
            const seq = buildSeq(fromDigit, Number(c), spins);
            return (
              <Reel
                key={`${i}-${roll.key}`}
                seq={seq}
                cellH={cellH}
                duration={duration}
                delay={r * delay}
                easing={easing}
                direction={direction}
                animate={animate}
                animateKey={roll.key}
              />
            );
          })}
        </span>
      )}
    </span>
  );
});

export default SlotCounter;
