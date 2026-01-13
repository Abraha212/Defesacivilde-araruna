# Script para configurar a logo da Prefeitura de Araruna
# Execute: .\configurar_logo.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURAR LOGO - DEFESA CIVIL ARARUNA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$pastaImagens = "C:\Users\ABRAHAM\defesa-civil-araruna\public\images"
$logoEsperada = "$pastaImagens\logo-prefeitura.png"

# Criar pasta se não existir
if (-not (Test-Path $pastaImagens)) {
    New-Item -ItemType Directory -Path $pastaImagens -Force | Out-Null
    Write-Host "✅ Pasta criada: $pastaImagens" -ForegroundColor Green
}

# Verificar se a logo já existe
if (Test-Path $logoEsperada) {
    Write-Host "✅ Logo já está configurada!" -ForegroundColor Green
    Write-Host "   Localização: $logoEsperada" -ForegroundColor Gray
    exit 0
}

# Procurar logo em outros lugares
Write-Host "🔍 Procurando logo em outros locais..." -ForegroundColor Yellow

$logosEncontradas = @()
$caminhosBusca = @(
    "$pastaImagens\[logo-pma].png",
    "$pastaImagens\*.png",
    "$pastaImagens\*.jpg",
    "$pastaImagens\*.jpeg",
    "C:\Users\ABRAHAM\defesa-civil-araruna\*.png",
    "C:\Users\ABRAHAM\defesa-civil-araruna\*.jpg"
)

foreach ($caminho in $caminhosBusca) {
    $arquivos = Get-ChildItem -Path $caminho -ErrorAction SilentlyContinue
    foreach ($arquivo in $arquivos) {
        if ($arquivo.Name -like "*logo*" -or $arquivo.Name -like "*pma*" -or $arquivo.Name -like "*araruna*" -or $arquivo.Name -like "*brasao*") {
            $logosEncontradas += $arquivo.FullName
        }
    }
}

if ($logosEncontradas.Count -gt 0) {
    Write-Host ""
    Write-Host "📁 Logos encontradas:" -ForegroundColor Green
    for ($i = 0; $i -lt $logosEncontradas.Count; $i++) {
        Write-Host "   [$i] $($logosEncontradas[$i])" -ForegroundColor Gray
    }
    
    Write-Host ""
    $escolha = Read-Host "Digite o número da logo para usar (ou Enter para usar a primeira)"
    
    if ($escolha -eq "") {
        $logoOrigem = $logosEncontradas[0]
    } else {
        $indice = [int]$escolha
        if ($indice -ge 0 -and $indice -lt $logosEncontradas.Count) {
            $logoOrigem = $logosEncontradas[$indice]
        } else {
            Write-Host "❌ Número inválido!" -ForegroundColor Red
            exit 1
        }
    }
    
    Copy-Item -Path $logoOrigem -Destination $logoEsperada -Force
    Write-Host ""
    Write-Host "✅ Logo copiada com sucesso!" -ForegroundColor Green
    Write-Host "   De: $logoOrigem" -ForegroundColor Gray
    Write-Host "   Para: $logoEsperada" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "⚠️ Nenhuma logo encontrada automaticamente." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para configurar a logo manualmente:" -ForegroundColor Cyan
    Write-Host "1. Coloque a imagem do brasão de Araruna em:" -ForegroundColor White
    Write-Host "   $logoEsperada" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. O arquivo deve se chamar: logo-prefeitura.png" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Formatos aceitos: PNG, JPG, JPEG" -ForegroundColor White
    Write-Host ""
    
    $caminhoManual = Read-Host "Ou digite o caminho completo da logo agora (ou Enter para pular)"
    
    if ($caminhoManual -ne "") {
        if (Test-Path $caminhoManual) {
            Copy-Item -Path $caminhoManual -Destination $logoEsperada -Force
            Write-Host ""
            Write-Host "✅ Logo copiada com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "❌ Arquivo não encontrado: $caminhoManual" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuração concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "A logo será exibida em:" -ForegroundColor White
Write-Host "  - Tela de login" -ForegroundColor Gray
Write-Host "  - Sidebar do sistema" -ForegroundColor Gray
Write-Host "  - Arquivos Excel exportados" -ForegroundColor Gray
Write-Host ""
