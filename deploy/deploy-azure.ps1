# Ensure az CLI path is included in current PowerShell session
$scriptsPath = "C:\Users\LOQ\AppData\Local\Programs\Python\Python312\Scripts"
if ($env:Path -notlike "*$scriptsPath*") {
    $env:Path = "$scriptsPath;$env:Path"
}

param (
    [string]$ResourceGroupName = "rg-loadtest-capacity-study",
    [string]$Location = "eastus",
    [string]$AppServiceName = "app-capacity-study-$((Get-Random -Minimum 1000 -Maximum 9999))",
    [string]$AppServicePlanName = "asp-capacity-study",
    [string]$Sku = "S1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Azure Capacity Study Automated Deployment" -ForegroundColor Cyan
Write-Host " Resource Group: $ResourceGroupName" -ForegroundColor Cyan
Write-Host " Location:       $Location" -ForegroundColor Cyan
Write-Host " App Service:    $AppServiceName" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Azure Login
try {
    $account = az account show --output json | ConvertFrom-Json
    Write-Host "[OK] Logged in to Azure as: $($account.user.name) (Subscription: $($account.name))" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] You are not logged into Azure CLI." -ForegroundColor Red
    Write-Host "Please run: az login" -ForegroundColor Yellow
    exit 1
}

# 2. Create Resource Group
Write-Host "`n[1/6] Creating Resource Group: $ResourceGroupName..." -ForegroundColor Yellow
az group create --name $ResourceGroupName --location $Location --output none
Write-Host "[OK] Resource group created." -ForegroundColor Green

# 3. Create Log Analytics Workspace & Application Insights
Write-Host "`n[2/6] Provisioning Log Analytics & Application Insights..." -ForegroundColor Yellow
$lawName = "law-capacity-study"
$appiName = "appi-capacity-study"
az monitor log-analytics workspace create --resource-group $ResourceGroupName --workspace-name $lawName --location $Location --output none
$appInsightsKey = az monitor app-insights component create --app $appiName --location $Location --resource-group $ResourceGroupName --workspace $lawName --output json | ConvertFrom-Json
$connString = $appInsightsKey.connectionString
Write-Host "[OK] Application Insights provisioned." -ForegroundColor Green

# 4. Create App Service Plan & Web App
Write-Host "`n[3/6] Provisioning Linux App Service Plan ($Sku) & Web App ($AppServiceName)..." -ForegroundColor Yellow
az appservice plan create --name $AppServicePlanName --resource-group $ResourceGroupName --sku $Sku --is-linux --location $Location --output none
az webapp create --name $AppServiceName --resource-group $ResourceGroupName --plan $AppServicePlanName --runtime "NODE:20-lts" --output none
Write-Host "[OK] App Service created." -ForegroundColor Green

# 5. Configure App Service Settings
Write-Host "`n[4/6] Configuring Environment & Application Insights Telemetry..." -ForegroundColor Yellow
az webapp config set --resource-group $ResourceGroupName --name $AppServiceName --startup-file "node src/server.js" --output none
az webapp config appsettings set --resource-group $ResourceGroupName --name $AppServiceName --settings "APPLICATIONINSIGHTS_CONNECTION_STRING=$connString" "ApplicationInsightsAgent_EXTENSION_VERSION=~3" "SCM_DO_BUILD_DURING_DEPLOYMENT=true" --output none
Write-Host "[OK] Configuration applied." -ForegroundColor Green

# 6. Deploy Code Package
Write-Host "`n[5/6] Deploying Application Code package (deploy\app-package.zip)..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File deploy\create-zip.ps1
az webapp deploy --resource-group $ResourceGroupName --name $AppServiceName --src-path "deploy\app-package.zip" --type zip --output none
Write-Host "[OK] Application deployed." -ForegroundColor Green

# 7. Provision Azure Load Testing Resource
Write-Host "`n[6/6] Provisioning Azure Load Testing Resource (alt-capacity-study)..." -ForegroundColor Yellow
$altName = "alt-capacity-study"
az load create --name $altName --resource-group $ResourceGroupName --location $Location --output none
Write-Host "[OK] Azure Load Testing resource created." -ForegroundColor Green

# Summary
$appUrl = "https://$AppServiceName.azurewebsites.net"
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host " Web App URL:      $appUrl" -ForegroundColor Cyan
Write-Host " Health Check:     $appUrl/health" -ForegroundColor Cyan
Write-Host " Load Test Script: loadtest\capacity_study.jmx" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
