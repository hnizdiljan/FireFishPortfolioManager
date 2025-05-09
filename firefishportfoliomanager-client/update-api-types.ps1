# Explicitly set SecurityProtocol to include Tls12 (and others for compatibility)
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12, [System.Net.SecurityProtocolType]::Tls11, [System.Net.SecurityProtocolType]::Tls

# --- Start: SSL/TLS Certificate Bypass for older PowerShell ---
# Store original callback
$OriginalCallback = [System.Net.ServicePointManager]::ServerCertificateValidationCallback

# Temporarily trust all certificates (Use with caution and only for trusted localhost endpoints)
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
# --- End: SSL/TLS Certificate Bypass ---

$swaggerUrl = "https://localhost:7227/swagger/v1/swagger.json"

# Get the directory where the script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$tempSwaggerFile = Join-Path $scriptDir "swagger.temp.json" # Absolute path
# Assuming this script is in the root of your 'firefishportfoliomanager-client' project
$outputTsFile = Join-Path $scriptDir "src/api-types.ts"    # Absolute path for consistency

Write-Host "Script directory: $scriptDir"
Write-Host "Temporary swagger file path: $tempSwaggerFile"
Write-Host "Output TypeScript file path: $outputTsFile"

Write-Host "Attempting to download Swagger definition from $swaggerUrl..."

$webClient = New-Object System.Net.WebClient
try {
    # Use WebClient to download the file
    $webClient.DownloadFile($swaggerUrl, $tempSwaggerFile)
    Write-Host "Swagger definition downloaded successfully to $tempSwaggerFile."
}
catch {
    Write-Error "Failed to download Swagger definition from $swaggerUrl using WebClient."
    Write-Error "Please ensure your .NET API (FireFishPortfolioManager.Api) is running and accessible at that URL."
    Write-Error ("Underlying error: " + $_.Exception.Message)
    # Restore original callback in case of download error before finally block
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $OriginalCallback
    exit 1
}
finally {
    $webClient.Dispose() # Dispose of the WebClient
}

Write-Host "Attempting to generate TypeScript types using openapi-typescript..."
Write-Host "Output will be saved to $outputTsFile"

try {
    # Run openapi-typescript
    npx openapi-typescript $tempSwaggerFile --output $outputTsFile
    Write-Host "TypeScript types generated successfully at $outputTsFile."
}
catch {
    Write-Error "Failed to generate TypeScript types using 'npx openapi-typescript'."
    Write-Error "Ensure Node.js, npm/npx are installed and 'openapi-typescript' is available (e.g., listed in your devDependencies or installable via npx)." 
    Write-Error ("Underlying error: " + $_.Exception.Message)
}
finally {
    # Clean up the temporary swagger file (this finally is for the whole script)
    if (Test-Path $tempSwaggerFile) {
        Write-Host "Cleaning up temporary file: $tempSwaggerFile..."
        Remove-Item $tempSwaggerFile
    }
    # Restore original ServerCertificateValidationCallback
    Write-Host "Restoring original SSL/TLS certificate validation callback..."
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $OriginalCallback
}

Write-Host "Script finished." 