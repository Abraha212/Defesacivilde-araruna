@echo off
echo ============================================
echo   GERANDO EXECUTAVEL - Conversor NetCDF
echo   Defesa Civil Araruna
echo ============================================
echo.

:: Verificar se o venv existe
if not exist "venv\Scripts\activate.bat" (
    echo [ERRO] Ambiente virtual nao encontrado!
    echo Execute primeiro: python -m venv venv
    pause
    exit /b 1
)

:: Ativar ambiente virtual
call venv\Scripts\activate.bat

:: Instalar PyInstaller se necessário
echo [1/4] Verificando PyInstaller...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo Instalando PyInstaller...
    pip install pyinstaller
)

:: Instalar dependências
echo [2/4] Verificando dependencias...
pip install xarray netcdf4 pandas numpy openpyxl --quiet

:: Gerar executável
echo [3/4] Gerando executavel...
echo Isso pode demorar alguns minutos...
echo.

pyinstaller --onefile ^
    --windowed ^
    --name "ConversorNetCDF-DefesaCivil" ^
    --icon "icon.ico" ^
    --add-data "icon.ico;." ^
    --hidden-import=xarray ^
    --hidden-import=netCDF4 ^
    --hidden-import=pandas ^
    --hidden-import=numpy ^
    --hidden-import=cftime ^
    --collect-all xarray ^
    --collect-all netCDF4 ^
    conversor_desktop.py

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao gerar executavel!
    echo Tentando sem icone...
    
    pyinstaller --onefile ^
        --windowed ^
        --name "ConversorNetCDF-DefesaCivil" ^
        --hidden-import=xarray ^
        --hidden-import=netCDF4 ^
        --hidden-import=pandas ^
        --hidden-import=numpy ^
        --hidden-import=cftime ^
        --collect-all xarray ^
        --collect-all netCDF4 ^
        conversor_desktop.py
)

echo.
echo [4/4] Concluido!
echo.
echo ============================================
echo   EXECUTAVEL GERADO COM SUCESSO!
echo   Arquivo: dist\ConversorNetCDF-DefesaCivil.exe
echo ============================================
echo.

:: Copiar para pasta de download
if not exist "..\public\downloads" mkdir "..\public\downloads"
copy "dist\ConversorNetCDF-DefesaCivil.exe" "..\public\downloads\" >nul 2>&1

if exist "..\public\downloads\ConversorNetCDF-DefesaCivil.exe" (
    echo Copiado para: public\downloads\ConversorNetCDF-DefesaCivil.exe
)

echo.
pause
