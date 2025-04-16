import React from 'react';
import { PortfolioSummary } from '../../types/portfolioTypes';
import PortfolioChart from '../Statistics/PortfolioChart';
import { useStatisticsService } from '../../services/statisticsService';

// Make sure this file is treated as a module
export {};

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subValue, className }) => (
  <div className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${className || ''}`}>
    <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
    <div className="text-2xl font-bold">{value}</div>
    {subValue && (
      <div className="text-sm text-gray-500 mt-2">
        {subValue}
      </div>
    )}
  </div>
);

interface SummaryRowProps {
  summary: PortfolioSummary;
}

export const PortfolioSummaryRow: React.FC<SummaryRowProps> = ({ summary }) => {
  // Format values with localization
  const formatCzk = (value?: number) => (typeof value === 'number' && !isNaN(value)) ? `${value.toLocaleString()} CZK` : 'N/A';
  const formatBtc = (value: number) => `${value} BTC`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(0)}%`;
  
  const { chartData, isLoading, error } = useStatisticsService();
  
  return (
    <>
      {/* Portfolio Performance graf - full width */}
      <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow flex flex-col items-center justify-center mb-8 w-full">
        <div className="text-sm font-medium text-gray-500 mb-1">Portfolio Performance</div>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-gray-400">Načítání grafu…</div>
        ) : error ? (
          <div className="h-32 flex items-center justify-center text-red-400">Chyba při načítání dat</div>
        ) : chartData ? (
          <div className="w-full" style={{ minHeight: 300 }}>
            {/* TODO: Hierarchická osa X (rok/měsíc/den) - zde lze později rozšířit */}
            <PortfolioChart data={chartData} />
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400">Žádná data pro graf</div>
        )}
      </div>
      {/* Ostatní karty v gridu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard 
          title="BTC Allocation" 
          value={formatBtc(summary.allocatedBtc)}
          subValue={formatCzk(summary.allocatedBtc * summary.currentBtcPriceCzk)}
        />
        <SummaryCard 
          title="LTV (%)" 
          value={typeof summary.ltvPercent === 'number' ? `${summary.ltvPercent.toFixed(0)}%` : 'N/A'}
          subValue={`Max Loan: ${formatCzk(summary.maxLoanAmount)}`}
        />
        <SummaryCard 
          title="Active Loans" 
          value={summary.activeLoanCount.toString()}
          subValue={formatCzk(summary.totalLoanAmountCzk)}
        />
      </div>
    </>
  );
};
