export const MAX_PARTY = 4;

export function addToParty(party, monster) {
  if (party.length >= MAX_PARTY) return false;
  party.push(monster);
  return true;
}

export function moveToFront(party, index) {
  if (index <= 0 || index >= party.length) return;
  const [monster] = party.splice(index, 1);
  party.unshift(monster);
}
