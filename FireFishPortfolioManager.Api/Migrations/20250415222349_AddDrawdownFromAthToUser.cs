using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FireFishPortfolioManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDrawdownFromAthToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DrawdownFromAth",
                table: "Users",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DrawdownFromAth",
                table: "Users");
        }
    }
}
