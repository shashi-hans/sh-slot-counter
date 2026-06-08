import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import SlotCounter, { type SlotCounterRef } from 'slot-counter';

function App() {
  const [value, setValue] = useState<number>(123456);
  const [direction, setDirection] = useState<'bottom-up' | 'top-down'>('bottom-up');
  const ref = useRef<SlotCounterRef>(null);

  return (
    <div className="wrap">
      <h1>slot-counter</h1>
      <p className="muted">Lightweight, dependency-free slot-machine counter with the alignment / infinite-spin / reset issues fixed.</p>

      <div className="card">
        <div className="big">
          <SlotCounter ref={ref} value={value} direction={direction} duration={1} spins={2} respectReducedMotion={false} />
        </div>
        <div className="row">
          <button onClick={() => setValue((v) => v + 1)}>+1</button>
          <button onClick={() => setValue((v) => v + 137)}>+137</button>
          <button onClick={() => setValue((v) => v * 2)}>×2</button>
          <button onClick={() => setValue(Math.floor(Number(String(value).split('').reverse().join('')) || 0) + 9999)}>random-ish</button>
          <button onClick={() => ref.current?.startAnimation()}>replay</button>
          <button onClick={() => ref.current?.reset()}>reset</button>
          <label>
            <input type="checkbox" checked={direction === 'top-down'} onChange={(e) => setDirection(e.target.checked ? 'top-down' : 'bottom-up')} /> top-down
          </label>
        </div>
      </div>

      <div className="card">
        <p className="muted">Baseline check (#86): the counter must sit on the same text baseline as the words around it.</p>
        <p className="baseline">
          You have <SlotCounter value={value} /> points in your wallet.
        </p>
      </div>

      <div className="card">
        <p className="muted">Formatted string + separators:</p>
        <div className="baseline">
          <SlotCounter value={value.toLocaleString('en-US')} />
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
