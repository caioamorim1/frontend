# Script PowerShell para analisar uso de rotas da API
# Execução: .\scripts\analyze-api-usage.ps1

Write-Host "`n🔍 Analisando uso de rotas da API...`n" -ForegroundColor Cyan

$apiFile = "src/lib/api.ts"
$srcDir = "src"

# Extrai todas as funções exportadas
Write-Host "📖 Lendo funções de $apiFile..." -ForegroundColor Yellow
$apiContent = Get-Content $apiFile -Raw
$exportPattern = 'export\s+(?:async\s+)?(?:const|function)\s+(\w+)'
$matches = [regex]::Matches($apiContent, $exportPattern)

$apiFunctions = @()
foreach ($match in $matches) {
    $funcName = $match.Groups[1].Value
    if ($funcName -ne "api" -and $funcName -ne "API_BASE_URL") {
        $apiFunctions += $funcName
    }
}

$apiFunctions = $apiFunctions | Sort-Object
Write-Host "✓ $($apiFunctions.Count) funções encontradas`n" -ForegroundColor Green

# Busca uso de cada função
$unusedFunctions = @()
$usedFunctions = @{}

Write-Host "🔎 Analisando uso das funções...`n" -ForegroundColor Yellow

foreach ($funcName in $apiFunctions) {
    # Busca em todos os arquivos .ts, .tsx
    $pattern = "\b$funcName\s*\("
    $files = Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.tsx,*.js,*.jsx | 
             Where-Object { $_.Name -ne "api.ts" }
    
    $usageCount = 0
    $usageFiles = @()
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        
        # Verifica se há import
        if ($content -match "import\s+{[^}]*\b$funcName\b[^}]*}\s+from\s+[`"']@/lib/api[`"']") {
            $matches = [regex]::Matches($content, $pattern)
            if ($matches.Count -gt 0) {
                $usageCount += $matches.Count
                $usageFiles += $file.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
            }
        }
    }
    
    if ($usageCount -eq 0) {
        $unusedFunctions += $funcName
    } else {
        $usedFunctions[$funcName] = @{
            Count = $usageCount
            Files = $usageFiles
        }
    }
}

# Exibe relatório
Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 RESUMO EXECUTIVO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Total de funções API: $($apiFunctions.Count)"
Write-Host "Funções utilizadas: $($usedFunctions.Count)" -ForegroundColor Green
Write-Host "Funções não utilizadas: $($unusedFunctions.Count)" -ForegroundColor Red
$utilizationRate = [math]::Round(($usedFunctions.Count / $apiFunctions.Count) * 100, 1)
Write-Host "Taxa de utilização: $utilizationRate%`n" -ForegroundColor Yellow

if ($unusedFunctions.Count -gt 0) {
    Write-Host "⚠️  FUNÇÕES NÃO UTILIZADAS ($($unusedFunctions.Count))" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Red
    
    foreach ($func in $unusedFunctions) {
        Write-Host "  ✗ $func" -ForegroundColor Red
    }
    Write-Host ""
}

# Top 10 funções mais usadas
Write-Host "📈 TOP 10 FUNÇÕES MAIS USADAS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

$topFunctions = $usedFunctions.GetEnumerator() | 
                Sort-Object -Property { $_.Value.Count } -Descending | 
                Select-Object -First 10

$i = 1
foreach ($item in $topFunctions) {
    Write-Host "$i. $($item.Key)" -ForegroundColor Green
    Write-Host "   $($item.Value.Count) uso(s) em $($item.Value.Files.Count) arquivo(s)" -ForegroundColor Yellow
    $i++
}

Write-Host "`n💾 Salvando relatório detalhado...`n" -ForegroundColor Yellow

# Gera relatório em Markdown
$report = @"
# 📊 Relatório de Uso de Rotas da API

**Data de Geração**: $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")

## 📈 Resumo Executivo

- **Total de funções API**: $($apiFunctions.Count)
- **Funções utilizadas**: $($usedFunctions.Count)
- **Funções não utilizadas**: $($unusedFunctions.Count)
- **Taxa de utilização**: $utilizationRate%

---

## ⚠️ Funções Não Utilizadas ($($unusedFunctions.Count))

**Estas funções podem ser removidas do código:**

"@

foreach ($func in $unusedFunctions) {
    $report += "- ``$func```n"
}

$report += @"

---

## ✅ Funções Utilizadas ($($usedFunctions.Count))

"@

foreach ($item in $usedFunctions.GetEnumerator() | Sort-Object Name) {
    $report += @"

### ``$($item.Key)``

**Total de usos**: $($item.Value.Count) em $($item.Value.Files.Count) arquivo(s)

**Arquivos**:
"@
    foreach ($file in $item.Value.Files) {
        $report += "`n- ``$file``"
    }
    $report += "`n"
}

$report | Out-File -FilePath "API_USAGE_REPORT.md" -Encoding UTF8

Write-Host "✓ Relatório salvo em: API_USAGE_REPORT.md" -ForegroundColor Green

if ($unusedFunctions.Count -gt 0) {
    Write-Host "`n💡 Dica: Revise as funções não utilizadas no relatório para decidir se podem ser removidas.`n" -ForegroundColor Yellow
}
