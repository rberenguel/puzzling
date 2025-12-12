/**
 * Voxel Engine & Rotation Puzzle
 * * Generates a random 3D block structure.
 * The goal is to identify which of the options is a valid rotation of the target shape.
 */

class VoxelEngine {
  constructor() {
    this.voxels = []; // Array of {x,y,z}
  }

  // Generate a random connected shape walking from (0,0,0)
  generate(count = 8) {
    this.voxels = [{ x: 0, y: 0, z: 0 }];
    let attempts = 0;
    while (this.voxels.length < count && attempts < 100) {
      const base = this.voxels[Math.floor(Math.random() * this.voxels.length)];
      const axis = Math.floor(Math.random() * 3);
      const dir = Math.random() > 0.5 ? 1 : -1;
      const cand = { ...base };

      if (axis === 0) cand.x += dir;
      else if (axis === 1) cand.y += dir;
      else cand.z += dir;

      if (!this.has(cand)) this.voxels.push(cand);
      attempts++;
    }
    this.center();
  }

  has(v) {
    return this.voxels.some((e) => e.x === v.x && e.y === v.y && e.z === v.z);
  }

  center() {
    if (this.voxels.length === 0) return;
    const minX = Math.min(...this.voxels.map((v) => v.x));
    const maxX = Math.max(...this.voxels.map((v) => v.x));
    const minY = Math.min(...this.voxels.map((v) => v.y));
    const maxY = Math.max(...this.voxels.map((v) => v.y));
    const minZ = Math.min(...this.voxels.map((v) => v.z));
    const maxZ = Math.max(...this.voxels.map((v) => v.z));

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;

    this.voxels = this.voxels.map((v) => ({
      x: v.x - cx,
      y: v.y - cy,
      z: v.z - cz,
    }));
  }

  // Returns a new VoxelEngine instance rotated 90deg around an axis
  getRotated(axis) {
    const copy = new VoxelEngine();
    copy.voxels = this.voxels.map((v) => {
      let { x, y, z } = v;
      // 90 degree rotations
      if (axis === "x") [y, z] = [-z, y];
      if (axis === "y") [x, z] = [z, -x];
      if (axis === "z") [x, y] = [-y, x];
      return { x, y, z };
    });
    return copy;
  }

  // Returns a mutated version (impostor)
  getMutated() {
    const copy = new VoxelEngine();
    // Deep copy
    copy.voxels = this.voxels.map((v) => ({ ...v }));

    // Move one block to a new valid position
    if (copy.voxels.length > 0) {
      // Remove a random block (not the first one to keep connectivity roughly)
      const idxToRemove = Math.floor(Math.random() * copy.voxels.length);
      copy.voxels.splice(idxToRemove, 1);

      // Add a new block
      let added = false;
      let attempts = 0;
      while (!added && attempts < 50) {
        const base =
          copy.voxels[Math.floor(Math.random() * copy.voxels.length)];
        const axis = Math.floor(Math.random() * 3);
        const dir = Math.random() > 0.5 ? 1 : -1;
        const cand = { ...base };
        if (axis === 0) cand.x += dir;
        else if (axis === 1) cand.y += dir;
        else cand.z += dir;

        if (!copy.has(cand)) {
          copy.voxels.push(cand);
          added = true;
        }
        attempts++;
      }
    }
    copy.center();
    return copy;
  }

  draw(ctx, cx, cy, size) {
    // Painter's Algorithm: Sort by depth (x + y + z roughly works for standard isometric)
    const sorted = [...this.voxels].sort(
      (a, b) => a.x + a.y + a.z - (b.x + b.y + b.z),
    );

    sorted.forEach((v) => this.drawCube(ctx, cx, cy, size, v));
  }

