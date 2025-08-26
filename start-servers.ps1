# AI Hub - Start Both Servers Script
# This script starts both the frontend and backend servers

Write-Host "🚀 Starting AI Hub Development Environment..." -ForegroundColor Green
Write-Host ""

# Function to start backend server
function Start-BackendServer {
    Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
    Start-Sleep -Seconds 3
}

# Function to start frontend server
function Start-FrontendServer {
    Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Start-Sleep -Seconds 3
}

# Function to check if ports are available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if ports are available
Write-Host "🔍 Checking port availability..." -ForegroundColor Cyan

if (Test-Port 5000) {
    Write-Host "❌ Port 5000 (Backend) is already in use!" -ForegroundColor Red
    Write-Host "   Please stop any existing backend server first." -ForegroundColor Red
    exit 1
}

if (Test-Port 3000) {
    Write-Host "❌ Port 3000 (Frontend) is already in use!" -ForegroundColor Red
    Write-Host "   Please stop any existing frontend server first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Ports 3000 and 5000 are available" -ForegroundColor Green
Write-Host ""

# Start servers
Start-BackendServer
Start-FrontendServer

Write-Host ""
Write-Host "🎉 Both servers are starting up!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏳ Please wait a few seconds for servers to fully start..." -ForegroundColor Yellow
Write-Host "💡 You can test the backend with: cd backend; node test-api.js" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
