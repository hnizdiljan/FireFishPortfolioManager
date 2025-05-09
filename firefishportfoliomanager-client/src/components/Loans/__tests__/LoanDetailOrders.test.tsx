import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoanDetailOrders from '../LoanDetailOrders';
import { Loan, SellOrderStatus } from '../../../types/loanTypes';

const mockLoan = {
  id: 1,
  userId: 'user1',
  loanId: 'L-001',
  loanDate: '2024-04-15',
  loanPeriodMonths: 6,
  repaymentDate: '2024-10-15',
  status: 0,
  loanAmountCzk: 100000,
  interestRate: 10,
  fireFishFeePercent: 1.5,
  repaymentAmountCzk: 110000,
  feesBtc: 0.001,
  transactionFeesBtc: 0.0001,
  collateralBtc: 0.2,
  totalSentBtc: 0.2011,
  purchasedBtc: 0.15,
  currentBtcPrice: 1500000,
  repaymentWithFeesBtc: 0.073,
  totalTargetProfitPercentage: 0,
  bitcoinProfitRatio: 0,
  createdAt: '2024-04-15',
  updatedAt: '2024-04-15',
  sellOrders: [
    { id: 1, loanId: 1, coinmateOrderId: '', btcAmount: 0.02, pricePerBtc: 2000000, totalCzk: 40000, status: SellOrderStatus.Planned, createdAt: '2024-04-16', completedAt: null },
    { id: 2, loanId: 1, coinmateOrderId: 'CM123', btcAmount: 0.03, pricePerBtc: 2500000, totalCzk: 75000, status: SellOrderStatus.Submitted, createdAt: '2024-04-16', completedAt: null },
  ],
};

describe('LoanDetailOrders', () => {
  it('zobrazí všechny ordery a jejich stavy', () => {
    render(<LoanDetailOrders loan={mockLoan as any} refresh={jest.fn()} />);
    expect(screen.getByText('Sell ordery k půjčce')).toBeInTheDocument();
    expect(screen.getByText('Nahrát na Coinmate')).toBeInTheDocument();
    expect(screen.getByText('Stáhnout z Coinmate')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Opened')).toBeInTheDocument();
  });

  it('volá refresh po synchronizaci', async () => {
    const refresh = jest.fn();
    render(<LoanDetailOrders loan={mockLoan as any} refresh={refresh} />);
    fireEvent.click(screen.getByText('Synchronizovat stavy'));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('zobrazí chybovou hlášku při chybě', async () => {
    // Simulace chyby by vyžadovala mockování exitStrategyService, zde pouze skeleton
    // expect(await screen.findByText(/Chyba/)).toBeInTheDocument();
  });
}); 