  drawCube(ctx, cx, cy, size, { x, y, z }) {
    // Isometric projection
    const isoX = (x - y) * size * 0.866;
    const isoY = (x + y) * size * 0.5 - z * size;

    const dx = cx + isoX;
    const dy = cy + isoY;

    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";

    // Top Face
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(dx, dy - size);
    ctx.lineTo(dx + size * 0.866, dy - size * 0.5);
    ctx.lineTo(dx, dy);
    ctx.lineTo(dx - size * 0.866, dy - size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Face
    ctx.fillStyle = "#bbb"; // Medium Grey
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + size * 0.866, dy - size * 0.5);
    ctx.lineTo(dx + size * 0.866, dy + size * 0.5);
    ctx.lineTo(dx, dy + size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left Face
    ctx.fillStyle = "#666"; // Dark Grey
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx - size * 0.866, dy - size * 0.5);
    ctx.lineTo(dx - size * 0.866, dy + size * 0.5);
    ctx.lineTo(dx, dy + size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

class RotationPuzzle {
  constructor(difficulty = 6) {
    this.target = new VoxelEngine();
    this.target.generate(difficulty + 2); // difficulty determines block count

    this.options = [];
    this.correctIndex = -1;
    this.selectedIndex = -1;
    this.solved = false;

    this.generateOptions();
  }

  generateOptions() {
    this.options = [];
    this.correctIndex = Math.floor(Math.random() * 4);

    for (let i = 0; i < 4; i++) {
      if (i === this.correctIndex) {
        // Generate valid rotation
        let rot = this.target;
        // Rotate random times around random axes
        const times = 1 + Math.floor(Math.random() * 3);
        for (let r = 0; r < times; r++) {
          const axis = ["x", "y", "z"][Math.floor(Math.random() * 3)];
          rot = rot.getRotated(axis);
        }
        this.options.push(rot);
      } else {
        // Generate impostor (mutation)
        // We mutate then randomly rotate so it's not obvious by orientation
        let imp = this.target.getMutated();
        const axis = ["x", "y", "z"][Math.floor(Math.random() * 3)];
        imp = imp.getRotated(axis);
        this.options.push(imp);
      }
    }
  }

  handleClick(x, y, width, height) {
    if (this.solved) return;

    // Check if clicked in options area
    // Assume layout: Top half target, bottom half 2x2 grid of options
    const optH = height * 0.5;
    const startY = height * 0.4; // Options start a bit lower

    if (y > startY) {
      // Determine which quadrant (0,1,2,3)
      // 0 1
      // 2 3
      const row = y > startY + optH / 2 ? 1 : 0;
      const col = x > width / 2 ? 1 : 0;
      const idx = row * 2 + col;

      this.selectedIndex = idx;
      this.solved = idx === this.correctIndex;
    }
  }

  draw(ctx, width, height, showSolution = false) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    const scale = Math.min(width, height) / 16;

    // Draw Target
    ctx.save();
    ctx.translate(width / 2, height * 0.2);
    this.target.draw(ctx, 0, 0, scale * 1.2); // Draw target slightly larger
    ctx.restore();

    // Draw Options
    const startY = height * 0.4;
    const optH = height - startY;
    const optW = width / 2;

    // Draw divider lines
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.lineTo(width, startY);
    ctx.moveTo(width / 2, startY);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, startY + optH / 2);
    ctx.lineTo(width, startY + optH / 2);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2);
      const col = i % 2;

      const cx = col * optW + optW / 2;
      const cy = startY + row * (optH / 2) + optH / 4;

      // Highlight selection/solution
      if (showSolution && i === this.correctIndex) {
        ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
        ctx.fillRect(col * optW, startY + row * (optH / 2), optW, optH / 2);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(
          col * optW + 5,
          startY + row * (optH / 2) + 5,
          optW - 10,
          optH / 2 - 10,
        );
      } else if (i === this.selectedIndex) {
        ctx.fillStyle =
          i === this.correctIndex
            ? "rgba(0, 255, 0, 0.1)"
            : "rgba(255, 0, 0, 0.1)";
        ctx.fillRect(col * optW, startY + row * (optH / 2), optW, optH / 2);
      }

      ctx.save();
      ctx.translate(cx, cy);
      this.options[i].draw(ctx, 0, 0, scale);
      ctx.restore();

      // Label A, B, C, D
      ctx.fillStyle = "#000";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(
        String.fromCharCode(65 + i),
        col * optW + 20,
        startY + row * (optH / 2) + 30,
      );
    }

    // Title / Instruction
    ctx.textAlign = "center";
    ctx.fillStyle = "#000";
    ctx.font = "14px sans-serif";
    if (this.solved) {
      ctx.fillText("Correct!", width / 2, height - 10);
    } else if (this.selectedIndex !== -1) {
      ctx.fillText("Try Again", width / 2, height - 10);
    } else {
      ctx.fillText("Find the rotation", width / 2, 30);
    }
  }
}
