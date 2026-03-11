@echo off
chcp 65001 >nul 2>&1
echo ============================================
echo   GERANDO EXECUTAVEL - Conversor NetCDF
echo   Prefeitura de Araruna/PB
echo ============================================
echo.

:: Verificar se o Python está disponível
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado no PATH!
    echo Instale o Python 3.10+ e adicione ao PATH.
    pause
    exit /b 1
)

:: Verificar se o venv existe, se não, criar
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Criando ambiente virtual...
    python -m venv venv
    if errorlevel 1 (
        echo [ERRO] Falha ao criar ambiente virtual!
        pause
        exit /b 1
    )
)

:: Ativar ambiente virtual
call venv\Scripts\activate.bat

:: Instalar dependências
echo [1/4] Instalando dependencias...
pip install -r requirements-desktop.txt --quiet
pip install Pillow --quiet

:: Instalar PyInstaller se necessário
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo Instalando PyInstaller...
    pip install pyinstaller
)

:: Gerar ícone
echo [2/4] Gerando icone do software...
python criar_icone.py
if not exist "icon.ico" (
    echo [AVISO] Icone nao gerado, continuando sem icone...
)
echo.

:: Gerar executável
echo [3/4] Gerando executavel...
echo Isso pode demorar alguns minutos...
echo.

set ICON_FLAG=
if exist "icon.ico" set ICON_FLAG=--icon=icon.ico

pyinstaller --onefile ^
    --windowed ^
    --name "ConversorNetCDF" ^
    %ICON_FLAG% ^
    --hidden-import=xarray ^
    --hidden-import=xarray.backends ^
    --hidden-import=xarray.backends.netCDF4_ ^
    --hidden-import=xarray.backends.scipy_ ^
    --hidden-import=xarray.backends.h5netcdf_ ^
    --hidden-import=xarray.coding ^
    --hidden-import=xarray.coding.times ^
    --hidden-import=xarray.coding.strings ^
    --hidden-import=xarray.coding.variables ^
    --hidden-import=xarray.core ^
    --hidden-import=xarray.core.dataarray ^
    --hidden-import=xarray.core.dataset ^
    --hidden-import=netCDF4 ^
    --hidden-import=netCDF4.utils ^
    --hidden-import=cftime ^
    --hidden-import=cftime._cftime ^
    --hidden-import=pandas ^
    --hidden-import=pandas._libs ^
    --hidden-import=pandas._libs.tslibs ^
    --hidden-import=pandas._libs.tslibs.np_datetime ^
    --hidden-import=pandas._libs.tslibs.nattype ^
    --hidden-import=pandas._libs.tslibs.timedeltas ^
    --hidden-import=pandas._libs.tslibs.timestamps ^
    --hidden-import=pandas._libs.tslibs.offsets ^
    --hidden-import=pandas._libs.tslibs.parsing ^
    --hidden-import=pandas._libs.hashtable ^
    --hidden-import=pandas._libs.index ^
    --hidden-import=pandas._libs.lib ^
    --hidden-import=pandas._libs.parsers ^
    --hidden-import=pandas.io.formats.csvs ^
    --hidden-import=numpy ^
    --hidden-import=numpy.core ^
    --hidden-import=numpy.core._methods ^
    --hidden-import=numpy.core.multiarray ^
    --hidden-import=numpy.lib ^
    --hidden-import=numpy.lib.format ^
    --hidden-import=numpy.random ^
    --hidden-import=numpy.random.common ^
    --hidden-import=numpy.random.bounded_integers ^
    --hidden-import=numpy.random.entropy ^
    --hidden-import=openpyxl ^
    --hidden-import=openpyxl.styles ^
    --hidden-import=openpyxl.drawing.image ^
    --hidden-import=PIL ^
    --hidden-import=PIL.Image ^
    --hidden-import=h5py ^
    --hidden-import=h5netcdf ^
    --hidden-import=scipy ^
    --hidden-import=scipy.io ^
    --hidden-import=scipy.io.netcdf ^
    --hidden-import=certifi ^
    --hidden-import=charset_normalizer ^
    --hidden-import=encodings ^
    --hidden-import=pkg_resources ^
    --hidden-import=packaging ^
    --hidden-import=packaging.version ^
    --hidden-import=packaging.specifiers ^
    --hidden-import=packaging.requirements ^
    --collect-all xarray ^
    --collect-all netCDF4 ^
    --collect-all cftime ^
    --collect-submodules xarray ^
    --collect-submodules netCDF4 ^
    --collect-submodules cftime ^
    conversor_desktop.py

if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao gerar executavel!
    echo Tentando modo simplificado...

    pyinstaller --onefile ^
        --windowed ^
        --name "ConversorNetCDF" ^
        --hidden-import=xarray ^
        --hidden-import=netCDF4 ^
        --hidden-import=cftime ^
        --hidden-import=pandas ^
        --hidden-import=numpy ^
        --hidden-import=openpyxl ^
        --collect-all xarray ^
        --collect-all netCDF4 ^
        --collect-all cftime ^
        conversor_desktop.py
)

echo.
echo [4/4] Verificando executavel...

if not exist "dist\ConversorNetCDF.exe" (
    echo [ERRO] Executavel nao encontrado em dist\
    pause
    exit /b 1
)

:: Mostrar tamanho do arquivo
for %%A in ("dist\ConversorNetCDF.exe") do (
    set "size=%%~zA"
    echo Tamanho do executavel: %%~zA bytes
)

echo.
echo [5/5] Copiando para pasta de downloads...

:: Copiar para pasta de download
if not exist "..\public\downloads" mkdir "..\public\downloads"
copy "dist\ConversorNetCDF.exe" "..\public\downloads\" >nul 2>&1

echo.
echo ============================================
echo   EXECUTAVEL GERADO COM SUCESSO!
echo   Arquivo: dist\ConversorNetCDF.exe
echo ============================================
echo.
echo O executavel esta pronto para uso.
echo Nao precisa instalar nada - basta dar duplo clique!
echo.
pause
