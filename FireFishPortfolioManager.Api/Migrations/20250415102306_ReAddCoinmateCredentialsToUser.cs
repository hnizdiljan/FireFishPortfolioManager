using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FireFishPortfolioManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReAddCoinmateCredentialsToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoinmateApiKey",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoinmateApiSecret",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoinmateApiKey",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CoinmateApiSecret",
                table: "Users");
        }
    }
}
