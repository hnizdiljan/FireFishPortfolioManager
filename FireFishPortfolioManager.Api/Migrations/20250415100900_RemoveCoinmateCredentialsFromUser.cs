using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FireFishPortfolioManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCoinmateCredentialsFromUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoinmateApiKey",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CoinmateApiSecret",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoinmateApiKey",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CoinmateApiSecret",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
