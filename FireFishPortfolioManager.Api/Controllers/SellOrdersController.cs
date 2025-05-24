using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Api.Controllers
{
    /// <summary>
    /// Controller pro správu sell orderů.
    /// Implementuje Single Responsibility Principle - zaměřuje se pouze na sell ordery.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/sellorders")]
    public class SellOrdersController : ControllerBase
    {
        private readonly LoanService _loanService;
        private readonly UserService _userService;
        private readonly ILogger<SellOrdersController> _logger;

        public SellOrdersController(
            LoanService loanService,
            UserService userService,
            ILogger<SellOrdersController> logger)
        {
            _loanService = loanService ?? throw new ArgumentNullException(nameof(loanService));
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Získá všechny sell ordery pro aktuálního uživatele
        /// </summary>
        [HttpGet("all")]
        public async Task<ActionResult<List<SellOrderAggDto>>> GetAllSellOrders(
            [FromQuery] SellOrderStatus? status = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string sortDir = "asc")
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            var loans = await _loanService.GetUserLoansAsync(user.Id);
            
            var allOrders = BuildSellOrderAggDtos(loans);

            if (status.HasValue)
            {
                allOrders = allOrders.Where(o => o.Status == status.Value);
            }

            allOrders = ApplySorting(allOrders, sortBy, sortDir);

            return Ok(allOrders.ToList());
        }

        /// <summary>
        /// Získá sell ordery pro konkrétní půjčku
        /// </summary>
        [HttpGet("loan/{loanId}")]
        public async Task<ActionResult<List<SellOrderBasicDto>>> GetSellOrdersForLoan(int loanId)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var loan = await _loanService.GetLoanAsync(user.Id, loanId);
                if (loan?.SellOrders == null)
                {
                    return Ok(new List<SellOrderBasicDto>());
                }

                var sellOrderDtos = loan.SellOrders.Select(MapToSellOrderBasicDto).ToList();
                return Ok(sellOrderDtos);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Loan with id {loanId} not found for the user.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving sell orders for loan {LoanId}", loanId);
                return StatusCode(500, "An error occurred while retrieving sell orders.");
            }
        }

        /// <summary>
        /// Otevře sell order na Coinmate
        /// </summary>
        [HttpPost("{orderId}/open")]
        public async Task<IActionResult> OpenSellOrder(int orderId)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var result = await _loanService.OpenSellOrderAsync(user.Id, orderId);
                if (!result)
                {
                    return BadRequest("Order could not be opened on Coinmate.");
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error opening sell order {OrderId}", orderId);
                return StatusCode(500, "An error occurred while opening the sell order.");
            }
        }

        /// <summary>
        /// Zruší sell order na Coinmate
        /// </summary>
        [HttpPost("{orderId}/cancel")]
        public async Task<IActionResult> CancelSellOrder(int orderId)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var result = await _loanService.CancelSellOrderAsync(user.Id, orderId);
                if (!result)
                {
                    return BadRequest("Order could not be cancelled on Coinmate.");
                }
                
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling sell order {OrderId}", orderId);
                return StatusCode(500, "An error occurred while cancelling the sell order.");
            }
        }

        /// <summary>
        /// Synchronizuje sell ordery s Coinmate
        /// </summary>
        [HttpPost("sync")]
        public async Task<IActionResult> SyncSellOrders()
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                await _loanService.SyncSellOrdersAsync(user.Id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing sell orders for user {UserId}", user.Id);
                return StatusCode(500, "An error occurred while syncing sell orders.");
            }
        }

        private IEnumerable<SellOrderAggDto> BuildSellOrderAggDtos(IEnumerable<Loan> loans)
        {
            return loans
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
        }

        private static IEnumerable<SellOrderAggDto> ApplySorting(
            IEnumerable<SellOrderAggDto> orders,
            string? sortBy,
            string sortDir)
        {
            if (!string.IsNullOrEmpty(sortBy))
            {
                var isDescending = sortDir.ToLower() == "desc";
                
                switch (sortBy.ToLower())
                {
                    case "createdat":
                        return isDescending 
                            ? orders.OrderByDescending(o => o.CreatedAt)
                            : orders.OrderBy(o => o.CreatedAt);
                    case "priceperbtc":
                        return isDescending 
                            ? orders.OrderByDescending(o => o.PricePerBtc)
                            : orders.OrderBy(o => o.PricePerBtc);
                    case "btcamount":
                        return isDescending 
                            ? orders.OrderByDescending(o => o.BtcAmount)
                            : orders.OrderBy(o => o.BtcAmount);
                    case "totalczk":
                        return isDescending 
                            ? orders.OrderByDescending(o => o.TotalCzk)
                            : orders.OrderBy(o => o.TotalCzk);
                    default:
                        // Default sort: by PricePerBtc ascending if unknown sortBy
                        return orders.OrderBy(o => o.PricePerBtc);
                }
            }
            
            // Default sort: by PricePerBtc ascending
            return orders.OrderBy(o => o.PricePerBtc);
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
    }
} 