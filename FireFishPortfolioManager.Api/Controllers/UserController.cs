using FireFishPortfolioManager.Api.Models;
using FireFishPortfolioManager.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;
using System.Threading.Tasks;
using System;

namespace FireFishPortfolioManager.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly CoinmateService _coinmateService;

        public UserController(UserService userService, CoinmateService coinmateService)
        {
            _userService = userService;
            _coinmateService = coinmateService;
        }

        // GET: api/user
        [HttpGet]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var user = await _userService.GetOrCreateUserAsync(User);
            
            // Map User entity to UserDto
            var userDto = new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                AllocatedBtc = user.AllocatedBtc,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                DrawdownFromAth = user.DrawdownFromAth,
                LtvPercent = user.LtvPercent,
                AbsoluteLiquidationPrice = user.AbsoluteLiquidationPrice
            };

            return Ok(userDto);
        }

        // PUT: api/user/settings
        [HttpPut("settings")]
        public async Task<ActionResult<UserDto>> UpdateSettings([FromBody] UserSettingsUpdateModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetOrCreateUserAsync(User);
            
            // Get current BTC price for max loan calculation
            // Assuming CoinmateService now gets credentials from configuration
            var currentBtcPrice = await _coinmateService.GetCurrentBtcPriceCzkAsync(); 
            
            var allocatedBtc = model.AllocatedBtc;
            var drawdownFromAth = Math.Round(model.DrawdownFromAth, 0);
            var absoluteLiquidationPrice = Math.Round(model.AbsoluteLiquidationPrice, 0);
            var ltvPercent = Math.Round(model.LtvPercent, 0);

            var updatedUser = await _userService.UpdateUserSettingsAsync(
                user.Id, 
                allocatedBtc, 
                drawdownFromAth,
                absoluteLiquidationPrice,
                ltvPercent,
                currentBtcPrice);
                
            // Dle potřeby dopočítej MaxLoanAmount a TargetLtv pro výstup
            var userDto = new UserDto
            {
                Id = updatedUser.Id,
                Name = updatedUser.Name,
                Email = updatedUser.Email,
                AllocatedBtc = updatedUser.AllocatedBtc,
                CreatedAt = updatedUser.CreatedAt,
                LastLoginAt = updatedUser.LastLoginAt,
                DrawdownFromAth = updatedUser.DrawdownFromAth,
                LtvPercent = updatedUser.LtvPercent,
                AbsoluteLiquidationPrice = updatedUser.AbsoluteLiquidationPrice
            };

            return Ok(userDto);
        }

        // PUT: api/user/coinmate-credentials
        [HttpPut("coinmate-credentials")]
        public async Task<IActionResult> UpdateCoinmateCredentials([FromBody] CoinmateCredentialsModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userService.GetOrCreateUserAsync(User);
            await _userService.UpdateCoinmateCredentialsAsync(user.Id, model.ApiKey, model.ApiSecret);
            
            // Return NoContent on success, no need to return the secret
            return NoContent(); 
        }
        
        // GET: api/user/btc-price
        [HttpGet("btc-price")]
        public async Task<ActionResult<BtcPriceModel>> GetBtcPrice()
        {
            // Assuming CoinmateService now gets credentials from configuration
            var price = await _coinmateService.GetCurrentBtcPriceCzkAsync();
            return Ok(new BtcPriceModel { PriceCzk = price });
        }
    }

    public class UserSettingsUpdateModel
    {
        public decimal AllocatedBtc { get; set; }
        public decimal DrawdownFromAth { get; set; }
        public decimal AbsoluteLiquidationPrice { get; set; }
        public decimal LtvPercent { get; set; }
    }

    // Model for receiving Coinmate credentials
    public class CoinmateCredentialsModel
    {
        public string ApiKey { get; set; }
        public string ApiSecret { get; set; }
    }

    public class BtcPriceModel
    {
        public decimal PriceCzk { get; set; }
    }
}
