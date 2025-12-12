/**
 * Dot Matrix Logic
 * Simulates a grid of dots that change state based on logical rules.
 * Visual Style: Black ink on white paper.
 */

class DotMatrix {
  constructor(size = 7) {
    this.size = size;
    this.grid = Array(size)
      .fill(0)
      .map(() => Array(size).fill(false));
  }

  randomize(density = 0.2) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x] = Math.random() < density;
      }
    }
  }

  clone() {
    const copy = new DotMatrix(this.size);
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        copy.grid[y][x] = this.grid[y][x];
      }
    }
    return copy;
  }

  clear() {
    this.grid = this.grid.map((row) => row.fill(false));
  }

  // --- Transformations ---

  shift(dx, dy) {
    const newGrid = Array(this.size)
      .fill(0)
      .map(() => Array(this.size).fill(false));
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x]) {
          let nx = (x + dx) % this.size;
          let ny = (y + dy) % this.size;
          if (nx < 0) nx += this.size;
          if (ny < 0) ny += this.size;
          newGrid[ny][nx] = true;
        }
      }
    }
    this.grid = newGrid;
  }

  rotate() {
    const newGrid = Array(this.size)
      .fill(0)
      .map(() => Array(this.size).fill(false));
    const cx = (this.size - 1) / 2;
    const cy = (this.size - 1) / 2;

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x]) {
          const rx = x - cx;
          const ry = y - cy;
          // Rotate 90 deg clockwise: (x, y) -> (-y, x)
          const nx = -ry + cx;
          const ny = rx + cy;

          if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
            newGrid[Math.round(ny)][Math.round(nx)] = true;
          }
        }
      }
    }
    this.grid = newGrid;
  }

  xor(other) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (other.grid[y][x]) {
          this.grid[y][x] = !this.grid[y][x];
        }
      }
    }
  }

  equals(other) {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x] !== other.grid[y][x]) return false;
      }
    }
    return true;
  }

  mutate() {
    const mutations = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < mutations; i++) {
      const rx = Math.floor(Math.random() * this.size);
      const ry = Math.floor(Math.random() * this.size);
      this.grid[ry][rx] = !this.grid[ry][rx];
    }
  }
}

class DotPuzzle {
  constructor(size = 7) {
    this.size = size;
    this.frames = [];
    this.options = [];
    this.correctIndex = -1;
    this.selectedIndex = -1;
    this.solved = false;

    this.generate();
  }

  generate() {
    const rules = ["move_simple", "move_dual", "rotate", "xor_accumulate"];
    const rule = rules[Math.floor(Math.random() * rules.length)];

    this.frames = [];

    if (rule === "move_simple") {
      let m = new DotMatrix(this.size);
      m.randomize(0.15);
      let dx = 0,
        dy = 0;
      while (dx === 0 && dy === 0) {
        dx = Math.floor(Math.random() * 3) - 1;
        dy = Math.floor(Math.random() * 3) - 1;
      }
      for (let i = 0; i < 4; i++) {
        this.frames.push(m.clone());
        m.shift(dx, dy);
      }
    } else if (rule === "move_dual") {
      let m1 = new DotMatrix(this.size);
      m1.randomize(0.1);
      let m2 = new DotMatrix(this.size);
      m2.randomize(0.1);
      let dx1 = 1,
        dy1 = 0;
      let dx2 = 0,
        dy2 = 1;
      if (Math.random() > 0.5) {
        dx1 = 0;
        dy1 = 1;
        dx2 = -1;
        dy2 = 0;
      }

      for (let i = 0; i < 4; i++) {
        let frame = m1.clone();
        for (let y = 0; y < this.size; y++) {
          for (let x = 0; x < this.size; x++) {
            if (m2.grid[y][x]) frame.grid[y][x] = true;
          }
        }
        this.frames.push(frame);
        m1.shift(dx1, dy1);
        m2.shift(dx2, dy2);
      }
    } else if (rule === "rotate") {
      let m = new DotMatrix(this.size);
      m.randomize(0.15);
      for (let i = 0; i < 4; i++) {
        this.frames.push(m.clone());
        m.rotate();
      }
    } else if (rule === "xor_accumulate") {
      let staticMap = new DotMatrix(this.size);
      staticMap.randomize(0.2);
      let mask = new DotMatrix(this.size);
      for (let k = 0; k < this.size; k++) mask.grid[k][0] = true;

      for (let i = 0; i < 4; i++) {
        let frame = staticMap.clone();
        frame.xor(mask);
        this.frames.push(frame);
        mask.shift(1, 0);
      }
    }

    const correct = this.frames.pop();

    this.options = [];
    this.correctIndex = Math.floor(Math.random() * 4);

    for (let i = 0; i < 4; i++) {
      if (i === this.correctIndex) {
        this.options.push(correct);
      } else {
        let wrong = correct.clone();
        let attempts = 0;
        do {
          wrong.mutate();
          attempts++;
        } while (wrong.equals(correct) && attempts < 10);
        this.options.push(wrong);
      }
    }
  }

