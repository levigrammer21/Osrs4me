import { advance } from "./engine";
import { Save } from "./model";
self.onmessage = (event: MessageEvent<{ save: Save; target: number }>) => {
  try {
    const s = event.data.save;
    advance(s, event.data.target, true);
    self.postMessage({ save: s });
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};
