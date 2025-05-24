import { useMemo } from 'react';
import { LoanDto } from '@/types';
import { useBtcPriceHistory } from './useBtcPriceHistory';

export interface LoanMetricsDataPoint {
  date: string;
  totalRepaymentAmount: number;
  totalCurrentValue: number;
  activeLoanCount: number;
  cumulativeLoaned: number;
  profitLoss: number;
  potentialValue: number;
  averageLoanAmount: number;
  totalCollateralValue: number;
  btcPrice: number; // Historical BTC price for this date
  // New fields for aggregation
  year: number;
  month: number;
  day: number;
  yearMonth: string; // YYYY-MM for grouping
}

export interface AggregatedDataPoint {
  period: string; // YYYY-MM for monthly, YYYY-MM-DD for daily
  displayLabel: string; // Human readable label
  totalRepaymentAmount: number;
  totalCurrentValue: number;
  activeLoanCount: number;
  cumulativeLoaned: number;
  profitLoss: number;
  potentialValue: number;
  averageLoanAmount: number;
  totalCollateralValue: number;
  btcPrice: number;
  // Aggregation metadata
  dataPointCount: number;
  rawDataPoints: LoanMetricsDataPoint[]; // Store raw daily data for drill-down
}

export type ViewLevel = 'monthly' | 'daily';

export interface LoanMetricsAnalysis {
  // Raw daily data
  dailyData: LoanMetricsDataPoint[];
  // Aggregated data based on current view level
  chartData: AggregatedDataPoint[];
  currentMetrics: {
    totalRepaymentAmount: number;
    totalCurrentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    activeLoanCount: number;
    cumulativeLoaned: number;
    averageLoanAmount: number;
    totalCollateralValue: number;
  } | null;
  trends: {
    profitTrend: 'increasing' | 'decreasing' | 'stable';
    valueGrowth: number; // percentage change over last period
  };
  isLoadingPriceHistory: boolean;
  priceHistoryError: string | null;
}

const generateDailyDates = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const aggregateDataByMonth = (dailyData: LoanMetricsDataPoint[]): AggregatedDataPoint[] => {
  const monthlyGroups = new Map<string, LoanMetricsDataPoint[]>();

  // Group by year-month
  dailyData.forEach(dataPoint => {
    const yearMonth = dataPoint.yearMonth;
    if (!monthlyGroups.has(yearMonth)) {
      monthlyGroups.set(yearMonth, []);
    }
    monthlyGroups.get(yearMonth)!.push(dataPoint);
  });

  // Aggregate each month
  const aggregated: AggregatedDataPoint[] = [];
  
  monthlyGroups.forEach((monthData, yearMonth) => {
    // Use the last day of the month for most metrics (latest state)
    const lastDayData = monthData[monthData.length - 1];
    
    // For some metrics, we might want averages
    const avgBtcPrice = monthData.reduce((sum, d) => sum + d.btcPrice, 0) / monthData.length;

    aggregated.push({
      period: yearMonth,
      displayLabel: new Date(yearMonth + '-01').toLocaleDateString('cs-CZ', { 
        year: 'numeric', 
        month: 'long' 
      }),
      totalRepaymentAmount: lastDayData.totalRepaymentAmount,
      totalCurrentValue: lastDayData.totalCurrentValue,
      activeLoanCount: lastDayData.activeLoanCount,
      cumulativeLoaned: lastDayData.cumulativeLoaned,
      profitLoss: lastDayData.profitLoss,
      potentialValue: lastDayData.potentialValue,
      averageLoanAmount: lastDayData.averageLoanAmount,
      totalCollateralValue: lastDayData.totalCollateralValue,
      btcPrice: avgBtcPrice,
      dataPointCount: monthData.length,
      rawDataPoints: monthData
    });
  });

  return aggregated.sort((a, b) => a.period.localeCompare(b.period));
};

