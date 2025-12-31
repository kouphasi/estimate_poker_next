import { describe, it, expect, beforeEach } from 'vitest';
import { EstimateCalculationService } from '@/domain/session/EstimateCalculationService';
import { Estimate } from '@/domain/session/Estimate';

describe('EstimateCalculationService', () => {
  let service: EstimateCalculationService;

  beforeEach(() => {
    service = new EstimateCalculationService();
  });

  const createEstimates = (values: number[]): Estimate[] =>
    values.map((value, index) =>
      Estimate.create(
        `estimate-${index}`,
        'session-123',
        `user-${index}`,
        `User ${index}`,
        value
      )
    );

  describe('calculateAverage', () => {
    it('should return 0 for empty array', () => {
      expect(service.calculateAverage([])).toBe(0);
    });

    it('should calculate average for single estimate', () => {
      const estimates = createEstimates([5]);
      expect(service.calculateAverage(estimates)).toBe(5);
    });

    it('should calculate average for multiple estimates', () => {
      const estimates = createEstimates([2, 4, 6]);
      expect(service.calculateAverage(estimates)).toBe(4);
    });

    it('should handle decimal averages', () => {
      const estimates = createEstimates([1, 2]);
      expect(service.calculateAverage(estimates)).toBe(1.5);
    });
  });

  describe('calculateMedian', () => {
    it('should return 0 for empty array', () => {
      expect(service.calculateMedian([])).toBe(0);
    });

    it('should return value for single estimate', () => {
      const estimates = createEstimates([5]);
      expect(service.calculateMedian(estimates)).toBe(5);
    });

    it('should calculate median for odd number of estimates', () => {
      const estimates = createEstimates([1, 5, 3]);
      expect(service.calculateMedian(estimates)).toBe(3);
    });

    it('should calculate median for even number of estimates', () => {
      const estimates = createEstimates([1, 2, 3, 4]);
      expect(service.calculateMedian(estimates)).toBe(2.5);
    });

    it('should handle unsorted input', () => {
      const estimates = createEstimates([5, 1, 3, 2, 4]);
      expect(service.calculateMedian(estimates)).toBe(3);
    });
  });

  describe('findMin', () => {
    it('should return 0 for empty array', () => {
      expect(service.findMin([])).toBe(0);
    });

    it('should find minimum for single estimate', () => {
      const estimates = createEstimates([5]);
      expect(service.findMin(estimates)).toBe(5);
    });

    it('should find minimum for multiple estimates', () => {
      const estimates = createEstimates([3, 1, 4, 1, 5]);
      expect(service.findMin(estimates)).toBe(1);
    });

    it('should handle zero values', () => {
      const estimates = createEstimates([5, 0, 3]);
      expect(service.findMin(estimates)).toBe(0);
    });
  });

  describe('findMax', () => {
    it('should return 0 for empty array', () => {
      expect(service.findMax([])).toBe(0);
    });

    it('should find maximum for single estimate', () => {
      const estimates = createEstimates([5]);
      expect(service.findMax(estimates)).toBe(5);
    });

    it('should find maximum for multiple estimates', () => {
      const estimates = createEstimates([3, 1, 4, 1, 5]);
      expect(service.findMax(estimates)).toBe(5);
    });

    it('should handle large values', () => {
      const estimates = createEstimates([10, 100, 1000]);
      expect(service.findMax(estimates)).toBe(1000);
    });
  });

  describe('calculateAllStatistics', () => {
    it('should return all zeros for empty array', () => {
      const result = service.calculateAllStatistics([]);

      expect(result).toEqual({
        average: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
      });
    });

    it('should calculate all statistics for single estimate', () => {
      const estimates = createEstimates([5]);
      const result = service.calculateAllStatistics(estimates);

      expect(result).toEqual({
        average: 5,
        median: 5,
        min: 5,
        max: 5,
        count: 1,
      });
    });

    it('should calculate all statistics for multiple estimates', () => {
      const estimates = createEstimates([1, 2, 3, 4, 5]);
      const result = service.calculateAllStatistics(estimates);

      expect(result).toEqual({
        average: 3,
        median: 3,
        min: 1,
        max: 5,
        count: 5,
      });
    });

    it('should handle complex dataset', () => {
      const estimates = createEstimates([2, 4, 4, 4, 5, 5, 7, 9]);
      const result = service.calculateAllStatistics(estimates);

      expect(result.count).toBe(8);
      expect(result.average).toBe(5); // (2+4+4+4+5+5+7+9)/8 = 40/8 = 5
      expect(result.median).toBe(4.5); // (4+5)/2 = 4.5
      expect(result.min).toBe(2);
      expect(result.max).toBe(9);
    });
  });
});
