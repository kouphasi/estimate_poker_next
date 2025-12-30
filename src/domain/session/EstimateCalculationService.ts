import { Estimate } from './Estimate';

/**
 * EstimateCalculationService ドメインサービス
 * 見積もりの統計計算を担当
 */
export class EstimateCalculationService {
  /**
   * 見積もり値の平均を計算
   * @returns 平均値（見積もりがない場合は0）
   */
  calculateAverage(estimates: Estimate[]): number {
    if (estimates.length === 0) {
      return 0;
    }

    const sum = estimates.reduce((acc, estimate) => acc + estimate.value, 0);
    return sum / estimates.length;
  }

  /**
   * 見積もり値の中央値を計算
   * @returns 中央値（見積もりがない場合は0）
   */
  calculateMedian(estimates: Estimate[]): number {
    if (estimates.length === 0) {
      return 0;
    }

    const values = estimates.map((e) => e.value).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);

    if (values.length % 2 === 0) {
      return (values[mid - 1] + values[mid]) / 2;
    }

    return values[mid];
  }

  /**
   * 見積もり値の最小値を取得
   * @returns 最小値（見積もりがない場合は0）
   */
  findMin(estimates: Estimate[]): number {
    if (estimates.length === 0) {
      return 0;
    }

    return Math.min(...estimates.map((e) => e.value));
  }

  /**
   * 見積もり値の最大値を取得
   * @returns 最大値（見積もりがない場合は0）
   */
  findMax(estimates: Estimate[]): number {
    if (estimates.length === 0) {
      return 0;
    }

    return Math.max(...estimates.map((e) => e.value));
  }

  /**
   * すべての統計情報を一度に計算
   * @returns 統計情報オブジェクト
   */
  calculateAllStatistics(estimates: Estimate[]): {
    average: number;
    median: number;
    min: number;
    max: number;
    count: number;
  } {
    return {
      average: this.calculateAverage(estimates),
      median: this.calculateMedian(estimates),
      min: this.findMin(estimates),
      max: this.findMax(estimates),
      count: estimates.length,
    };
  }
}
