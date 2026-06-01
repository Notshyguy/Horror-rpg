// Central registry of available puzzle mechanics.
//
// To add a new mechanic: implement PuzzleMechanic, import it here, and register
// an instance. Everything else (generator, game state, renderer, save) resolves
// mechanics by id through getMechanic(), so this file is the single swap point.

import { LightsOut } from "./LightsOut.js";

const REGISTRY = new Map();

function register(mechanic) {
  REGISTRY.set(mechanic.id, mechanic);
}

register(new LightsOut());

// The mechanic the game currently ships with. Change this one line (and the
// matching default in CLAUDE.md) to retarget the whole prototype.
export const DEFAULT_MECHANIC_ID = "lights_out";

export function getMechanic(id = DEFAULT_MECHANIC_ID) {
  const mechanic = REGISTRY.get(id);
  if (!mechanic) {
    throw new Error(`unknown mechanic: ${id}`);
  }
  return mechanic;
}

export function listMechanics() {
  return [...REGISTRY.values()];
}
