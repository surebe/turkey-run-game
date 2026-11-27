// Gobble Dash — every tuning number, the autumn palette and the stage table
// live here, so the rest of the game never hard-codes a magic value.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const GROUND_Y = 664; // the dirt line the turkey's feet run on
export const TURKEY_X = 400; // the turkey's fixed screen x; the world scrolls
export const PX_PER_METER = 46; // world pixels per metre of escape distance
export const ESCAPE_METERS = 1000; // reach the forest gate to win your freedom

export const TUNING = {
  startSpeed: 335, // px/s when the run begins
  maxSpeed: 585, // px/s at full panic
  speedRamp: 2.6, // px/s gained per second of running
  gravity: 2350, // px/s^2 pulling the turkey back to earth
  jumpVelocity: 905, // px/s of the first hop
  doubleJumpVelocity: 760, // px/s of the feather-flutter second hop
  duckTime: 0.16, // s to squash down into a duck
  farmerStartGap: 330, // px between farmer and turkey at the gun
  farmerMinGap: 300, // the gap clean running slowly restores toward
  farmerMaxGap: 430, // the gap never grows past this
  farmerPressure: 3.4, // px/s the farmer claws back while you run clean
  farmerRecovery: 9.5, // px/s of gap you win back per clean second
  stumbleGapLoss: 105, // px the farmer lunges on every stumble
  cornGapGift: 9, // px the farmer loses when he stops to pocket your corn
  catchGap: 36, // px: closer than this and his hand closes on your tail
  invulnTime: 1.25, // s of mercy flashing after a stumble
  hearts: 3,
  nearMissPx: 26, // clearing an obstacle by less than this scores a near miss
  scorePerMeter: 2,
  cornScore: 25,
  goldCornScore: 100,
  nearMissScore: 15,
};

// The run crosses four stages; each names its sky, its ground and its dangers.
export const STAGES = [
  {
    name: 'The Farmyard',
    shout: 'STAGE 1 — THE FARMYARD',
    until: 340,
    skyTop: '#f7b733',
    skyBottom: '#fde8c8',
    hillFar: '#d98e4a',
    hillNear: '#b96a32',
    ground: '#8a5a2b',
    groundDark: '#744a21',
    indoor: false,
    dangers: ['hay', 'fence', 'mud', 'pumpkin'],
  },
  {
    name: 'The Barnyard',
    shout: 'STAGE 2 — THE BARNYARD',
    until: 640,
    skyTop: '#f28c38',
    skyBottom: '#fbd9a8',
    hillFar: '#c97a3d',
    hillNear: '#a85a28',
    ground: '#7d4f24',
    groundDark: '#68401c',
    indoor: false,
    dangers: ['hay', 'fence', 'mud', 'pumpkin', 'knife', 'cleaver'],
  },
  {
    name: 'The Kitchen',
    shout: 'STAGE 3 — THE KITCHEN!',
    until: 900,
    skyTop: '#5d3a2a',
    skyBottom: '#8a5a34',
    hillFar: '#4a2c1e',
    hillNear: '#3c2417',
    ground: '#6e4630',
    groundDark: '#593824',
    indoor: true,
    dangers: ['oven', 'counter', 'knife', 'cleaver', 'pumpkin'],
  },
  {
    name: 'The Home Stretch',
    shout: 'FINAL STRETCH — RUN!',
    until: Infinity,
    skyTop: '#7ec8e3',
    skyBottom: '#e8f6d8',
    hillFar: '#5d9e6e',
    hillNear: '#3f7d4e',
    ground: '#5d7a35',
    groundDark: '#4c652b',
    indoor: false,
    dangers: ['fence', 'hay', 'knife', 'cleaver'],
  },
];

export function stageAt(meters) {
  for (let i = 0; i < STAGES.length; i++) {
    if (meters < STAGES[i].until) return i;
  }
  return STAGES.length - 1;
}

export const COLORS = {
  ink: '#2b1a10',
  cream: '#fff6e3',
  paper: '#f7e3b8',
  red: '#c0392b',
  gold: '#f5b921',
  turkeyBody: '#8a5a33',
  turkeyDark: '#6e4525',
  turkeyLight: '#c98f54',
  featherRed: '#b84a2e',
  featherGold: '#e09f3e',
  featherCream: '#f2e2c4',
  farmerShirt: '#b03a2e',
  farmerDenim: '#33526e',
  farmerSkin: '#e8b08a',
  farmerHat: '#d9a441',
};
