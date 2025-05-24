using FireFishPortfolioManager.Data;
using FireFishPortfolioManager.Api.Models;

namespace FireFishPortfolioManager.Api.Services
{
    /// <summary>
    /// Interface pro mapování mezi Loan entitou a LoanDto.
    /// Implementuje Single Responsibility Principle pro mapping logiku.
    /// </summary>
    public interface ILoanMappingService
    {
        /// <summary>
        /// Mapuje Loan entitu na LoanDto
        /// </summary>
        /// <param name="loan">Loan entita</param>
        /// <returns>LoanDto</returns>
        LoanDto MapToDto(Loan loan);
        
        /// <summary>
        /// Mapuje kolekci Loan entit na kolekci LoanDto
        /// </summary>
        /// <param name="loans">Kolekce Loan entit</param>
        /// <returns>Kolekce LoanDto</returns>
        IEnumerable<LoanDto> MapToDto(IEnumerable<Loan> loans);
    }
} 