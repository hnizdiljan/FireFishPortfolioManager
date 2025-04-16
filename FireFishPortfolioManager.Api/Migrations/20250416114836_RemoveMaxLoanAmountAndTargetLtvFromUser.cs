using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FireFishPortfolioManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMaxLoanAmountAndTargetLtvFromUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxLoanAmount",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TargetLtv",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MaxLoanAmount",
                table: "Users",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TargetLtv",
                table: "Users",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
