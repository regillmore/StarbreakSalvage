export const MISSILE_EJECTION_SECONDS = 0.09;
export const MISSILE_BOOST_END_SECONDS = 0.48;
export const MISSILE_EJECTION_SPEED_SCALE = 0.5;
export const MISSILE_CRUISE_SPEED_SCALE = 1.24;

export type MissileFlightPhase = 'ejection' | 'boost' | 'cruise';

export function isMissileProjectile(tags: readonly string[]): boolean {
  return tags.includes('missile');
}

export function getMissileFlightPhase(ageSeconds: number): MissileFlightPhase {
  const age = Math.max(0, ageSeconds);

  if (age < MISSILE_EJECTION_SECONDS) return 'ejection';
  if (age < MISSILE_BOOST_END_SECONDS) return 'boost';
  return 'cruise';
}

export function getMissileThrustScale(ageSeconds: number): number {
  const age = Math.max(0, ageSeconds);

  if (age <= MISSILE_EJECTION_SECONDS) return MISSILE_EJECTION_SPEED_SCALE;
  if (age >= MISSILE_BOOST_END_SECONDS) return MISSILE_CRUISE_SPEED_SCALE;

  const boostProgress =
    (age - MISSILE_EJECTION_SECONDS) / (MISSILE_BOOST_END_SECONDS - MISSILE_EJECTION_SECONDS);
  return (
    MISSILE_EJECTION_SPEED_SCALE +
    (MISSILE_CRUISE_SPEED_SCALE - MISSILE_EJECTION_SPEED_SCALE) * boostProgress
  );
}

/**
 * Converts wall-clock flight time into the equivalent seconds traveled at the
 * projectile's authored velocity. The closed-form integral keeps missile
 * travel identical whether simulation time arrives in one step or many.
 */
export function getMissileTravelSeconds(ageSeconds: number): number {
  const age = Math.max(0, ageSeconds);
  const ejectionEnd = Math.min(age, MISSILE_EJECTION_SECONDS);
  let travelSeconds = ejectionEnd * MISSILE_EJECTION_SPEED_SCALE;

  if (age <= MISSILE_EJECTION_SECONDS) return travelSeconds;

  const boostDuration = MISSILE_BOOST_END_SECONDS - MISSILE_EJECTION_SECONDS;
  const elapsedBoost = Math.min(age - MISSILE_EJECTION_SECONDS, boostDuration);
  const speedScaleDelta = MISSILE_CRUISE_SPEED_SCALE - MISSILE_EJECTION_SPEED_SCALE;
  travelSeconds +=
    elapsedBoost * MISSILE_EJECTION_SPEED_SCALE +
    (speedScaleDelta * elapsedBoost * elapsedBoost) / (2 * boostDuration);

  if (age > MISSILE_BOOST_END_SECONDS) {
    travelSeconds += (age - MISSILE_BOOST_END_SECONDS) * MISSILE_CRUISE_SPEED_SCALE;
  }

  return travelSeconds;
}

export function getProjectileTravelSeconds(ageSeconds: number, tags: readonly string[]): number {
  const age = Math.max(0, ageSeconds);
  return isMissileProjectile(tags) ? getMissileTravelSeconds(age) : age;
}

export function getProjectileTravelDeltaSeconds(
  startAgeSeconds: number,
  endAgeSeconds: number,
  tags: readonly string[]
): number {
  const startAge = Math.max(0, startAgeSeconds);
  const endAge = Math.max(startAge, endAgeSeconds);
  return getProjectileTravelSeconds(endAge, tags) - getProjectileTravelSeconds(startAge, tags);
}

export function getProjectileTravelTimeForDistance(
  distance: number,
  authoredSpeed: number,
  tags: readonly string[]
): number {
  const safeDistance = Math.max(0, distance);
  const safeSpeed = Math.max(1, authoredSpeed);

  if (!isMissileProjectile(tags)) return safeDistance / safeSpeed;

  const targetTravelSeconds = safeDistance / safeSpeed;
  let low = 0;
  let high = Math.max(1, targetTravelSeconds / MISSILE_EJECTION_SPEED_SCALE);

  while (getMissileTravelSeconds(high) < targetTravelSeconds) high *= 2;

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const middle = (low + high) / 2;
    if (getMissileTravelSeconds(middle) < targetTravelSeconds) low = middle;
    else high = middle;
  }

  return high;
}
