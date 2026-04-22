import Matter from 'matter-js';

export interface TileSpec {
  el: HTMLElement;
  x: number;
  y: number;
  w: number;
  h: number;
  vx?: number;
  vy?: number;
  angle?: number;
  angularVelocity?: number;
}

/**
 * Collapse a pre-positioned cluster of DOM tiles using Matter.js.
 * Call AFTER tiles have been moved to `position: absolute` with `left:0; top:0;`.
 * Returns a dispose callback.
 */
export function collapse(container: HTMLElement, tiles: TileSpec[]) {
  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const engine = Matter.Engine.create();
  engine.gravity.y = 1.2;
  const world = engine.world;

  const floor = Matter.Bodies.rectangle(width / 2, height + 25, width * 3, 50, { isStatic: true });
  const leftW = Matter.Bodies.rectangle(-30, height / 2, 40, height * 3, { isStatic: true });
  const rightW = Matter.Bodies.rectangle(width + 30, height / 2, 40, height * 3, { isStatic: true });
  Matter.World.add(world, [floor, leftW, rightW]);

  const bodies = tiles.map((t) => {
    const body = Matter.Bodies.rectangle(t.x, t.y, t.w, t.h, {
      restitution: 0.28,
      friction: 0.5,
      frictionAir: 0.005,
      density: 0.0018,
      angle: t.angle ?? 0
    });
    if (t.vx || t.vy) Matter.Body.setVelocity(body, { x: t.vx ?? 0, y: t.vy ?? 0 });
    if (t.angularVelocity) Matter.Body.setAngularVelocity(body, t.angularVelocity);
    Matter.World.add(world, body);
    return { body, el: t.el, w: t.w, h: t.h };
  });

  let raf = 0;
  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(now - last, 33);
    last = now;
    Matter.Engine.update(engine, dt);
    for (const { body, el, w, h } of bodies) {
      el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  const stopTimer = window.setTimeout(() => cancelAnimationFrame(raf), 8000);
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(stopTimer);
  };
}

export interface ChainCollapseOptions {
  /** Horizontal offset (from tile center) where the two rope rails attach. */
  railOffset?: number;
  /** Initial horizontal velocity applied to the topmost tile (simulates swing). */
  topImpulseX?: number;
  /** Additional angular velocity applied to the top tile. */
  topAngularImpulse?: number;
  /** Duration in ms before the simulation auto-stops. */
  duration?: number;
}

/**
 * Collapse a vertical chain of tiles with real rope-chain physics.
 * Adjacent tiles are joined by two parallel distance constraints (a ladder),
 * so the whole structure falls as a flexible connected chain rather than
 * exploding into independent projectiles.
 */