const aggregateDataByDay = (dailyData: LoanMetricsDataPoint[], yearMonth?: string): AggregatedDataPoint[] => {
  let filteredData = dailyData;
  
  // If yearMonth is provided, filter to that month only
  if (yearMonth) {
    filteredData = dailyData.filter(d => d.yearMonth === yearMonth);
  }

  return filteredData.map(dataPoint => ({
    period: dataPoint.date,
    displayLabel: new Date(dataPoint.date).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'short'
    }),
    totalRepaymentAmount: dataPoint.totalRepaymentAmount,
    totalCurrentValue: dataPoint.totalCurrentValue,
    activeLoanCount: dataPoint.activeLoanCount,
    cumulativeLoaned: dataPoint.cumulativeLoaned,
    profitLoss: dataPoint.profitLoss,
    potentialValue: dataPoint.potentialValue,
    averageLoanAmount: dataPoint.averageLoanAmount,
    totalCollateralValue: dataPoint.totalCollateralValue,
    btcPrice: dataPoint.btcPrice,
    dataPointCount: 1,
    rawDataPoints: [dataPoint]
  }));
};

export const useLoanMetrics = (
  loans: LoanDto[], 
  currentBtcPrice: number,
  viewLevel: ViewLevel = 'monthly',
  selectedMonth?: string // YYYY-MM format for daily drill-down
): LoanMetricsAnalysis => {
  
  // Calculate date range for price history - from oldest active loan to today
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = useMemo(() => {
    if (!loans || loans.length === 0) {
      // Fallback to 24 months back if no loans
      const date = new Date();
      date.setMonth(date.getMonth() - 24);
      return date.toISOString().split('T')[0];
    }

    // Find the oldest active loan date
    const activeLoans = loans.filter(loan => loan.status === 'Active');
    
    if (activeLoans.length === 0) {
      // If no active loans, use the most recent loan date or 3 months back
      const recentLoanDate = loans
        .map(loan => new Date(loan.loanDate))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      
      if (recentLoanDate) {
        return recentLoanDate.toISOString().split('T')[0];
      } else {
        // Fallback to 3 months back
        const date = new Date();
        date.setMonth(date.getMonth() - 3);
        return date.toISOString().split('T')[0];
      }
    }

    // Get the oldest active loan date
    const oldestActiveLoanDate = activeLoans
      .map(loan => new Date(loan.loanDate))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return oldestActiveLoanDate.toISOString().split('T')[0];
  }, [loans]);

  // Fetch historical BTC price data
  const { 
    getPriceForDate, 
    isLoading: isLoadingPriceHistory, 
    error: priceHistoryError 
  } = useBtcPriceHistory(startDate, endDate);
  
  return useMemo(() => {
    if (!loans || loans.length === 0) {
      return {
        dailyData: [],
        chartData: [],
        currentMetrics: null,
        trends: {
          profitTrend: 'stable',
          valueGrowth: 0
        },
        isLoadingPriceHistory,
        priceHistoryError
      };
    }

    // Vytvoříme denní snapshoty od startDate do dneška
    const dailyDates = generateDailyDates(startDate, endDate);

    const dataPoints: LoanMetricsDataPoint[] = [];

    dailyDates.forEach(dateStr => {
      const currentDate = new Date(dateStr);
      
      // Získáme historickou cenu BTC pro tento datum
      const historicalBtcPrice = getPriceForDate(currentDate, currentBtcPrice);
      
      // Najdeme půjčky aktivní k tomuto datu
      const activeLoans = loans.filter(loan => {
        const loanDate = new Date(loan.loanDate);
        const repaymentDate = new Date(loan.repaymentDate);
        
        return loanDate <= currentDate && 
               (loan.status === 'Active' || 
                (loan.status === 'Closed' && repaymentDate >= currentDate));
      });

      // Spočítáme metriky s historickou cenou BTC
      const totalRepaymentAmount = activeLoans.reduce((sum, loan) => 
        sum + loan.repaymentAmountCzk, 0
      );

      const totalCurrentValue = activeLoans.reduce((sum, loan) => {
        const historicalBtcValue = loan.purchasedBtc * historicalBtcPrice;

        return sum + historicalBtcValue;
      }, 0);

      const cumulativeLoaned = loans
        .filter(loan => new Date(loan.loanDate) <= currentDate)
        .reduce((sum, loan) => sum + loan.loanAmountCzk, 0);

      const potentialValue = activeLoans.reduce((sum, loan) => 
        sum + (loan.potentialValueCzk || 0), 0
      );

      const totalCollateralValue = activeLoans.reduce((sum, loan) => 
        sum + (loan.collateralBtc * historicalBtcPrice), 0
      );

      const profitLoss = totalCurrentValue - totalRepaymentAmount;
      const averageLoanAmount = activeLoans.length > 0 
        ? activeLoans.reduce((sum, loan) => sum + loan.loanAmountCzk, 0) / activeLoans.length 
        : 0;

      dataPoints.push({
        date: dateStr,
        totalRepaymentAmount,
        totalCurrentValue,
        activeLoanCount: activeLoans.length,
        cumulativeLoaned,
        profitLoss,
        potentialValue,
        averageLoanAmount,
        totalCollateralValue,
        btcPrice: historicalBtcPrice,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        day: currentDate.getDate(),
        yearMonth: `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`
      });
    });

    // Spočítáme současné metriky
    const currentMetrics = dataPoints.length > 0 ? (() => {
      const latest = dataPoints[dataPoints.length - 1];

      return {
        totalRepaymentAmount: latest.totalRepaymentAmount,
        totalCurrentValue: latest.totalCurrentValue,
        profitLoss: latest.profitLoss,
        profitLossPercentage: latest.totalRepaymentAmount > 0 
          ? (latest.profitLoss / latest.totalRepaymentAmount) * 100 
          : 0,
        activeLoanCount: latest.activeLoanCount,
        cumulativeLoaned: latest.cumulativeLoaned,
        averageLoanAmount: latest.averageLoanAmount,
        totalCollateralValue: latest.totalCollateralValue
      };
    })() : null;

    // Analyzujeme trendy
    const trends = (() => {
      if (dataPoints.length < 2) {
        return {
          profitTrend: 'stable' as const,
          valueGrowth: 0
        };
      }

      const recent = dataPoints.slice(-5); // posledních 5 datových bodů
      const profitValues = recent.map(d => d.profitLoss);
      
      // Trend zisku/ztráty
      const profitTrend = profitValues.length >= 2 
        ? profitValues[profitValues.length - 1] > profitValues[0] 
          ? 'increasing' as const
          : profitValues[profitValues.length - 1] < profitValues[0]
          ? 'decreasing' as const
          : 'stable' as const
        : 'stable' as const;

      // Růst hodnoty (porovnání s předchozím měsícem)
      const valueGrowth = dataPoints.length >= 2 
        ? ((dataPoints[dataPoints.length - 1].totalCurrentValue - 
            dataPoints[dataPoints.length - 2].totalCurrentValue) /
           Math.max(dataPoints[dataPoints.length - 2].totalCurrentValue, 1)) * 100
        : 0;

      return {
        profitTrend,
        valueGrowth
      };
    })();

    // Aggregation logic based on viewLevel
    let aggregatedData: AggregatedDataPoint[] = [];
    if (viewLevel === 'monthly') {
      aggregatedData = aggregateDataByMonth(dataPoints);
    } else if (viewLevel === 'daily') {
      aggregatedData = aggregateDataByDay(dataPoints, selectedMonth);
    }

    return {
      dailyData: dataPoints,
      chartData: aggregatedData,
      currentMetrics,
      trends,
      isLoadingPriceHistory,
      priceHistoryError
    };

  }, [loans, currentBtcPrice, getPriceForDate, isLoadingPriceHistory, priceHistoryError, startDate, viewLevel, selectedMonth]);
}; 