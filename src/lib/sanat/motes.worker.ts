// Runs the drifting lights off the main thread (see motes.ts).
import { createMotesEngine, type MotesEngine, type MotesMessage } from '@/src/lib/sanat/motes';

let engine: MotesEngine | null = null;

self.onmessage = (e: MessageEvent<MotesMessage>) => {
  const msg = e.data;
  if (msg.type === 'init') engine = createMotesEngine(msg.canvas);
  else if (msg.type === 'update') engine?.update(...msg.args);
  else engine?.setRunning(msg.running);
};