export function collapseChain(
  container: HTMLElement,
  tiles: TileSpec[],
  options: ChainCollapseOptions = {}
) {
  const {
    railOffset = 18,
    topImpulseX = 0,
    topAngularImpulse = 0,
    duration = 9000
  } = options;

  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const engine = Matter.Engine.create();
  engine.gravity.y = 1.1;
  const world = engine.world;

  const floor = Matter.Bodies.rectangle(width / 2, height + 25, width * 3, 50, { isStatic: true });
  const leftW = Matter.Bodies.rectangle(-30, height / 2, 40, height * 3, { isStatic: true });
  const rightW = Matter.Bodies.rectangle(width + 30, height / 2, 40, height * 3, { isStatic: true });
  Matter.World.add(world, [floor, leftW, rightW]);

  const bodies = tiles.map((t, i) => {
    const body = Matter.Bodies.rectangle(t.x, t.y, t.w, t.h, {
      restitution: 0.2,
      friction: 0.6,
      frictionAir: 0.012,
      // Slightly heavier tiles feel less jittery under constraints
      density: 0.003,
      angle: t.angle ?? 0,
      // Adjacent tiles shouldn't collide with each other (ropes handle spacing)
      collisionFilter: { group: -1 }
    });
    if (t.vx || t.vy) Matter.Body.setVelocity(body, { x: t.vx ?? 0, y: t.vy ?? 0 });
    if (t.angularVelocity) Matter.Body.setAngularVelocity(body, t.angularVelocity);
    Matter.World.add(world, body);
    if (i === 0) {
      if (topImpulseX) {
        Matter.Body.setVelocity(body, {
          x: (t.vx ?? 0) + topImpulseX,
          y: t.vy ?? 0
        });
      }
      if (topAngularImpulse) {
        Matter.Body.setAngularVelocity(body, (t.angularVelocity ?? 0) + topAngularImpulse);
      }
    }
    return { body, el: t.el, w: t.w, h: t.h };
  });

  // Connect each adjacent pair with two rope-like constraints (left rail + right rail)
  for (let i = 0; i < bodies.length - 1; i++) {
    const top = bodies[i];
    const bot = bodies[i + 1];
    const restLen = Math.max(
      2,
      (tiles[i + 1].y - tiles[i].y) - (top.h / 2 + bot.h / 2)
    );
    const stiffness = 0.85;
    const damping = 0.12;
    const leftRope = Matter.Constraint.create({
      bodyA: top.body,
      pointA: { x: -railOffset, y: top.h / 2 },
      bodyB: bot.body,
      pointB: { x: -railOffset, y: -bot.h / 2 },
      length: restLen,
      stiffness,
      damping
    });
    const rightRope = Matter.Constraint.create({
      bodyA: top.body,
      pointA: { x: railOffset, y: top.h / 2 },
      bodyB: bot.body,
      pointB: { x: railOffset, y: -bot.h / 2 },
      length: restLen,
      stiffness,
      damping
    });
    Matter.World.add(world, [leftRope, rightRope]);
  }

  let raf = 0;
  let last = performance.now();
  const step = (now: number) => {
    const dt = Math.min(now - last, 33);
    last = now;
    Matter.Engine.update(engine, dt);
    for (const { body, el, w, h } of bodies) {
      el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
    }
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  const stopTimer = window.setTimeout(() => cancelAnimationFrame(raf), duration);
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(stopTimer);
  };
}

// ---------------------------------------------------------------------------
// Live hanging-chain simulation (gravity + world-anchored rope constraints).
//
// Unlike `collapseChain` (which only runs after the ropes snap), `suspendChain`
// runs a persistent Matter engine during gameplay so each tile actually hangs
// under the two cliff pegs. The top tile is pinned to the two anchor pegs via
// `Constraint` with no `bodyA` (matter-js treats `pointA` as a world-space
// fixed point in that case — see matter-js Constraint docs). Adjacent tiles
// are linked with two parallel rung constraints so the chain falls like a
// flexible rope ladder.
// ---------------------------------------------------------------------------

export interface SuspendAnchor {
  x: number;
  y: number;
}

export interface SuspendChainOptions {
  /** World-space coordinates of the two cliff pegs. */
  anchors: { left: SuspendAnchor; right: SuspendAnchor };
  /** Engine gravity scale (1 ≈ earth). Default 1. */
  gravity?: number;
  /** Horizontal offset of the ladder rails from tile center. Default 18. */
  railOffset?: number;
  /** Anchor-rope stiffness (0..1). Default 0.55 (springy thread). */
  anchorStiffness?: number;
  /** Anchor-rope damping. Default 0.18. */
  anchorDamping?: number;
  /** Rung stiffness between adjacent tiles. Default 0.9 (stiff rung). */
  rungStiffness?: number;
  /** Rung damping. Default 0.15. */
  rungDamping?: number;
  /** Matter.js frictionAir on tile bodies (kills oscillation). Default 0.05. */
  frictionAir?: number;
  /** Tile density. Default 0.003. */
  density?: number;
  /** Called every frame after physics step. */
  onFrame?: (sim: SuspendChainSim) => void;
  /** Substeps per frame for stability with many constraints. Default 2. */
  subSteps?: number;
  /** If set, a static floor is added at this y-coordinate (e.g. the rescue ledge). */
  floorY?: number;
}

export interface SuspendedTile {
  body: Matter.Body;
  el: HTMLElement;
  w: number;
  h: number;
  /** Ladder rung constraints linking this tile to its predecessor, if any. */
  rungs: [Matter.Constraint, Matter.Constraint] | null;
}

