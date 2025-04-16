using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FireFishPortfolioManager.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class LoansController : ControllerBase
    {
        private readonly LoanService _loanService;
        private readonly UserService _userService;

        public LoansController(LoanService loanService, UserService userService)
        {
            _loanService = loanService;
            _userService = userService;
        }

        // GET: api/loans
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LoanDto>>> GetLoans()
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            var loans = await _loanService.GetUserLoansAsync(user.Id);
            var loanDtos = loans.Select(MapToDto).ToList();
            return Ok(loanDtos);
        }

        // GET: api/loans/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<LoanDto>> GetLoan(int id)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            try
            {
                var loan = await _loanService.GetLoanAsync(user.Id, id);
                return Ok(MapToDto(loan));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        // POST: api/loans
        [HttpPost]
        public async Task<ActionResult<LoanDto>> CreateLoan([FromBody] Loan loan)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetOrCreateUserAsync(User);
            var createdLoan = await _loanService.AddLoanAsync(user.Id, loan);
            return CreatedAtAction(nameof(GetLoan), new { id = createdLoan.Id }, MapToDto(createdLoan));
        }

        // PUT: api/loans/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<LoanDto>> UpdateLoan(int id, [FromBody] Loan loan)
        {
            if (id != loan.Id || !ModelState.IsValid)
            {
                return BadRequest();
            }

            var user = await _userService.GetOrCreateUserAsync(User);
            try
            {
                var updatedLoan = await _loanService.UpdateLoanAsync(user.Id, id, loan);
                return Ok(MapToDto(updatedLoan));
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        // DELETE: api/loans/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLoan(int id)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            try
            {
                await _loanService.DeleteLoanAsync(user.Id, id);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        // POST: api/loans/{id}/sellstrategy
        [HttpPost("{id}/sellstrategy")]
        public async Task<ActionResult<Models.SellStrategy>> GenerateSellStrategy(int id)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            try
            {
                var strategy = await _loanService.GenerateSellStrategyAsync(user.Id, id);
                return Ok(strategy);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        // POST: api/loans/{id}/execute
        [HttpPost("{id}/execute")]
        public async Task<ActionResult<List<SellOrder>>> ExecuteSellStrategy(int id)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            try
            {
                var orders = await _loanService.ExecuteSellStrategyAsync(user.Id, id);
                return Ok(orders);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private LoanDto MapToDto(Loan loan)
        {
            return new LoanDto
            {
                Id = loan.Id,
                LoanId = loan.LoanId,
                LoanDate = loan.LoanDate.ToString("yyyy-MM-dd"),
                RepaymentDate = loan.RepaymentDate.ToString("yyyy-MM-dd"),
                Status = (int)loan.Status,
                LoanAmountCzk = loan.LoanAmountCzk,
                InterestRate = loan.InterestRate,
                RepaymentAmountCzk = loan.RepaymentAmountCzk,
                FeesBtc = loan.FeesBtc,
                TransactionFeesBtc = loan.TransactionFeesBtc,
                CollateralBtc = loan.CollateralBtc,
                TotalSentBtc = loan.TotalSentBtc,
                PurchasedBtc = loan.PurchasedBtc,
                CurrentBtcPrice = loan.CurrentBtcPrice,
                RepaymentWithFeesBtc = loan.RepaymentWithFeesBtc,
                TargetProfitPercentage = loan.TargetProfitPercentage,
                MaxSellOrders = loan.MaxSellOrders,
                MinSellOrderSize = loan.MinSellOrderSize,
                TotalTargetProfitPercentage = loan.TotalTargetProfitPercentage,
                WithdrawalWalletAddress = loan.WithdrawalWalletAddress,
                CreatedAt = loan.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                UpdatedAt = loan.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };
        }
    }
}
