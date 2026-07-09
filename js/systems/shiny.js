export const SHINY_HUE = 200;
export const SHINY_RATE = 0.01;

export function rollShiny() {
  return Math.random() < SHINY_RATE;
}