  handleClick(x, y, width, height) {
    if (this.solved) return;

    const margin = 10;
    const topH = height * 0.45;
    const optY = topH + 30;

    if (y > optY) {
      const optH = (height - optY - margin) / 2;
      const optW = (width - margin * 3) / 2;

      const col = x > width / 2 ? 1 : 0;
      const row = y - optY > optH ? 1 : 0;

      const idx = row * 2 + col;
      this.selectedIndex = idx;
      this.solved = idx === this.correctIndex;
    }
  }

  draw(ctx, width, height, showSolution = false) {
    // 1. Clear with White
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    const margin = 10;
    const topH = height * 0.4;
    const frameSize = Math.min((width - margin * 4) / 3, topH);
    const startX = (width - (frameSize * 3 + margin * 2)) / 2;
    const startY = 30;

    // 2. Draw Sequence Frames (Black Text)
    ctx.textAlign = "center";
    ctx.fillStyle = "#000";
    ctx.font = "bold 16px sans-serif";

    for (let i = 0; i < 3; i++) {
      const fx = startX + i * (frameSize + margin);
      const fy = startY;

      ctx.fillText(`${i + 1}`, fx + frameSize / 2, fy - 8);
      this.drawMatrix(ctx, this.frames[i], fx, fy, frameSize);

      // Arrow
      if (i < 2) {
        ctx.fillStyle = "#666";
        ctx.fillText(">", fx + frameSize + margin / 2, fy + frameSize / 2);
        ctx.fillStyle = "#000";
      }
    }

    // Question Mark
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("?", width / 2, startY + frameSize + 35);

    // 3. Draw Options
    const optY = startY + frameSize + 50;
    const optW = (width - margin * 3) / 2;
    const optH = (height - optY - margin) / 2;
    const optSize = Math.min(optW, optH) * 0.85;

    for (let i = 0; i < 4; i++) {
      const r = Math.floor(i / 2);
      const c = i % 2;

      const ox = margin + c * (optW + margin);
      const oy = optY + r * optH;

      // Selection Box logic (Subtle highlights)
      if (
        i === this.selectedIndex ||
        (showSolution && i === this.correctIndex)
      ) {
        // Correct = Light Green, Wrong = Light Red
        ctx.fillStyle =
          i === this.correctIndex
            ? "rgba(0, 255, 0, 0.1)"
            : "rgba(255, 0, 0, 0.1)";
        ctx.fillRect(ox, oy, optW, optH);

        if (i === this.correctIndex && showSolution) {
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 3;
          ctx.strokeRect(ox, oy, optW, optH);
        }
      }

      const gx = ox + (optW - optSize) / 2;
      const gy = oy + (optH - optSize) / 2;

      this.drawMatrix(ctx, this.options[i], gx, gy, optSize);

      // Label A, B, C, D
      ctx.fillStyle = "#666";
      ctx.font = "14px sans-serif";
      ctx.fillText(String.fromCharCode(65 + i), ox + 15, oy + 20);
    }

    if (this.solved) {
      ctx.fillStyle = "#000";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("PATTERN MATCHED", width / 2, height - 15);
    }
  }

  drawMatrix(ctx, matrix, x, y, size) {
    const pad = size * 0.05;
    const innerSize = size - pad * 2;
    const dotSpace = innerSize / matrix.size;
    const dotRadius = dotSpace * 0.35;

    // No background fill (transparent/white) to look like paper
    // Or maybe a very faint grey border to delimit the area?
    // Let's use no border for the matrix itself, just the dots.

    for (let r = 0; r < matrix.size; r++) {
      for (let c = 0; c < matrix.size; c++) {
        const cx = x + pad + c * dotSpace + dotSpace / 2;
        const cy = y + pad + r * dotSpace + dotSpace / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);

        if (matrix.grid[r][c]) {
          // ON = Black filled
          ctx.fillStyle = "#000";
          ctx.fill();
        } else {
          // OFF = Black outline
          ctx.strokeStyle = "#333"; // Dark grey/black outline
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }
}
