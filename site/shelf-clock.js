const turn = 2 * Math.PI;

export function clockHands(root) {
  const hands = {};
  root.traverse(part => {
    const name = part.userData.shelfPart;
    if (name?.startsWith('clock-hand-')) hands[name.slice(11)] = part;
  });
  return hands.second ? hands : null;
}

export function setClock(hands, time) {
  const seconds = time.getSeconds();
  const minutes = time.getMinutes() + seconds / 60;
  hands.second.rotation.z = -turn * seconds / 60;
  hands.minute.rotation.z = -turn * minutes / 60;
  hands.hour.rotation.z = -turn * (time.getHours() + minutes / 60) / 12;
}