export interface SuspendChainSim {
  readonly anchors: { left: SuspendAnchor; right: SuspendAnchor };
  readonly tiles: readonly SuspendedTile[];
  /** Add a new tile to the bottom of the chain. */
  addTile(spec: TileSpec): SuspendedTile;
  /** Remove the last tile (and its rung constraints). No-op if only the top tile remains. */
  removeLastTile(): void;
  /** Break the rope attaching the top tile to one anchor peg. */
  breakAnchor(side: 'left' | 'right'): void;
  /** Break both anchor ropes (if any remain), releasing the chain. */
  cutAllAnchors(opts?: { topImpulseX?: number; topAngularImpulse?: number }): void;
  /** World-space position of the top-tile end of the left/right anchor rope, or null if broken. */
  getAnchorAttachWorld(side: 'left' | 'right'): { x: number; y: number } | null;
  /** World-space position of a rung endpoint on a tile (side = which rail). */
  getTileRailWorld(index: number, side: 'left' | 'right', edge: 'top' | 'bottom'): { x: number; y: number } | null;
  /** Is the anchor rope still attached? */
  isAnchorAttached(side: 'left' | 'right'): boolean;
  /** Remove everything and stop the RAF loop. */
  dispose(): void;
}

function rotatedOffset(body: Matter.Body, offX: number, offY: number) {
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  return {
    x: body.position.x + offX * cos - offY * sin,
    y: body.position.y + offX * sin + offY * cos
  };
}

