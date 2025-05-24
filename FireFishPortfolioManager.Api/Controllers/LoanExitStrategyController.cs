using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace FireFishPortfolioManager.Api.Controllers
{
    /// <summary>
    /// Controller pro správu exit strategií.
    /// Implementuje Single Responsibility Principle - zaměřuje se pouze na exit strategie.
    /// </summary>
    [ApiController]
    [Authorize]
    [Route("api/loans/{loanId}/exitstrategy")]
    public class LoanExitStrategyController : ControllerBase
    {
        private readonly LoanService _loanService;
        private readonly UserService _userService;
        private readonly ExitStrategyService _exitStrategyService;
        private readonly ILogger<LoanExitStrategyController> _logger;

        public LoanExitStrategyController(
            LoanService loanService,
            UserService userService,
            ExitStrategyService exitStrategyService,
            ILogger<LoanExitStrategyController> logger)
        {
            _loanService = loanService ?? throw new ArgumentNullException(nameof(loanService));
            _userService = userService ?? throw new ArgumentNullException(nameof(userService));
            _exitStrategyService = exitStrategyService ?? throw new ArgumentNullException(nameof(exitStrategyService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Získá exit strategii pro půjčku
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ExitStrategyBase>> GetExitStrategy(int loanId)
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var loan = await _loanService.GetLoanAsync(user.Id, loanId);
                
                _logger.LogDebug("GetExitStrategy for loan {LoanId}: StrategyJson = '{StrategyJson}'", 
                    loanId, loan.StrategyJson ?? "(null)");

                if (string.IsNullOrEmpty(loan.StrategyJson))
                {
                    _logger.LogDebug("GetExitStrategy for loan {LoanId}: No strategy found, returning NoContent", loanId);
                    return NoContent();
                }

                var strategy = DeserializeStrategy(loan.StrategyJson);
                if (strategy == null)
                {
                    _logger.LogWarning("GetExitStrategy for loan {LoanId}: Strategy deserialization failed", loanId);
                    return BadRequest("Invalid strategy JSON format");
                }

                _logger.LogDebug("GetExitStrategy for loan {LoanId}: Successfully deserialized strategy of type {StrategyType}", 
                    loanId, strategy.GetType().Name);
                
                return Ok(strategy);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "GetExitStrategy for loan {LoanId}: JSON deserialization failed", loanId);
                return BadRequest("Invalid strategy JSON format");
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("GetExitStrategy for loan {LoanId}: Loan not found", loanId);
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting exit strategy for loan {LoanId}", loanId);
                return StatusCode(500, "An error occurred while retrieving the exit strategy.");
            }
        }

        /// <summary>
        /// Nastaví exit strategii pro půjčku
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> SetExitStrategy(int loanId, [FromBody] ExitStrategyBase strategy)
        {
            if (strategy == null)
            {
                return BadRequest("Strategy cannot be null.");
            }

            var user = await _userService.GetOrCreateUserAsync(User);
            
            try
            {
                var loan = await _loanService.GetLoanAsync(user.Id, loanId);
                
                // Validace strategie pomocí refaktorované služby
                if (!_exitStrategyService.ValidateStrategy(strategy, out string? validationError))
                {
                    _logger.LogWarning("SetExitStrategy for loan {LoanId}: Strategy validation failed: {Error}", 
                        loanId, validationError);
                    return BadRequest(validationError ?? "Strategie není validní.");
                }

                var strategyJson = SerializeStrategy(strategy);
                loan.StrategyJson = strategyJson;
                
                await _loanService.UpdateLoanAsync(user.Id, loanId, loan);
                
                _logger.LogInformation("SetExitStrategy for loan {LoanId}: Strategy successfully updated to type {StrategyType}", 
                    loanId, strategy.Type);
                
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                _logger.LogWarning("SetExitStrategy for loan {LoanId}: Loan not found", loanId);
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error setting exit strategy for loan {LoanId}", loanId);
                return StatusCode(500, "An error occurred while setting the exit strategy.");
            }
        }

        private ExitStrategyBase? DeserializeStrategy(string strategyJson)
        {
            try
            {
                return JsonConvert.DeserializeObject<ExitStrategyBase>(strategyJson, new JsonSerializerSettings
                {
                    TypeNameHandling = TypeNameHandling.Auto
                });
            }
            catch (JsonException)
            {
                return null;
            }
        }

        private string SerializeStrategy(ExitStrategyBase strategy)
        {
            return JsonConvert.SerializeObject(strategy, new JsonSerializerSettings
            {
                TypeNameHandling = TypeNameHandling.Auto
            });
        }
    }
} 