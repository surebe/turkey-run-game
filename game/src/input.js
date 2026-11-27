// Keyboard, mouse and touch input with edge detection: `held` answers "is it
// down right now", `pressed` answers "did it go down since the last frame"
// and is cleared by the game loop at the end of every frame.

const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'];
const DUCK_KEYS = ['ArrowDown', 'KeyS'];
const GAME_KEYS = new Set([...JUMP_KEYS, ...DUCK_KEYS, 'Enter', 'Space']);

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.edges = new Set();
    this.pointerEdge = false;
    this.pointerHeld = false;

    window.addEventListener('keydown', (event) => {
      if (GAME_KEYS.has(event.code)) event.preventDefault();
      if (!event.repeat) {
        this.down.add(event.code);
        this.edges.add(event.code);
      }
    });
    window.addEventListener('keyup', (event) => {
      this.down.delete(event.code);
    });
    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.pointerHeld = true;
      this.pointerEdge = true;
    });
    window.addEventListener('pointerup', () => {
      this.pointerHeld = false;
    });
    window.addEventListener('blur', () => {
      this.down.clear();
    });
  }

  jumpHeld() {
    return JUMP_KEYS.some((k) => this.down.has(k)) || this.pointerHeld;
  }

  jumpPressed() {
    return JUMP_KEYS.some((k) => this.edges.has(k)) || this.pointerEdge;
  }

  duckHeld() {
    return DUCK_KEYS.some((k) => this.down.has(k));
  }

  confirmPressed() {
    return this.edges.has('Enter') || this.edges.has('Space') || this.pointerEdge;
  }

  mutePressed() {
    return this.edges.has('KeyM');
  }

  endFrame() {
    this.edges.clear();
    this.pointerEdge = false;
  }
}
