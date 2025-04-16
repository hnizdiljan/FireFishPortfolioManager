using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FireFishPortfolioManager.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AllocatedBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TargetLtv = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MaxLoanAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DrawdownFromAth = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CoinmateApiKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoinmateApiSecret = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Loans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoanId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LoanDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RepaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    LoanAmountCzk = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    InterestRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RepaymentAmountCzk = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FeesBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TransactionFeesBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CollateralBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalSentBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PurchasedBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CurrentBtcPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RepaymentWithFeesBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TargetProfitPercentage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MaxSellOrders = table.Column<int>(type: "int", nullable: false),
                    MinSellOrderSize = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalTargetProfitPercentage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WithdrawalWalletAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Loans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Loans_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SellOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    LoanId = table.Column<int>(type: "int", nullable: false),
                    CoinmateOrderId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BtcAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PricePerBtc = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalCzk = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SellOrders_Loans_LoanId",
                        column: x => x.LoanId,
                        principalTable: "Loans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Loans_UserId",
                table: "Loans",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SellOrders_LoanId",
                table: "SellOrders",
                column: "LoanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SellOrders");

            migrationBuilder.DropTable(
                name: "Loans");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
