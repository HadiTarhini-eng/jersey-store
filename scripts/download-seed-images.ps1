#requires -Version 5.1
# Downloads all imagery referenced by api/src/seed-all.ts into
# client/public/seed-images/. Re-runnable; existing files are skipped.

$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot '..'
$out  = Join-Path $root 'client\public\seed-images'
New-Item -ItemType Directory -Force -Path $out | Out-Null

# Wikimedia rejects unidentified bots; their UA policy asks for an app
# identifier with a contact URL. The unsplash/loremflickr CDNs accept anything.
$ua = 'jersey-store-demo/1.0 (https://github.com/HadiTarhini-eng/jersey-store)'

# Each entry: { name, url }. `name` becomes the filename under seed-images/.
$assets = @(
    # ── Hero slides ─────────────────────────────────────────────────────────
    # Wikimedia thumbnail sizes are restricted per-file — 500px is the safe
    # universally-allowed bucket. See https://w.wiki/GHai.
    @{ name = 'hero-wc2026.png';           url = 'https://upload.wikimedia.org/wikipedia/en/thumb/1/17/2026_FIFA_World_Cup_emblem.svg/500px-2026_FIFA_World_Cup_emblem.svg.png' }
    @{ name = 'hero-stadium.jpg';          url = 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80' }
    @{ name = 'hero-court.jpg';            url = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80' }

    # ── Offer banner backgrounds ────────────────────────────────────────────
    @{ name = 'offer-worldcup.jpg';        url = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80' }
    @{ name = 'offer-first-order.jpg';     url = 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1600&q=80' }
    @{ name = 'offer-free-delivery.jpg';   url = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1600&q=80' }

    # ── Sport tiles ─────────────────────────────────────────────────────────
    @{ name = 'sport-football.jpg';        url = 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80' }
    @{ name = 'sport-basketball.jpg';      url = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80' }
    @{ name = 'sport-gym.jpg';             url = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80' }

    # ── Category tiles ──────────────────────────────────────────────────────
    @{ name = 'cat-jerseys.jpg';           url = 'https://images.unsplash.com/photo-1602810316693-3667c854239a?auto=format&fit=crop&w=1200&q=80' }
    @{ name = 'cat-shorts.jpg';            url = 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1200&q=80' }
    @{ name = 'cat-hoodies.jpg';           url = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=80' }
    @{ name = 'cat-training.jpg';          url = 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80' }

    # ── Team badges (Wikipedia / Wikimedia Commons, all at 500px) ───────────
    @{ name = 'team-real-madrid.png';      url = 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/500px-Real_Madrid_CF.svg.png' }
    @{ name = 'team-barcelona.png';        url = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/500px-FC_Barcelona_%28crest%29.svg.png' }
    @{ name = 'team-man-city.png';         url = 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/500px-Manchester_City_FC_badge.svg.png' }
    @{ name = 'team-man-united.png';       url = 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/500px-Manchester_United_FC_crest.svg.png' }
    @{ name = 'team-liverpool.png';        url = 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/500px-Liverpool_FC.svg.png' }
    @{ name = 'team-psg.png';              url = 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/500px-Paris_Saint-Germain_F.C..svg.png' }
    @{ name = 'team-bayern.png';           url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/500px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' }
    @{ name = 'team-juventus.png';         url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg/500px-Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg.png' }
    @{ name = 'team-lakers.png';           url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Los_Angeles_Lakers_logo.svg/500px-Los_Angeles_Lakers_logo.svg.png' }
    @{ name = 'team-bulls.png';            url = 'https://upload.wikimedia.org/wikipedia/en/thumb/6/67/Chicago_Bulls_logo.svg/500px-Chicago_Bulls_logo.svg.png' }
    @{ name = 'team-warriors.png';         url = 'https://upload.wikimedia.org/wikipedia/en/thumb/0/01/Golden_State_Warriors_logo.svg/500px-Golden_State_Warriors_logo.svg.png' }
    @{ name = 'team-celtics.png';          url = 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/Boston_Celtics.svg/500px-Boston_Celtics.svg.png' }
)

$failures = @()

foreach ($asset in $assets) {
    $target = Join-Path $out $asset.name
    if (Test-Path $target) {
        Write-Host "skip  $($asset.name)" -ForegroundColor DarkGray
        continue
    }
    try {
        Invoke-WebRequest -Uri $asset.url -OutFile $target -UserAgent $ua -MaximumRedirection 5 -TimeoutSec 30 -ErrorAction Stop
        $size = (Get-Item $target).Length
        if ($size -lt 1024) {
            Remove-Item $target -Force
            throw "downloaded file too small ($size bytes)"
        }
        Write-Host ("ok    {0,-30} {1,8} bytes" -f $asset.name, $size) -ForegroundColor Green
    } catch {
        Write-Host ("FAIL  {0,-30} {1}" -f $asset.name, $_.Exception.Message) -ForegroundColor Red
        $failures += $asset.name
    }
}

if ($failures.Count -gt 0) {
    Write-Host ""
    Write-Host "$($failures.Count) downloads failed:" -ForegroundColor Yellow
    $failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    exit 1
}

Write-Host ""
Write-Host "All assets downloaded to $out" -ForegroundColor Cyan
