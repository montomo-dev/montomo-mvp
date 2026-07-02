export function markSeen(game, speciesId) {
  if (!game.dex.seen.includes(speciesId)) game.dex.seen.push(speciesId);
}

export function markCaught(game, speciesId) {
  markSeen(game, speciesId);
  if (!game.dex.caught.includes(speciesId)) game.dex.caught.push(speciesId);
}
