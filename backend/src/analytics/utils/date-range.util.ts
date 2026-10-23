import {
  AnalyticsTimeframe,
  AnalyticsInterval,
} from '../interfaces/analytics.interface';

export interface DateRangeResult {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  interval: AnalyticsInterval;
  buckets: { key: string; label: string; start: Date; end: Date }[];
}

export class DateRangeUtil {
  /**
   * Resolve current and equivalent previous date ranges, interval, and time series buckets.
   */
  static resolveDateRange(params: {
    timeframe?: AnalyticsTimeframe | string;
    interval?: AnalyticsInterval | string;
    dateFrom?: string;
    dateTo?: string;
  }): DateRangeResult {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const timeframe = (params.timeframe || 'LAST_30_DAYS').toUpperCase();

    switch (timeframe) {
      case 'TODAY': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      }
      case 'YESTERDAY': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      }
      case 'LAST_7_DAYS': {
        startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'THIS_MONTH': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      }
      case 'LAST_MONTH': {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      }
      case 'THIS_QUARTER': {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
        break;
      }
      case 'THIS_YEAR': {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      }
      case 'CUSTOM': {
        if (params.dateFrom && params.dateTo) {
          startDate = new Date(params.dateFrom);
          endDate = new Date(params.dateTo);
        } else if (params.dateFrom) {
          startDate = new Date(params.dateFrom);
        } else {
          startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
        }
        break;
      }
      case 'LAST_30_DAYS':
      default: {
        startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
    }

    // Calculate duration in ms
    const durationMs = endDate.getTime() - startDate.getTime();

    // Previous equivalent period
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

    // Determine appropriate interval if not explicitly provided
    let interval: AnalyticsInterval;
    if (params.interval) {
      interval = params.interval.toUpperCase() as AnalyticsInterval;
    } else {
      const days = Math.round(durationMs / (24 * 60 * 60 * 1000));
      if (days <= 2) {
        interval = 'DAILY';
      } else if (days <= 35) {
        interval = 'DAILY';
      } else if (days <= 120) {
        interval = 'WEEKLY';
      } else if (days <= 400) {
        interval = 'MONTHLY';
      } else {
        interval = 'QUARTERLY';
      }
    }

    // Generate continuous buckets for the entire date span
    const buckets = this.generateBuckets(startDate, endDate, interval);

    return {
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      interval,
      buckets,
    };
  }

  private static generateBuckets(
    start: Date,
    end: Date,
    interval: AnalyticsInterval,
  ): { key: string; label: string; start: Date; end: Date }[] {
    const buckets: { key: string; label: string; start: Date; end: Date }[] = [];
    const current = new Date(start);

    while (current <= end) {
      let bucketStart: Date;
      let bucketEnd: Date;
      let key: string;
      let label: string;

      switch (interval) {
        case 'DAILY': {
          bucketStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0);
          bucketEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999);
          key = bucketStart.toISOString().slice(0, 10);
          label = bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          current.setDate(current.getDate() + 1);
          break;
        }
        case 'WEEKLY': {
          const dayOfWeek = current.getDay();
          bucketStart = new Date(current);
          bucketStart.setDate(current.getDate() - dayOfWeek);
          bucketStart.setHours(0, 0, 0, 0);

          bucketEnd = new Date(bucketStart);
          bucketEnd.setDate(bucketStart.getDate() + 6);
          bucketEnd.setHours(23, 59, 59, 999);

          key = bucketStart.toISOString().slice(0, 10);
          label = `Week of ${bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          current.setDate(current.getDate() + 7);
          break;
        }
        case 'MONTHLY': {
          bucketStart = new Date(current.getFullYear(), current.getMonth(), 1, 0, 0, 0, 0);
          bucketEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
          key = `${bucketStart.getFullYear()}-${String(bucketStart.getMonth() + 1).padStart(2, '0')}`;
          label = bucketStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          current.setMonth(current.getMonth() + 1);
          break;
        }
        case 'QUARTERLY': {
          const qMonth = Math.floor(current.getMonth() / 3) * 3;
          bucketStart = new Date(current.getFullYear(), qMonth, 1, 0, 0, 0, 0);
          bucketEnd = new Date(current.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
          const qNum = Math.floor(qMonth / 3) + 1;
          key = `${bucketStart.getFullYear()}-Q${qNum}`;
          label = `Q${qNum} ${bucketStart.getFullYear()}`;
          current.setMonth(current.getMonth() + 3);
          break;
        }
      }

      buckets.push({ key, label, start: bucketStart, end: bucketEnd });
    }

    return buckets;
  }
}
