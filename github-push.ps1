param (
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken
)

$repoOwner = "haberben"
$repoName = "ikra-reimagined"
$branch = "main"

$headers = @{
    "Authorization" = "Bearer $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
}

# Add files that were modified
$pathsToCommit = @(
    "src/pages/HomePage.tsx",
    "src/components/DailyFactCard.tsx",
    "src/components/ProfilePanel.tsx",
    "supabase/migrations/",
    "github-push.ps1"
)

$filesToCommit = @()
foreach ($p in $pathsToCommit) {
    if (Test-Path $p -PathType Leaf) { 
        $filesToCommit += $p -replace '\\', '/'
    } elseif (Test-Path $p -PathType Container) {
        $filesToCommit += (Get-ChildItem -Path $p -File -Recurse | Select-Object -ExpandProperty FullName) | ForEach-Object {
            $_.Replace($PWD.Path + "\", "") -replace '\\', '/'
        }
    }
}

# 1. Get current branch SHA
$refUrl = "https://api.github.com/repos/$repoOwner/$repoName/git/refs/heads/$branch"
$refResp = Invoke-RestMethod -Uri $refUrl -Headers $headers -Method Get
$commitSha = $refResp.object.sha

# 2. Create Blobs and Tree
$treeUrl = "https://api.github.com/repos/$repoOwner/$repoName/git/trees"
$treeData = @{
    base_tree = $commitSha
    tree = @()
}

foreach ($file in $filesToCommit) {
    if (Test-Path $file) {
        $contentBytes = [System.IO.File]::ReadAllBytes($file)
        $base64Content = [Convert]::ToBase64String($contentBytes)
        
        $blobUrl = "https://api.github.com/repos/$repoOwner/$repoName/git/blobs"
        $blobBody = @{
            content = $base64Content
            encoding = "base64"
        } | ConvertTo-Json -Depth 10
        
        $blobResp = Invoke-RestMethod -Uri $blobUrl -Headers $headers -Method Post -Body $blobBody -ContentType "application/json"
        
        $treeData.tree += @{
            path = $file
            mode = "100644"
            type = "blob"
            sha = $blobResp.sha
        }
        Write-Host "Prepared $file"
    }
}

$treeBody = $treeData | ConvertTo-Json -Depth 10
$newTreeResp = Invoke-RestMethod -Uri $treeUrl -Headers $headers -Method Post -Body $treeBody -ContentType "application/json"
$newTreeSha = $newTreeResp.sha

# 3. Create Commit
$commitUrl = "https://api.github.com/repos/$repoOwner/$repoName/git/commits"
$commitBody = @{
    message = "feat: grant moderators full management permissions across content tabs"
    tree = $newTreeSha
    parents = @($commitSha)
} | ConvertTo-Json -Depth 10

$newCommitResp = Invoke-RestMethod -Uri $commitUrl -Headers $headers -Method Post -Body $commitBody -ContentType "application/json"
$newCommitSha = $newCommitResp.sha

# 4. Update Reference
$updateRefBody = @{
    sha = $newCommitSha
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri $refUrl -Headers $headers -Method Patch -Body $updateRefBody -ContentType "application/json"

Write-Host "Successfully pushed Prayer Time Geolocation changes to GitHub!"
