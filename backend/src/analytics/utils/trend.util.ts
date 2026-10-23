import { MetricWithTrend, TrendDirection } from '../interfaces/analytics.interface';

export class TrendUtil {
  /**
   * Calculate current vs previous metric comparison, delta change, and percentage trend.
   */
  static calculateTrend(current: number, previous: number): MetricWithTrend {
    const safeCurrent = Number(current) || 0;
    const safePrevious = Number(previous) || 0;
    const change = Math.round((safeCurrent - safePrevious) * 100) / 100;

    let percentage = 0;
    if (safePrevious > 0) {
      percentage = Math.round(((safeCurrent - safePrevious) / safePrevious) * 1000) / 10;
    } else if (safeCurrent > 0) {
      percentage = 100;
    }

    let direction: TrendDirection = 'FLAT';
    if (change > 0) {
      direction = 'UP';
    } else if (change < 0) {
      direction = 'DOWN';
    }

    return {
      current: safeCurrent,
      previous: safePrevious,
      change,
      percentage,
      direction,
    };
  }

  /**
   * Helper to format a percentage rate safely.
   */
  static calculateRate(part: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 1000) / 10;
  }
}
