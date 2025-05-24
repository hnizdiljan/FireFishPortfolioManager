# Jednoduchý test SmartDistribution
$apiUrl = "https://localhost:7136/api/diagnostics/test-smart-distribution"

$testData = @{
    RepaymentCzk = 104512.33
    TargetProfitPercent = 0
    BtcProfitRatioPercent = 100
    OrderCount = 4
    TotalAvailableBtc = 0.05113282
    CurrentBtcPrice = 1980000
}

Write-Host "=== TEST SMARTDISTRIBUTION ===" -ForegroundColor Green
Write-Host "Testovaná data:" -ForegroundColor Yellow
$testData | Format-Table -AutoSize

try {
    # Ignorování SSL certifikátů
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

    $jsonBody = $testData | ConvertTo-Json
    Write-Host "JSON požadavek:" -ForegroundColor Cyan
    Write-Host $jsonBody

    $headers = @{
        'Content-Type' = 'application/json'
    }

    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $jsonBody -Headers $headers

    Write-Host "`n=== VÝSLEDEK ===" -ForegroundColor Green
    Write-Host "Očekáváno: $($response.ExpectedSellOrdersTotal) CZK" -ForegroundColor Yellow
    Write-Host "Skutečnost: $($response.ActualSellOrdersTotal) CZK" -ForegroundColor Yellow
    Write-Host "Rozdíl: $($response.Difference) CZK ($($response.PercentDifference)%)" -ForegroundColor $(if ($response.Difference -gt 1000) { "Red" } else { "Green" })
    
    Write-Host "`n=== DETAILY ===" -ForegroundColor Green
    Write-Host "Cílová průměrná cena: $($response.TargetAvgPrice) CZK/BTC"
    Write-Host "Skutečná průměrná cena: $($response.ActualAvgPrice) CZK/BTC"
    Write-Host "Úprava ceny aplikována: $($response.PriceAdjustmentApplied)"
    Write-Host "BTC pro sell ordery: $($response.BtcForSellOrders)"
    Write-Host "Zbývající BTC: $($response.RemainingBtc)"

    Write-Host "`n=== SELL ORDERY ===" -ForegroundColor Green
    $response.Orders | ForEach-Object {
        Write-Host "Order $($_.OrderIndex): $($_.BtcAmount) BTC @ $($_.PricePerBtc) CZK = $($_.TotalCzk) CZK"
    }

} catch {
    Write-Host "Chyba při volání API:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nStiskněte libovolnou klávesu pro pokračování..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 