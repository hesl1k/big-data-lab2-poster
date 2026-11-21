$ErrorActionPreference='Stop'
$posterNode='C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1119-907-0_26.1119.907.0_x64__3k8sg7r9htsxt\dependencies\node\bin\node.exe'
if (!(Test-Path -LiteralPath $posterNode)) {$posterNode=(Get-Command node).Source}
$posterVersion=& $posterNode --version
if ([int]($posterVersion.TrimStart('v').Split('.')[0]) -lt 22) {throw 'Требуется Node.js 22.13 или новее'}
Set-Location -LiteralPath (Join-Path $PSScriptRoot 'poster-ui')
& $posterNode node_modules/next/dist/bin/next start --hostname 127.0.0.1
