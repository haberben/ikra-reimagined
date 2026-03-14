$cssUrl = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
$css = Invoke-RestMethod -Uri $cssUrl -Headers @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
if ($css -match 'url\((https://[^)]+\.woff2)\)') {
    $woffUrl = $matches[1]
    Write-Host "Found URL: $woffUrl"
    New-Item -ItemType Directory -Force -Path "public/fonts"
    Invoke-WebRequest -Uri $woffUrl -OutFile "public/fonts/material-symbols.woff2"
    
    $localCss = $css -replace 'url\(https://[^)]+\.woff2\)', 'url(/fonts/material-symbols.woff2)'
    # Ensure standard classes are included if google omitted them for this user-agent
    if (-not ($localCss -match '\.material-symbols-outlined')) {
        $localCss += "`n.material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 24px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-feature-settings: 'liga'; -webkit-font-smoothing: antialiased; }"
    }
    
    $localCss | Out-File -FilePath "public/fonts/material-symbols.css" -Encoding utf8
    Write-Host "Font downloaded successfully and CSS generated."
} else {
    Write-Host "Failed to find WOFF2 URL in CSS."
}
