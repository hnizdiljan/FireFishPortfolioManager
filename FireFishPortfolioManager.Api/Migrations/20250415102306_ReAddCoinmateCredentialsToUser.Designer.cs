﻿// <auto-generated />
using System;
using FireFishPortfolioManager.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace FireFishPortfolioManager.Api.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20250415102306_ReAddCoinmateCredentialsToUser")]
    partial class ReAddCoinmateCredentialsToUser
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.4")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

            modelBuilder.Entity("FireFishPortfolioManager.Api.Models.Loan", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<decimal>("CollateralBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<decimal>("CurrentBtcPrice")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("FeesBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("InterestRate")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("LoanAmountCzk")
                        .HasColumnType("decimal(18,2)");

                    b.Property<DateTime>("LoanDate")
                        .HasColumnType("datetime2");

                    b.Property<string>("LoanId")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<int>("MaxSellOrders")
                        .HasColumnType("int");

                    b.Property<decimal>("MinSellOrderSize")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("PurchasedBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("RepaymentAmountCzk")
                        .HasColumnType("decimal(18,2)");

                    b.Property<DateTime>("RepaymentDate")
                        .HasColumnType("datetime2");

                    b.Property<decimal>("RepaymentWithFeesBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<int>("Status")
                        .HasColumnType("int");

                    b.Property<decimal>("TargetProfitPercentage")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("TotalSentBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("TotalTargetProfitPercentage")
                        .HasColumnType("decimal(18,2)");

                    b.Property<decimal>("TransactionFeesBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("datetime2");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasColumnType("nvarchar(450)");

                    b.Property<string>("WithdrawalWalletAddress")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.HasKey("Id");

                    b.HasIndex("UserId");

                    b.ToTable("Loans");
                });

            modelBuilder.Entity("FireFishPortfolioManager.Api.Models.SellOrder", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("int");

                    SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));

                    b.Property<decimal>("BtcAmount")
                        .HasColumnType("decimal(18,2)");

                    b.Property<string>("CoinmateOrderId")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime?>("CompletedAt")
                        .HasColumnType("datetime2");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<int>("LoanId")
                        .HasColumnType("int");

                    b.Property<decimal>("PricePerBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<int>("Status")
                        .HasColumnType("int");

                    b.Property<decimal>("TotalCzk")
                        .HasColumnType("decimal(18,2)");

                    b.HasKey("Id");

                    b.HasIndex("LoanId");

                    b.ToTable("SellOrders");
                });

            modelBuilder.Entity("FireFishPortfolioManager.Api.Models.User", b =>
                {
                    b.Property<string>("Id")
                        .HasColumnType("nvarchar(450)");

                    b.Property<decimal>("AllocatedBtc")
                        .HasColumnType("decimal(18,2)");

                    b.Property<string>("CoinmateApiKey")
                        .HasColumnType("nvarchar(max)");

                    b.Property<string>("CoinmateApiSecret")
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("datetime2");

                    b.Property<string>("Email")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime?>("LastLoginAt")
                        .HasColumnType("datetime2");

                    b.Property<decimal>("MaxLoanAmount")
                        .HasColumnType("decimal(18,2)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<decimal>("TargetLtv")
                        .HasColumnType("decimal(18,2)");

                    b.Property<DateTime>("UpdatedAt")
                        .HasColumnType("datetime2");

                    b.HasKey("Id");

                    b.ToTable("Users");
                });

            modelBuilder.Entity("FireFishPortfolioManager.Api.Models.Loan", b =>
                {
                    b.HasOne("FireFishPortfolioManager.Api.Models.User", "User")
                        .WithMany("Loans")
                        .HasForeignKey("UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("User");
                });

            modelBuilder.Entity("FireFishPortfolioManager.Api.Models.SellOrder", b =>
                {
                    b.HasOne("FireFishPortfolioManager.Api.Models.Loan", "Loan")
                        .WithMany("SellOrders")
                        .HasForeignKey("LoanId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Loan");
                });

            modelBuilder.Entity("FireFishPortfolioManager.Api.Models.Loan", b =>
                {
                    b.Navigation("SellOrders");
                });

            modelBuilder.Entity("FireFishPortfolioManager.Api.Models.User", b =>
                {
                    b.Navigation("Loans");
                });
#pragma warning restore 612, 618
        }
    }
}
