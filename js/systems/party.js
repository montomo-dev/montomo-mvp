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

export function depositToRanch(party, ranch, index) {
  if (party.length <= 0) return false;
  const [monster] = party.splice(index, 1);
  ranch.push(monster);
  return true;
}

export function withdrawFromRanch(party, ranch, index) {
  if (party.length >= MAX_PARTY) return false;
  const [monster] = ranch.splice(index, 1);
  party.push(monster);
  return true;
}
