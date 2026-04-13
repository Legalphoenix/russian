/**
 * Unified spaced repetition scheduler for Russian trainers.
 *
 * Implements an SM-2-inspired algorithm with speed weighting.
 * All trainers can import these functions to get consistent scheduling.
 *
 * Usage: <script src="/shared/srs.js"></script>
 */

/**
 * Calculate the next review interval in turns.
 *
 * @param {object} stats - Item stats: { seen, correct, wrong, streak, dueAt, lastTurn }
 * @param {number} responseMs - How long the answer took
 * @param {boolean} correct - Whether the answer was correct
 * @param {object} [options] - Optional config
 * @param {number} [options.speedTargetMs=3500] - Target response time for "fast"
 * @param {number} [options.baseInterval=3] - Minimum interval on correct
 * @param {number} [options.maxInterval=30] - Maximum interval
 * @param {number} [options.lapseInterval=2] - Interval after a wrong answer
 * @returns {number} Next review interval in turns
 */
function srsNextInterval(stats, responseMs, correct, options = {}) {
  const {
    speedTargetMs = 3500,
    baseInterval = 3,
    maxInterval = 30,
    lapseInterval = 2,
  } = options;

  if (!correct) {
    return lapseInterval;
  }

  // Base grows with streak: 3, 4, 5, 7, 9, 12, 15, ...
  const streak = (stats.streak || 0) + 1; // +1 because this correct hasn't been counted yet
  let interval;

  if (streak <= 1) {
    interval = baseInterval;
  } else if (streak <= 3) {
    interval = baseInterval + streak;
  } else {
    // Exponential-ish growth capped at maxInterval
    interval = Math.min(maxInterval, Math.round(baseInterval * Math.pow(1.5, streak - 1)));
  }

  // Speed factor: fast answers get longer intervals (more stable)
  if (responseMs && speedTargetMs) {
    const speedRatio = speedTargetMs / Math.max(responseMs, 500);
    if (speedRatio >= 1.2) {
      // Fast: extend interval by up to 40%
      interval = Math.round(interval * Math.min(1.4, speedRatio));
    } else if (speedRatio < 0.6) {
      // Slow: shrink interval by up to 30%
      interval = Math.max(baseInterval, Math.round(interval * 0.7));
    }
  }

  return Math.min(maxInterval, interval);
}

/**
 * Calculate stability score (0-1) for an item.
 * Consistent formula across all trainers.
 *
 * @param {object} stats - { seen, correct, wrong, streak }
 * @param {number} [avgResponseMs] - Average correct response time
 * @param {number} [speedTargetMs=3500] - Target speed
 * @returns {number} Stability score 0-1
 */
function srsStability(stats, avgResponseMs, speedTargetMs = 3500) {
  if (!stats.seen) return 0.05;

  const accuracy = stats.correct / stats.seen;
  const accuracyWeight = 0.65;

  let speedScore = 0.5;
  if (avgResponseMs && speedTargetMs) {
    speedScore = Math.min(1, Math.max(0.1, speedTargetMs / avgResponseMs));
  }
  const speedWeight = 0.2;

  const streakBonus = Math.min(0.15, (stats.streak || 0) * 0.03);

  return Math.min(1, Math.max(0.05, accuracyWeight * accuracy + speedWeight * speedScore + streakBonus));
}

/**
 * Score an item for priority in the review queue.
 * Higher score = should be shown sooner.
 *
 * @param {object} stats - Item stats
 * @param {number} currentTurn - Current global turn counter
 * @param {object} [options] - Optional config
 * @returns {number} Priority score (higher = more urgent)
 */
function srsCandidateScore(stats, currentTurn, options = {}) {
  const dueBonus = (stats.dueAt || 0) <= currentTurn ? 12 : 0;
  const unseenBonus = !stats.seen ? 8 : 0;
  const wrongBonus = (stats.wrong || 0) * 3;
  const recencyPenalty = stats.lastTurn === currentTurn - 1 ? -8 : 0;
  const randomJitter = Math.random();

  return dueBonus + unseenBonus + wrongBonus + recencyPenalty + randomJitter;
}
