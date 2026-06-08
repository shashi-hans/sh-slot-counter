# slot-counter

A lightweight, **zero-dependency** slot-machine number counter for React. Same look and feel as
`react-slot-counter`, but with its three most-reported issues fixed:

| Known react-slot-counter issue | How this package fixes it |
| --- | --- |
| **Baseline / layout misalignment** ([#86]) — counter sits too high or low when mounted inside a layout animation | The real value text stays in normal document flow as an invisible **sizer** that anchors width *and* baseline. The animated reels are absolutely overlaid on top, so surrounding layout never shifts. `tabular-nums` keeps every digit the same width. |
| **Infinite spinning** ([#63]) — the reel never settles | Each digit runs a **deterministic one-shot CSS transition** to a precomputed landing offset. Re-triggers cancel cleanly via `requestAnimationFrame`. It cannot loop forever. |
| **No way to reset** ([#59]) | First-class **`reset()`** ref method — jump to any value (or back to `startValue`) with no animation. |

Extras: no CSS import required (all styles inline) and an automatic `prefers-reduced-motion` fallback.

## Install

```bash
npm install slot-counter
```

`react` and `react-dom` (>= 16.8) are peer dependencies.

## Usage

```tsx
import SlotCounter from 'slot-counter';

<SlotCounter value={123456} />
<SlotCounter value="1,234,567" />
<SlotCounter value={42.5} duration={1} spins={2} direction="top-down" />
```

### Imperative control

```tsx
import { useRef } from 'react';
import SlotCounter, { type SlotCounterRef } from 'slot-counter';

function Demo() {
  const ref = useRef<SlotCounterRef>(null);
  return (
    <>
      <SlotCounter ref={ref} value={1000} startValue={0} />
      <button onClick={() => ref.current?.startAnimation()}>Replay</button>
      <button onClick={() => ref.current?.reset()}>Reset</button>
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` *(required)* | `string \| number` | — | Value to display. Strings may contain separators (`"1,234.5"`). |
| `startValue` | `string \| number` | zero-mask of `value` | Value shown before the first animation. |
| `duration` | `number` | `0.7` | Total roll duration (seconds). |
| `delay` | `number` | `0.05` | Per-digit stagger; rightmost starts first. |
| `spins` | `number` | `1` | Full 0–9 passes before landing. |
| `direction` | `'bottom-up' \| 'top-down'` | `'bottom-up'` | Roll direction. |
| `animateOnMount` | `boolean` | `true` | Animate on first render. |
| `respectReducedMotion` | `boolean` | `true` | Skip the roll when the OS/browser has *reduce motion* enabled. Set `false` to always animate. |
| `easing` | `string` | `cubic-bezier(0.16, 1, 0.3, 1)` | CSS transition easing. |
| `className` / `style` | — | — | Applied to the wrapper. |
| `aria-label` | `string` | current value | Accessible label. |

### Ref methods

- `startAnimation()` — replay the roll toward the current `value`.
- `reset(value?)` — jump (no animation) to `value`, else `startValue`, else the zero-mask.

[#86]: https://github.com/almond-bongbong/react-slot-counter/issues/86
[#63]: https://github.com/almond-bongbong/react-slot-counter/issues/63
[#59]: https://github.com/almond-bongbong/react-slot-counter/issues/59
