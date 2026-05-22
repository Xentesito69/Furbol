$lines = Get-Content "data\players.js" -Encoding UTF8
# Find the last good line (before corruption at line 89)
$good = $lines[0..86]  # clubs + closing ], 
# Now write header + players section open
$good += '  "players": ['
Set-Content "data\players_good.tmp" ($good -join "`r`n") -Encoding UTF8
Write-Host "Saved $($good.Count) good lines"
