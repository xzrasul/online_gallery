// Paints the vortex off the main thread into the canvas handed over by
// createSwirlPainter (see swirl.ts).
import { renderSwirl, type RenderOptions } from '@/src/lib/sanat/swirl';

type Message = { type: 'init'; canvas: OffscreenCanvas } | { type: 'paint'; options: RenderOptions };

let canvas: OffscreenCanvas | null = null;
let cancel = () => {};

self.onmessage = (e: MessageEvent<Message>) => {
  const msg = e.data;
  if (msg.type === 'init') canvas = msg.canvas;
  else if (canvas) {
    cancel();
    cancel = renderSwirl(canvas, msg.options);
  }
};
