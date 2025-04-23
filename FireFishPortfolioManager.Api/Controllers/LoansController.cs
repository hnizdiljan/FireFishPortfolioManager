using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json;
using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class LoansController : ControllerBase
    {
        private readonly LoanService _loanService;
        private readonly UserService _userService;
        private readonly ExitStrategyService _exitStrategyService;

        public LoansController(LoanService loanService, UserService userService, ExitStrategyService exitStrategyService)
        {
            _loanService = loanService;
            _userService = userService;
            _exitStrategyService = exitStrategyService;
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
                return NotFound(string.Empty);
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
                return NotFound(string.Empty);
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
                return NotFound(string.Empty);
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
                return NotFound(string.Empty);
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
                return NotFound(string.Empty);
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // GET: api/loans/{id}/exitstrategy
        [HttpGet("{id}/exitstrategy")]
        public async Task<ActionResult<ExitStrategyBase>> GetExitStrategy(int id)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            try
            {
                var loan = await _loanService.GetLoanAsync(user.Id, id);
                if (string.IsNullOrEmpty(loan.StrategyJson))
                    return NoContent();
                var strategy = JsonConvert.DeserializeObject<ExitStrategyBase>(loan.StrategyJson, new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.Auto });
                return Ok(strategy);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(string.Empty);
            }
        }

        // PUT: api/loans/{id}/exitstrategy
        [HttpPut("{id}/exitstrategy")]
        public async Task<IActionResult> SetExitStrategy(int id, [FromBody] ExitStrategyBase strategy)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            try
            {
                var loan = await _loanService.GetLoanAsync(user.Id, id);
                var strategyJson = JsonConvert.SerializeObject(strategy, new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.Auto });
                // Validace Custom Ladder strategie
                if (strategy is CustomLadderExitStrategy custom)
                {
                    var sum = custom.Orders?.Sum(o => o.PercentToSell) ?? 0m;
                    if (sum > 100m)
                    {
                        return BadRequest($"Celkový součet procent v Custom Ladder strategii nesmí přesáhnout 100 % (aktuálně {sum} %).");
                    }
                }
                loan.StrategyJson = strategyJson;
                await _loanService.UpdateLoanAsync(user.Id, id, loan);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound(string.Empty);
            }
        }

        // GET: api/loans/sellorders/all
        [HttpGet("sellorders/all")]
        public async Task<ActionResult<List<SellOrderAggDto>>> GetAllSellOrders([FromQuery] SellOrderStatus? status = null, [FromQuery] string? sortBy = null, [FromQuery] string sortDir = "asc")
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            var loans = await _loanService.GetUserLoansAsync(user.Id);
            var allOrders = loans
                .Where(loan => loan.Status == LoanStatus.Active)
                .SelectMany(loan => loan.SellOrders.Select(order => new SellOrderAggDto
                {
                    Id = order.Id,
                    LoanId = order.LoanId,
                    CoinmateOrderId = order.CoinmateOrderId,
                    BtcAmount = order.BtcAmount,
                    PricePerBtc = order.PricePerBtc,
                    TotalCzk = order.TotalCzk,
                    Status = order.Status,
                    CreatedAt = order.CreatedAt,
                    CompletedAt = order.CompletedAt,
                    LoanReference = new LoanReferenceDto
                    {
                        Id = loan.Id,
                        LoanId = loan.LoanId,
                        LoanAmountCzk = loan.LoanAmountCzk,
                        RepaymentDate = loan.RepaymentDate
                    }
                }));

            if (status.HasValue)
            {
                allOrders = allOrders.Where(o => o.Status == status.Value);
            }

            // Default sort: by PricePerBtc ascending
            if (!string.IsNullOrEmpty(sortBy))
            {
                if (sortBy.ToLower() == "createdat")
                {
                    allOrders = sortDir.ToLower() == "desc"
                        ? allOrders.OrderByDescending(o => o.CreatedAt)
                        : allOrders.OrderBy(o => o.CreatedAt);
                }
                // Další možnosti řazení lze přidat zde
            }
            else
            {
                allOrders = allOrders.OrderBy(o => o.PricePerBtc);
            }

            return Ok(allOrders.ToList());
        }

        // POST: api/loans/sellorders/{orderId}/open
        [HttpPost("sellorders/{orderId}/open")]
        public async Task<IActionResult> OpenSellOrder(int orderId)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            var result = await _loanService.OpenSellOrderAsync(user.Id, orderId);
            if (!result)
                return BadRequest("Order could not be opened on Coinmate.");
            return NoContent();
        }

        // POST: api/loans/sellorders/{orderId}/cancel
        [HttpPost("sellorders/{orderId}/cancel")]
        public async Task<IActionResult> CancelSellOrder(int orderId)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            var result = await _loanService.CancelSellOrderAsync(user.Id, orderId);
            if (!result)
                return BadRequest("Order could not be cancelled on Coinmate.");
            return NoContent();
        }

        // POST: api/loans/sellorders/sync
        [HttpPost("sellorders/sync")]
        public async Task<IActionResult> SyncSellOrders()
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            await _loanService.SyncSellOrdersAsync(user.Id);
            return NoContent();
        }

        private LoanDto MapToDto(Loan loan)
        {
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

                CreatedAt = loan.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                UpdatedAt = loan.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };
        }
    }
}
