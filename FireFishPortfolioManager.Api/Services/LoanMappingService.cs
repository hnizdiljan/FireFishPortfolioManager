using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;
using System.Linq;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Služba pro mapování mezi Loan entitou a LoanDto.
    /// Implementuje Single Responsibility Principle - zaměřuje se pouze na mapování.
    /// </summary>
    public class LoanMappingService : ILoanMappingService
    {
        private readonly ILoanCalculationService _calculationService;

        public LoanMappingService(ILoanCalculationService calculationService)
        {
            _calculationService = calculationService ?? throw new ArgumentNullException(nameof(calculationService));
        }

        public LoanDto MapToDto(Loan loan)
        {
            if (loan == null)
            {
                throw new ArgumentNullException(nameof(loan));
            }

            var potentialValueCzk = _calculationService.CalculatePotentialValueCzk(loan);
            var remainingBtcAfterStrategy = _calculationService.CalculateRemainingBtcAfterStrategy(loan);

            // Mapuj sell ordery na SellOrderBasicDto
            var sellOrderDtos = loan.SellOrders?.Select(MapToSellOrderBasicDto).ToList() ?? new List<SellOrderBasicDto>();

            return new LoanDto
            {
                Id = loan.Id,
                LoanId = loan.LoanId,
                LoanDate = loan.LoanDate.ToString("yyyy-MM-dd"),
                LoanPeriodMonths = loan.LoanPeriodMonths,
                RepaymentDate = loan.RepaymentDate.ToString("yyyy-MM-dd"),
                Status = loan.Status,
                LoanAmountCzk = loan.LoanAmountCzk,
                InterestRate = loan.InterestRate,
                RepaymentAmountCzk = loan.RepaymentAmountCzk,
                FeesBtc = loan.FeesBtc,
                TransactionFeesBtc = loan.TransactionFeesBtc,
                CollateralBtc = loan.CollateralBtc,
                TotalSentBtc = loan.TotalSentBtc,
                PurchasedBtc = loan.PurchasedBtc,
                PotentialValueCzk = potentialValueCzk,
                RemainingBtcAfterStrategy = remainingBtcAfterStrategy,
                StrategyJson = loan.StrategyJson,
                SellOrders = sellOrderDtos,
                CreatedAt = loan.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                UpdatedAt = loan.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };
        }

        private static SellOrderBasicDto MapToSellOrderBasicDto(SellOrder order)
        {
            return new SellOrderBasicDto
            {
                Id = order.Id,
                LoanId = order.LoanId,
                CoinmateOrderId = order.CoinmateOrderId,
                BtcAmount = order.BtcAmount,
                PricePerBtc = order.PricePerBtc,
                TotalCzk = order.TotalCzk,
                Status = order.Status,
                CreatedAt = order.CreatedAt,
                CompletedAt = order.CompletedAt
            };
        }

        public IEnumerable<LoanDto> MapToDto(IEnumerable<Loan> loans)
        {
            if (loans == null)
            {
                throw new ArgumentNullException(nameof(loans));
            }

            return loans.Select(MapToDto);
        }
    }
} 