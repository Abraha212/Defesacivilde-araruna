"""
Defesa Civil Araruna - Backend Python
Conversor NetCDF para CSV/Excel
Versão 4.0 - Processamento em chunks para arquivos grandes
"""

import os
import io
import gc
import traceback
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response, FileResponse
import pandas as pd
import numpy as np

try:
    import xarray as xr
    import netCDF4
    NETCDF_OK = True
except ImportError:
    NETCDF_OK = False
    print("[ERRO] xarray/netCDF4 não instalados")

try:
    import openpyxl
    EXCEL_OK = True
except ImportError:
    EXCEL_OK = False

app = FastAPI(title="Conversor NetCDF", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

TEMP_DIR = Path(__file__).parent / "temp"
TEMP_DIR.mkdir(exist_ok=True)
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)


def limpar_arquivos_antigos():
    """Remove arquivos com mais de 2 horas"""
    agora = datetime.now()
    for pasta in [TEMP_DIR, OUTPUT_DIR]:
        for arquivo in pasta.iterdir():
            if arquivo.is_file():
                idade = agora.timestamp() - arquivo.stat().st_mtime
                if idade > 7200:
                    try:
                        arquivo.unlink()
                    except:
                        pass


def converter_netcdf_para_csv_em_partes(caminho_nc: str, caminho_csv: str):
    """
    Converte NetCDF para CSV processando variável por variável.
    Evita carregar tudo na memória.
    """
    print(f"[1/5] Abrindo arquivo NetCDF...")
    
    # Abrir dataset
    ds = xr.open_dataset(caminho_nc)
    
    print(f"[INFO] Variáveis: {list(ds.data_vars)}")
    print(f"[INFO] Dimensões: {dict(ds.dims)}")
    
    # Calcular tamanho total estimado
    total_pontos = 1
    for dim in ds.dims.values():
        total_pontos *= dim
    print(f"[INFO] Total de pontos: {total_pontos:,}")
    
    # Se for muito grande, processar de forma diferente
    if total_pontos > 10_000_000:  # Mais de 10 milhões de pontos
        print("[2/5] Arquivo grande detectado - usando método otimizado...")
        converter_grande_netcdf(ds, caminho_csv)
    else:
        print("[2/5] Convertendo para DataFrame...")
        df = ds.to_dataframe().reset_index()
        df = df.replace([np.inf, -np.inf], np.nan)
        
        print(f"[3/5] Salvando CSV ({len(df):,} linhas)...")
        df.to_csv(caminho_csv, index=False, encoding='utf-8-sig')
        del df
    
    ds.close()
    gc.collect()
    
    print("[5/5] Conversão concluída!")
    return caminho_csv


def converter_grande_netcdf(ds: xr.Dataset, caminho_csv: str):
    """
    Processa arquivo NetCDF muito grande em partes.
    Salva diretamente no CSV sem carregar tudo na memória.
    """
    variaveis = list(ds.data_vars)
    dimensoes = list(ds.dims)
    
    print(f"[INFO] Processando {len(variaveis)} variáveis em partes...")
    
    # Identificar a dimensão de tempo ou a maior dimensão para dividir
    dim_dividir = dimensoes[0]
    tamanho_dim = ds.dims[dim_dividir]
    
    # Dividir em chunks de no máximo 100.000 registros por vez
    chunk_size = min(100, tamanho_dim)  # Processar 100 índices por vez
    
    primeiro = True
    total_linhas = 0
    
    for i in range(0, tamanho_dim, chunk_size):
        fim = min(i + chunk_size, tamanho_dim)
        print(f"[3/5] Processando {dim_dividir}[{i}:{fim}] de {tamanho_dim}...")
        
        # Selecionar subset
        subset = ds.isel({dim_dividir: slice(i, fim)})
        
        try:
            # Converter subset para DataFrame
            df_chunk = subset.to_dataframe().reset_index()
            df_chunk = df_chunk.replace([np.inf, -np.inf], np.nan)
            
            # Salvar no CSV (append mode)
            if primeiro:
                df_chunk.to_csv(caminho_csv, index=False, encoding='utf-8-sig', mode='w')
                primeiro = False
            else:
                df_chunk.to_csv(caminho_csv, index=False, encoding='utf-8-sig', mode='a', header=False)
            
            total_linhas += len(df_chunk)
            del df_chunk
            gc.collect()
            
        except MemoryError:
            print(f"[AVISO] MemoryError no chunk {i}:{fim}, tentando com chunk menor...")
            # Tentar com chunks ainda menores
            for j in range(i, fim, 10):
                fim_menor = min(j + 10, fim)
                subset_menor = ds.isel({dim_dividir: slice(j, fim_menor)})
                df_mini = subset_menor.to_dataframe().reset_index()
                df_mini = df_mini.replace([np.inf, -np.inf], np.nan)
                
                if primeiro:
                    df_mini.to_csv(caminho_csv, index=False, encoding='utf-8-sig', mode='w')
                    primeiro = False
                else:
                    df_mini.to_csv(caminho_csv, index=False, encoding='utf-8-sig', mode='a', header=False)
                
                total_linhas += len(df_mini)
                del df_mini
                gc.collect()
    
    print(f"[4/5] Total de {total_linhas:,} linhas escritas no CSV")


