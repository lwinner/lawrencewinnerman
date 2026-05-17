# Setup script for lawrencewinnerman.com
# Run from THIS folder (lawrencewinnerman.com).
#
# What this does:
#   1. Initializes a git repo in this folder
#   2. Adds the GitHub remote (lwinner/lawrencewinnerman)
#   3. Creates the first commit
#   4. Pushes to GitHub
#
# Requires: git installed and available on PATH.
# Auth: on first push, Git Credential Manager will pop a browser auth flow
#       to log in to GitHub. Approve it once and credentials are cached for
#       future pushes.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==> Initializing lawrencewinnerman.com" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "./package.json")) {
    Write-Host "ERROR: package.json not found. Run this script from the lawrencewinnerman.com project folder." -ForegroundColor Red
    exit 1
}

# Step 1: git init
if (-not (Test-Path "./.git")) {
    git init
    git branch -M main
    Write-Host "==> git initialized, branch main" -ForegroundColor Green
} else {
    Write-Host "==> git already initialized, skipping init" -ForegroundColor Yellow
}

# Step 2: Add remote (idempotent: remove existing origin first if present)
$existing = git remote 2>$null
if ($existing -contains "origin") {
    git remote remove origin
}
git remote add origin "https://github.com/lwinner/lawrencewinnerman.git"
Write-Host "==> remote origin set to lwinner/lawrencewinnerman" -ForegroundColor Green

# Step 3: Stage and commit
git add .
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "==> nothing to commit, working tree clean" -ForegroundColor Yellow
} else {
    git commit -m "Initial scaffold: Astro + Cloudflare Pages, locked brand system"
    Write-Host "==> initial commit created" -ForegroundColor Green
}

# Step 4: Push
Write-Host ""
Write-Host "==> pushing to GitHub (browser auth may pop up, approve to continue)" -ForegroundColor Cyan
git push -u origin main

Write-Host ""
Write-Host "==> DONE." -ForegroundColor Green
Write-Host "Repo: https://github.com/lwinner/lawrencewinnerman" -ForegroundColor Cyan
Write-Host "Next: connect this repo to a Cloudflare Pages project." -ForegroundColor Cyan
