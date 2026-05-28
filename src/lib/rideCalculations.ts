export type IntendedIntensity = 'chill' | 'tempo' | 'hard' | 'race';
export type ActualOutcome = 'chill' | 'spicy' | 'attacked' | 'lied';

export interface RideCalculationResult {
  trustChange: number;
  resultType: 'trustworthy' | 'liar' | 'zone2_criminal' | 'assassin' | 'chaos' | 'sandbagger' | 'neutral';
  earnedBadgeId: string | null;
}

export const calculateRideResult = (
  intended: IntendedIntensity,
  actual: ActualOutcome,
  isCoffeeAssassinCandidate: boolean = false
): RideCalculationResult => {
  // Check Coffee Ride Assassin first!
  // Said coffee ride or chill, but went spicy/attacked/lied AND flagged coffee candidate
  if (isCoffeeAssassinCandidate && intended === 'chill' && actual !== 'chill') {
    return {
      trustChange: -25,
      resultType: 'assassin',
      earnedBadgeId: 'assassin',
    };
  }

  // Standard Logic Matrix
  switch (intended) {
    case 'chill':
      if (actual === 'chill') {
        return { trustChange: 10, resultType: 'trustworthy', earnedBadgeId: 'trustworthy' };
      } else if (actual === 'spicy') {
        return { trustChange: -15, resultType: 'zone2_criminal', earnedBadgeId: 'zone2_criminal' };
      } else if (actual === 'attacked') {
        return { trustChange: -5, resultType: 'chaos', earnedBadgeId: 'chaos' };
      } else if (actual === 'lied') {
        return { trustChange: -30, resultType: 'liar', earnedBadgeId: 'liar' };
      }
      break;

    case 'tempo':
      if (actual === 'chill') {
        return { trustChange: -10, resultType: 'sandbagger', earnedBadgeId: 'sandbagger' };
      } else if (actual === 'spicy') {
        return { trustChange: 5, resultType: 'neutral', earnedBadgeId: null };
      } else if (actual === 'attacked') {
        return { trustChange: 2, resultType: 'neutral', earnedBadgeId: null };
      } else if (actual === 'lied') {
        return { trustChange: -15, resultType: 'liar', earnedBadgeId: 'liar' };
      }
      break;

    case 'hard':
      if (actual === 'chill') {
        return { trustChange: -20, resultType: 'sandbagger', earnedBadgeId: 'sandbagger' };
      } else if (actual === 'spicy') {
        return { trustChange: 5, resultType: 'neutral', earnedBadgeId: null };
      } else if (actual === 'attacked') {
        return { trustChange: 10, resultType: 'neutral', earnedBadgeId: null };
      } else if (actual === 'lied') {
        return { trustChange: 0, resultType: 'neutral', earnedBadgeId: null };
      }
      break;

    case 'race':
      if (actual === 'chill') {
        return { trustChange: -30, resultType: 'sandbagger', earnedBadgeId: 'sandbagger' };
      } else if (actual === 'lied') {
        return { trustChange: 10, resultType: 'neutral', earnedBadgeId: null };
      } else {
        // actual is spicy or attacked
        return { trustChange: 5, resultType: 'neutral', earnedBadgeId: null };
      }
  }

  return { trustChange: 0, resultType: 'neutral', earnedBadgeId: null };
};

// Autogenerate fun cycling titles based on selected intensity
export const generateRideTitle = (intensity: IntendedIntensity): string => {
  const sundaySpins = [
    'Sunday Coffee Ride ☕',
    'Wednesday Recovery Spin',
    'Thursday Fake Recovery',
    'Saturday Chain Gang 🚴',
    'Casual Suffering Session',
    'Croissant and Chill 🥐',
    'No Attacks Today I Promise',
    'Zone 2 Coffee Roll',
    'Social Spin Only'
  ];

  const tempoSpins = [
    'Sweetspot Suffrage',
    'Tempo Tuesday',
    'Light Active Recovery',
    'Paceline Practice',
    'Spicy Coffee Roll 🌶️'
  ];

  const hardSpins = [
    'KOM Hunting Expedition',
    'Midweek Worlds 🏆',
    'Hill Interval Torture',
    'No Drop But We Drop Everyone',
    'Casual Smashing'
  ];

  const raceSpins = [
    'Saturday Chain Gang ☠️',
    'Full Gas Crit Practice',
    'VO2 Max Destruction',
    'Ego Crushing Session',
    'Race Simulation (Suffering)'
  ];

  let list = sundaySpins;
  if (intensity === 'tempo') list = tempoSpins;
  if (intensity === 'hard') list = hardSpins;
  if (intensity === 'race') list = raceSpins;

  return list[Math.floor(Math.random() * list.length)];
};