export function suspendChain(
  container: HTMLElement,
  options: SuspendChainOptions
): SuspendChainSim {
  const {
    anchors,
    gravity = 1,
    railOffset = 18,
    anchorStiffness = 0.55,
    anchorDamping = 0.18,
    rungStiffness = 0.9,
    rungDamping = 0.15,
    frictionAir = 0.05,
    density = 0.003,
    onFrame,
    subSteps = 2,
    floorY
  } = options;

  const rect = container.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const engine = Matter.Engine.create();
  engine.gravity.y = gravity;
  engine.constraintIterations = 4;
  const world = engine.world;

  // Side walls keep the swinging chain inside the board; no floor so tiles
  // can rest freely. (Callers can add their own ground if wanted.)
  const leftW = Matter.Bodies.rectangle(-30, height / 2, 40, height * 3, { isStatic: true });
  const rightW = Matter.Bodies.rectangle(width + 30, height / 2, 40, height * 3, { isStatic: true });
  Matter.World.add(world, [leftW, rightW]);
  if (floorY !== undefined) {
    const floor = Matter.Bodies.rectangle(width / 2, floorY + 25, width * 3, 50, { isStatic: true });
    Matter.World.add(world, floor);
  }

  const tiles: SuspendedTile[] = [];
  let leftAnchor: Matter.Constraint | null = null;
  let rightAnchor: Matter.Constraint | null = null;

  function addTile(t: TileSpec): SuspendedTile {
    const body = Matter.Bodies.rectangle(t.x, t.y, t.w, t.h, {
      restitution: 0.12,
      friction: 0.6,
      frictionAir,
      density,
      angle: t.angle ?? 0,
      // Tiles within the chain shouldn't collide with each other.
      collisionFilter: { group: -1 }
    });
    if (t.vx || t.vy) Matter.Body.setVelocity(body, { x: t.vx ?? 0, y: t.vy ?? 0 });
    if (t.angularVelocity) Matter.Body.setAngularVelocity(body, t.angularVelocity);
    Matter.World.add(world, body);

    const tile: SuspendedTile = { body, el: t.el, w: t.w, h: t.h, rungs: null };
    const index = tiles.length;
    tiles.push(tile);

    if (index === 0) {
      // Pin top tile to both cliff pegs via two rope constraints whose
      // pointA is a world-space anchor (bodyA undefined).
      const leftAttach = { x: -railOffset, y: -t.h / 2 };
      const rightAttach = { x: railOffset, y: -t.h / 2 };
      const leftLen = Math.hypot(
        anchors.left.x - (t.x + leftAttach.x),
        anchors.left.y - (t.y + leftAttach.y)
      );
      const rightLen = Math.hypot(
        anchors.right.x - (t.x + rightAttach.x),
        anchors.right.y - (t.y + rightAttach.y)
      );
      leftAnchor = Matter.Constraint.create({
        pointA: { x: anchors.left.x, y: anchors.left.y },
        bodyB: body,
        pointB: leftAttach,
        length: leftLen,
        stiffness: anchorStiffness,
        damping: anchorDamping
      });
      rightAnchor = Matter.Constraint.create({
        pointA: { x: anchors.right.x, y: anchors.right.y },
        bodyB: body,
        pointB: rightAttach,
        length: rightLen,
        stiffness: anchorStiffness,
        damping: anchorDamping
      });
      Matter.World.add(world, [leftAnchor, rightAnchor]);
    } else {
      // Ladder rung to previous tile.
      const prev = tiles[index - 1];
      const restLen = Math.max(2, t.y - (prev.body.position.y) - (prev.h / 2 + t.h / 2));
      const leftRung = Matter.Constraint.create({
        bodyA: prev.body,
        pointA: { x: -railOffset, y: prev.h / 2 },
        bodyB: body,
        pointB: { x: -railOffset, y: -t.h / 2 },
        length: restLen,
        stiffness: rungStiffness,
        damping: rungDamping
      });
      const rightRung = Matter.Constraint.create({
        bodyA: prev.body,
        pointA: { x: railOffset, y: prev.h / 2 },
        bodyB: body,
        pointB: { x: railOffset, y: -t.h / 2 },
        length: restLen,
        stiffness: rungStiffness,
        damping: rungDamping
      });
      Matter.World.add(world, [leftRung, rightRung]);
      tile.rungs = [leftRung, rightRung];
    }

    return tile;
  }

  function removeLastTile() {
    if (tiles.length <= 1) return;
    const last = tiles.pop();
    if (!last) return;
    if (last.rungs) {
      Matter.World.remove(world, last.rungs[0]);
      Matter.World.remove(world, last.rungs[1]);
    }
    Matter.World.remove(world, last.body);
  }

  function breakAnchor(side: 'left' | 'right') {
    const c = side === 'left' ? leftAnchor : rightAnchor;
    if (!c) return;
    Matter.World.remove(world, c);
    if (side === 'left') leftAnchor = null;
    else rightAnchor = null;
  }

  function cutAllAnchors(opts?: { topImpulseX?: number; topAngularImpulse?: number }) {
    if (leftAnchor) {
      Matter.World.remove(world, leftAnchor);
      leftAnchor = null;
    }
    if (rightAnchor) {
      Matter.World.remove(world, rightAnchor);
      rightAnchor = null;
    }
    const top = tiles[0];
    if (top) {
      if (opts?.topImpulseX) {
        Matter.Body.setVelocity(top.body, {
          x: top.body.velocity.x + opts.topImpulseX,
          y: top.body.velocity.y
        });
      }
      if (opts?.topAngularImpulse) {
        Matter.Body.setAngularVelocity(top.body, top.body.angularVelocity + opts.topAngularImpulse);
      }
    }
  }

  function getAnchorAttachWorld(side: 'left' | 'right') {
    const top = tiles[0];
    if (!top) return null;
    if (side === 'left' && !leftAnchor) return null;
    if (side === 'right' && !rightAnchor) return null;
    const off = side === 'left' ? -railOffset : railOffset;
    return rotatedOffset(top.body, off, -top.h / 2);
  }

  function getTileRailWorld(index: number, side: 'left' | 'right', edge: 'top' | 'bottom') {
    const t = tiles[index];
    if (!t) return null;
    const off = side === 'left' ? -railOffset : railOffset;
    const oy = edge === 'top' ? -t.h / 2 : t.h / 2;
    return rotatedOffset(t.body, off, oy);
  }

  function isAnchorAttached(side: 'left' | 'right') {
    return side === 'left' ? leftAnchor !== null : rightAnchor !== null;
  }

  let raf = 0;
  let last = performance.now();
  const sim: SuspendChainSim = {
    anchors,
    get tiles() {
      return tiles;
    },
    addTile,
    removeLastTile,
    breakAnchor,
    cutAllAnchors,
    getAnchorAttachWorld,
    getTileRailWorld,
    isAnchorAttached,
    dispose() {
      cancelAnimationFrame(raf);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    }
  };

  const step = (now: number) => {
    const dt = Math.min(now - last, 33);
    last = now;
    const sub = Math.max(1, subSteps | 0);
    const stepDt = dt / sub;
    for (let i = 0; i < sub; i++) Matter.Engine.update(engine, stepDt);
    for (const { body, el, w, h } of tiles) {
      el.style.transform = `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
    }
    onFrame?.(sim);
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);

  return sim;
}
