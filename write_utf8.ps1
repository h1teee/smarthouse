param([string]$FilePath, [string]$Base64Content)
$nodeScript = "const fs = require('fs'); fs.writeFileSync('$FilePath', Buffer.from('$Base64Content', 'base64').toString('utf8'));"
$nodeBytes = [System.Text.Encoding]::UTF8.GetBytes($nodeScript)
$nodeBase64 = [System.Convert]::ToBase64String($nodeBytes)
docker run --rm -v "c:\Users\kirill\Desktop\smarthouse:/app" -w /app node:20-alpine sh -c "echo $nodeBase64 | base64 -d | node"