@app.get("/")
async def root():
    return {
        "status": "online",
        "servico": "Conversor NetCDF - Defesa Civil Araruna",
        "versao": "4.0.0",
        "netcdf_disponivel": NETCDF_OK,
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.options("/api/netcdf/converter")
async def options_converter():
    return Response(status_code=200)


@app.post("/api/netcdf/converter")
async def converter_netcdf(
    arquivo: UploadFile = File(...),
    formato: str = Query("csv", regex="^(csv|xlsx)$")
):
    """Converte NetCDF para CSV ou Excel"""
    
    if not NETCDF_OK:
        raise HTTPException(500, "Bibliotecas NetCDF não instaladas")
    
    if not arquivo.filename.lower().endswith('.nc'):
        raise HTTPException(400, "Arquivo deve ser .nc")
    
    limpar_arquivos_antigos()
    
    # Caminhos temporários
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    nome_base = arquivo.filename.rsplit('.', 1)[0]
    caminho_nc = TEMP_DIR / f"{timestamp}_{arquivo.filename}"
    caminho_csv = OUTPUT_DIR / f"{timestamp}_{nome_base}.csv"
    caminho_xlsx = OUTPUT_DIR / f"{timestamp}_{nome_base}.xlsx"
    
    try:
        print(f"\n{'='*60}")
        print(f"[INICIO] Conversão: {arquivo.filename}")
        print(f"[FORMATO] {formato.upper()}")
        print(f"{'='*60}")
        
        # Salvar arquivo upload
        print("[UPLOAD] Salvando arquivo no servidor...")
        with open(caminho_nc, "wb") as f:
            while chunk := await arquivo.read(1024 * 1024):
                f.write(chunk)
        
        tamanho_mb = caminho_nc.stat().st_size / (1024 * 1024)
        print(f"[OK] Arquivo salvo: {tamanho_mb:.2f} MB")
        
        # Converter para CSV primeiro (sempre)
        converter_netcdf_para_csv_em_partes(str(caminho_nc), str(caminho_csv))
        
        # Se pediu Excel, converter CSV para XLSX
        if formato == "xlsx":
            print("[EXCEL] Convertendo CSV para Excel...")
            
            # Ler CSV em chunks e salvar como Excel
            tamanho_csv = caminho_csv.stat().st_size / (1024 * 1024)
            
            if tamanho_csv > 100:  # Maior que 100MB
                print("[AVISO] CSV muito grande, gerando Excel com amostra de 1M linhas")
                df = pd.read_csv(caminho_csv, nrows=1048575)
            else:
                df = pd.read_csv(caminho_csv)
            
            if len(df) > 1048575:
                df = df.head(1048575)
                print(f"[AVISO] Truncado para {len(df):,} linhas (limite Excel)")
            
            df.to_excel(caminho_xlsx, index=False, engine='openpyxl')
            del df
            gc.collect()
            
            # Remover CSV temporário
            caminho_csv.unlink()
            
            arquivo_saida = caminho_xlsx
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            nome_download = f"{nome_base}.xlsx"
        else:
            arquivo_saida = caminho_csv
            media_type = "text/csv"
            nome_download = f"{nome_base}.csv"
        
        # Limpar arquivo NC
        try:
            caminho_nc.unlink()
        except:
            pass
        
        print(f"[SUCESSO] Arquivo gerado: {arquivo_saida.name}")
        print(f"[TAMANHO] {arquivo_saida.stat().st_size / (1024*1024):.2f} MB")
        print(f"{'='*60}\n")
        
        # Retornar arquivo
        return FileResponse(
            path=str(arquivo_saida),
            filename=nome_download,
            media_type=media_type,
            background=None  # Não deletar automaticamente
        )
        
    except MemoryError as e:
        print(f"[ERRO MEMÓRIA] {e}")
        traceback.print_exc()
        
        # Limpar arquivos
        for f in [caminho_nc, caminho_csv, caminho_xlsx]:
            try:
                if f.exists():
                    f.unlink()
            except:
                pass
        
        gc.collect()
        raise HTTPException(
            500, 
            "Memória insuficiente. Tente fechar outros programas ou use um computador com mais RAM."
        )
        
    except Exception as e:
        print(f"[ERRO] {type(e).__name__}: {e}")
        traceback.print_exc()
        
        for f in [caminho_nc, caminho_csv, caminho_xlsx]:
            try:
                if f.exists():
                    f.unlink()
            except:
                pass
        
        gc.collect()
        raise HTTPException(500, f"Erro na conversão: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("  CONVERSOR NETCDF - DEFESA CIVIL ARARUNA v4.0")
    print("  Otimizado para arquivos grandes")
    print("="*60)
    print(f"  Servidor: http://localhost:8000")
    print("="*60 + "\n")
    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
