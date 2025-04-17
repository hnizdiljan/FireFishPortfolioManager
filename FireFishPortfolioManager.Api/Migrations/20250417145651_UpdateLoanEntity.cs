using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FireFishPortfolioManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLoanEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WithdrawalWalletAddress",
                table: "Loans");

            migrationBuilder.RenameColumn(
                name: "TargetProfitPercentage",
                table: "Loans",
                newName: "FireFishFeePercent");

            migrationBuilder.RenameColumn(
                name: "MinSellOrderSize",
                table: "Loans",
                newName: "BitcoinProfitRatio");

            migrationBuilder.RenameColumn(
                name: "MaxSellOrders",
                table: "Loans",
                newName: "LoanPeriodMonths");

            migrationBuilder.AlterColumn<decimal>(
                name: "AllocatedBtc",
                table: "Users",
                type: "decimal(18,8)",
                precision: 18,
                scale: 8,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LoanPeriodMonths",
                table: "Loans",
                newName: "MaxSellOrders");

            migrationBuilder.RenameColumn(
                name: "FireFishFeePercent",
                table: "Loans",
                newName: "TargetProfitPercentage");

            migrationBuilder.RenameColumn(
                name: "BitcoinProfitRatio",
                table: "Loans",
                newName: "MinSellOrderSize");

            migrationBuilder.AlterColumn<decimal>(
                name: "AllocatedBtc",
                table: "Users",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,8)",
                oldPrecision: 18,
                oldScale: 8);

            migrationBuilder.AddColumn<string>(
                name: "WithdrawalWalletAddress",
                table: "Loans",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
