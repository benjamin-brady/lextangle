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
