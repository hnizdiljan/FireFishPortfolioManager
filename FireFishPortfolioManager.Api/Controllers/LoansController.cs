using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FireFishPortfolioManager.Data;

namespace FireFishPortfolioManager.Api.Controllers
{
    /// <summary>
    /// Controller pro základní CRUD operace s půjčkami.
    /// Refaktorováno podle SOLID principů - zaměřuje se pouze na základní správu půjček.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class LoansController : ControllerBase
    {
        private readonly LoanService _loanService;
        private readonly UserService _userService;
        private readonly ILoanMappingService _mappingService;
        private readonly ILogger<LoansController> _logger;

        public LoansController(
            LoanService loanService,
            UserService userService,
            ILoanMappingService mappingService,
            ILogger<LoansController> logger)
        {
            _loanService = loanService ?? throw new ArgumentNullException(nameof(loanService));
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _mappingService = mappingService ?? throw new ArgumentNullException(nameof(mappingService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Získá všechny půjčky pro aktuálního uživatele
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LoanDto>>> GetLoans()
        {
            try
            {
                var user = await _userService.GetOrCreateUserAsync(User);
                var loans = await _loanService.GetUserLoansAsync(user.Id);
                var loanDtos = _mappingService.MapToDto(loans);
                return Ok(loanDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving loans for user");
                return StatusCode(500, "An error occurred while retrieving loans.");
            }
        }

        /// <summary>
        /// Získá konkrétní půjčku podle ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<LoanDto>> GetLoan(int id)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var loan = await _loanService.GetLoanAsync(user.Id, id);
                var loanDto = _mappingService.MapToDto(loan);
                return Ok(loanDto);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving loan {LoanId} for user", id);
                return StatusCode(500, "An error occurred while retrieving the loan.");
            }
        }

        /// <summary>
        /// Vytvoří novou půjčku
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<LoanDto>> CreateLoan([FromBody] Loan loan)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var createdLoan = await _loanService.AddLoanAsync(user.Id, loan);
                var loanDto = _mappingService.MapToDto(createdLoan);
                return CreatedAtAction(nameof(GetLoan), new { id = createdLoan.Id }, loanDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating loan for user");
                return StatusCode(500, "An error occurred while creating the loan.");
            }
        }

        /// <summary>
        /// Aktualizuje existující půjčku
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<LoanDto>> UpdateLoan(int id, [FromBody] Loan loan)
        {
            if (id != loan.Id || !ModelState.IsValid)
            {
                return BadRequest("Loan ID mismatch or invalid model state.");
            }

            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var updatedLoan = await _loanService.UpdateLoanAsync(user.Id, id, loan);
                var loanDto = _mappingService.MapToDto(updatedLoan);
                return Ok(loanDto);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating loan {LoanId} for user", id);
                return StatusCode(500, "An error occurred while updating the loan.");
            }
        }

        /// <summary>
        /// Smaže půjčku
        /// </summary>
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting loan {LoanId} for user", id);
                return StatusCode(500, "An error occurred while deleting the loan.");
            }
                }
    }
}
