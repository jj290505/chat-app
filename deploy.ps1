#!/usr/bin/env powershell

# Chat App Deployment Helper Script

$projectPath = "c:\Users\JJ\Desktop\2026\real time caht application"
$dashboardUrl = "https://vercel.com/jay290505s-projects/chat-app"

Write-Host "🚀 Chat App Deployment Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project Status:" -ForegroundColor Yellow
Write-Host "- Project Name: chat-app"
Write-Host "- Build Status: Last deployment failed"
Write-Host "- Environment Variables: Configured ✓"
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Opening Vercel Dashboard..."
Write-Host "2. Check build logs for errors"
Write-Host "3. Fix any issues"
Write-Host "4. Redeploy"
Write-Host ""

# Open Vercel Dashboard in browser
Start-Process $dashboardUrl

Write-Host "Dashboard URL: $dashboardUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "To redeploy after fixing issues:" -ForegroundColor Yellow
Write-Host "  vercel --prod --yes"
Write-Host ""
Write-Host "To check deployment status:" -ForegroundColor Yellow
Write-Host "  vercel status"
