"""
╔══════════════════════════════════════════════════════════════════╗
║     CONVERSOR NETCDF - DEFESA CIVIL ARARUNA                      ║
║     Versão Desktop para arquivos grandes (até 10GB+)             ║
║     Prefeitura Municipal de Araruna/PB                           ║
║                                                                  ║
║     Desenvolvido por Abraham Câmara                              ║
╚══════════════════════════════════════════════════════════════════╝

Este software converte arquivos NetCDF (.nc) para CSV.
Otimizado para processar arquivos muito grandes (3GB, 4GB ou mais).

Uso:
    - Execute o programa
    - Selecione o arquivo .nc
    - Escolha onde salvar o CSV
    - Aguarde o processamento
"""

import os
import sys
import gc
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from datetime import datetime
from pathlib import Path

# Tentar importar bibliotecas necessárias
try:
    import xarray as xr
    import pandas as pd
    import numpy as np
    LIBS_OK = True
except ImportError as e:
    LIBS_OK = False
    MISSING_LIB = str(e)


# Cores do tema
CORES = {
    'bg_principal': '#0f172a',      # Azul muito escuro
    'bg_secundario': '#1e293b',     # Azul escuro
    'bg_card': '#334155',           # Cinza azulado
    'accent': '#e87722',            # Laranja (cor da prefeitura)
    'accent_hover': '#f59e0b',      # Laranja claro
    'success': '#22c55e',           # Verde
    'error': '#ef4444',             # Vermelho
    'texto': '#f8fafc',             # Branco
    'texto_secundario': '#94a3b8',  # Cinza claro
    'borda': '#475569',             # Cinza médio
    'roxo': '#8b5cf6',              # Roxo para destaque
}


class ConversorNetCDF:
    def __init__(self, root):
        self.root = root
        self.root.title("Conversor NetCDF - Defesa Civil Araruna")
        self.root.geometry("750x650")
        self.root.resizable(True, True)
        self.root.configure(bg=CORES['bg_principal'])
        self.root.minsize(650, 550)
        
        # Centralizar janela
        self.centralizar_janela()
        
        # Variáveis
        self.arquivo_entrada = tk.StringVar()
        self.arquivo_saida = tk.StringVar()
        self.status = tk.StringVar(value="Selecione um arquivo NetCDF para começar")
        self.progresso = tk.DoubleVar(value=0)
        self.processando = False
        self.cancelar = False
        
        # Configurar estilo
        self.configurar_estilo()
        
        # Criar interface
        self.criar_interface()
        
        # Verificar bibliotecas
        if not LIBS_OK:
            self.root.after(500, self.mostrar_erro_libs)
    
    def centralizar_janela(self):
        self.root.update_idletasks()
        width = 750
        height = 650
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
    
    def configurar_estilo(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Barra de progresso personalizada
        style.configure(
            "Custom.Horizontal.TProgressbar",
            troughcolor=CORES['bg_card'],
            background=CORES['accent'],
            darkcolor=CORES['accent'],
            lightcolor=CORES['accent_hover'],
            bordercolor=CORES['borda'],
            thickness=20
        )
    
    def mostrar_erro_libs(self):
        messagebox.showerror(
            "Bibliotecas não encontradas",
            f"Erro ao carregar bibliotecas:\n{MISSING_LIB}\n\n"
            "Execute no terminal:\n"
            "pip install xarray netcdf4 pandas numpy"
        )
    
    def criar_interface(self):
        # Frame principal com padding
        main_frame = tk.Frame(self.root, bg=CORES['bg_principal'])
        main_frame.pack(fill="both", expand=True, padx=30, pady=20)
        
        # ═══════════════════════════════════════════════════════════
        # HEADER
        # ═══════════════════════════════════════════════════════════
        header_frame = tk.Frame(main_frame, bg=CORES['bg_principal'])
        header_frame.pack(fill="x", pady=(0, 25))
        
        # Logo/Ícone simulado
        logo_frame = tk.Frame(header_frame, bg=CORES['accent'], width=60, height=60)
        logo_frame.pack_propagate(False)
        logo_frame.pack(side="left", padx=(0, 15))
        
        logo_text = tk.Label(
            logo_frame,
            text="🛡️",
            font=("Segoe UI Emoji", 28),
            bg=CORES['accent'],
            fg="white"
        )
        logo_text.place(relx=0.5, rely=0.5, anchor="center")
        
        # Títulos
        title_frame = tk.Frame(header_frame, bg=CORES['bg_principal'])
        title_frame.pack(side="left", fill="x", expand=True)
        
        titulo = tk.Label(
            title_frame,
            text="Conversor NetCDF",
            font=("Segoe UI", 26, "bold"),
            fg=CORES['texto'],
            bg=CORES['bg_principal']
        )
        titulo.pack(anchor="w")
        
        subtitulo = tk.Label(
            title_frame,
            text="Defesa Civil • Prefeitura de Araruna/PB",
            font=("Segoe UI", 11),
            fg=CORES['accent'],
            bg=CORES['bg_principal']
        )
        subtitulo.pack(anchor="w")
        
        # Badge de versão
        versao_frame = tk.Frame(header_frame, bg=CORES['roxo'], padx=12, pady=4)
        versao_frame.pack(side="right", anchor="ne")
        
        versao_label = tk.Label(
            versao_frame,
            text="v2.0 Desktop",
            font=("Segoe UI", 9, "bold"),
            fg="white",
            bg=CORES['roxo']
        )
        versao_label.pack()
        
        # ═══════════════════════════════════════════════════════════
        # CARD: ARQUIVO DE ENTRADA
        # ═══════════════════════════════════════════════════════════
        self.criar_card_arquivo(
            main_frame,
            "📂  Arquivo NetCDF de Entrada",
            self.arquivo_entrada,
            self.selecionar_arquivo,
            "Selecionar arquivo .nc"
        )
        
        # ═══════════════════════════════════════════════════════════
        # CARD: ARQUIVO DE SAÍDA
        # ═══════════════════════════════════════════════════════════
        self.criar_card_arquivo(
            main_frame,
            "💾  Arquivo CSV de Saída",
            self.arquivo_saida,
            self.selecionar_destino,
            "Escolher destino"
        )
        
        # ═══════════════════════════════════════════════════════════
        # CARD: PROGRESSO
        # ═══════════════════════════════════════════════════════════
        progress_card = tk.Frame(main_frame, bg=CORES['bg_secundario'], padx=20, pady=15)
        progress_card.pack(fill="x", pady=(0, 20))
        
        # Header do card
        progress_header = tk.Frame(progress_card, bg=CORES['bg_secundario'])
        progress_header.pack(fill="x", pady=(0, 12))
        
        progress_title = tk.Label(
            progress_header,
            text="📊  Progresso",
            font=("Segoe UI", 12, "bold"),
            fg=CORES['texto'],
            bg=CORES['bg_secundario']
        )
        progress_title.pack(side="left")
        
        self.progress_percent = tk.Label(
            progress_header,
            text="0%",
            font=("Segoe UI", 14, "bold"),
            fg=CORES['accent'],
            bg=CORES['bg_secundario']
        )
        self.progress_percent.pack(side="right")
        
        # Barra de progresso
        self.progress_bar = ttk.Progressbar(
            progress_card,
            variable=self.progresso,
            maximum=100,
            mode="determinate",
            style="Custom.Horizontal.TProgressbar"
        )
        self.progress_bar.pack(fill="x", pady=(0, 12))
        
        # Status
        self.label_status = tk.Label(
            progress_card,
            textvariable=self.status,
            font=("Segoe UI", 10),
            fg=CORES['texto_secundario'],
            bg=CORES['bg_secundario'],
            wraplength=650,
            justify="left"
        )
        self.label_status.pack(fill="x")
        
        # ═══════════════════════════════════════════════════════════
        # BOTÕES DE AÇÃO
        # ═══════════════════════════════════════════════════════════
        botoes_frame = tk.Frame(main_frame, bg=CORES['bg_principal'])
        botoes_frame.pack(fill="x", pady=(5, 20))
        
        # Botão Converter
        self.btn_converter = tk.Button(
            botoes_frame,
            text="▶  CONVERTER PARA CSV",
            command=self.iniciar_conversao,
            font=("Segoe UI", 13, "bold"),
            bg=CORES['success'],
            fg="white",
            activebackground="#16a34a",
            activeforeground="white",
            cursor="hand2",
            relief="flat",
            padx=35,
            pady=14,
            borderwidth=0
        )
        self.btn_converter.pack(side="left", expand=True, fill="x", padx=(0, 10))
        
        # Botão Cancelar
        self.btn_cancelar = tk.Button(
            botoes_frame,
            text="⏹  CANCELAR",
            command=self.cancelar_conversao,
            font=("Segoe UI", 13, "bold"),
            bg=CORES['bg_card'],
            fg=CORES['texto_secundario'],
            activebackground=CORES['error'],
            activeforeground="white",
            cursor="hand2",
            relief="flat",
            padx=25,
            pady=14,
            borderwidth=0,
            state="disabled"
        )
        self.btn_cancelar.pack(side="right")
        
        # ═══════════════════════════════════════════════════════════
        # RODAPÉ
        # ═══════════════════════════════════════════════════════════
        footer_frame = tk.Frame(main_frame, bg=CORES['bg_principal'])
        footer_frame.pack(fill="x", side="bottom")
        
        # Linha divisória
        divider = tk.Frame(footer_frame, bg=CORES['borda'], height=1)
        divider.pack(fill="x", pady=(0, 15))
        
        # Info do software
        info_frame = tk.Frame(footer_frame, bg=CORES['bg_principal'])
        info_frame.pack(fill="x")
        
        info_left = tk.Label(
            info_frame,
            text="💡 Otimizado para arquivos grandes (3GB, 4GB ou mais)",
            font=("Segoe UI", 9),
            fg=CORES['texto_secundario'],
            bg=CORES['bg_principal']
        )
        info_left.pack(side="left")
        
        # Crédito do desenvolvedor
        dev_frame = tk.Frame(footer_frame, bg=CORES['bg_principal'])
        dev_frame.pack(fill="x", pady=(10, 0))
        
        dev_label = tk.Label(
            dev_frame,
            text="Desenvolvido por ",
            font=("Segoe UI", 10),
            fg=CORES['texto_secundario'],
            bg=CORES['bg_principal']
        )
        dev_label.pack(side="left", anchor="center", expand=True)
        
        dev_name = tk.Label(
            dev_frame,
            text="Abraham Câmara",
            font=("Segoe UI", 10, "bold"),
            fg=CORES['accent'],
            bg=CORES['bg_principal']
        )
        dev_name.pack(side="left", anchor="center")
        
        # Centralizar o rodapé
        dev_frame.pack_configure(anchor="center")
        
        # Reorganizar para centralizar
        for widget in dev_frame.winfo_children():
            widget.pack_forget()
        
        center_frame = tk.Frame(dev_frame, bg=CORES['bg_principal'])
        center_frame.pack(anchor="center")
        
        tk.Label(
            center_frame,
            text="Desenvolvido por ",
            font=("Segoe UI", 10),
            fg=CORES['texto_secundario'],
            bg=CORES['bg_principal']
        ).pack(side="left")
        
        tk.Label(
            center_frame,
            text="Abraham Câmara",
            font=("Segoe UI", 10, "bold"),
            fg=CORES['accent'],
            bg=CORES['bg_principal']
        ).pack(side="left")
    
    def criar_card_arquivo(self, parent, titulo, variavel, comando, texto_botao):
        """Cria um card estilizado para seleção de arquivo"""
        card = tk.Frame(parent, bg=CORES['bg_secundario'], padx=20, pady=15)
        card.pack(fill="x", pady=(0, 15))
        
        # Título do card
        title_label = tk.Label(
            card,
            text=titulo,
            font=("Segoe UI", 12, "bold"),
            fg=CORES['texto'],
            bg=CORES['bg_secundario']
        )
        title_label.pack(anchor="w", pady=(0, 10))
        
        # Frame para input e botão
        input_frame = tk.Frame(card, bg=CORES['bg_secundario'])
        input_frame.pack(fill="x")
        
        # Entry estilizado
        entry = tk.Entry(
            input_frame,
            textvariable=variavel,
            font=("Segoe UI", 10),
            bg=CORES['bg_card'],
            fg=CORES['texto'],
            insertbackground=CORES['texto'],
            relief="flat",
            borderwidth=0
        )
        entry.pack(side="left", fill="x", expand=True, padx=(0, 10), ipady=10, ipadx=10)
        
        # Botão estilizado
        btn = tk.Button(
            input_frame,
            text=texto_botao,
            command=comando,
            font=("Segoe UI", 10, "bold"),
            bg=CORES['accent'],
            fg="white",
            activebackground=CORES['accent_hover'],
            activeforeground="white",
            cursor="hand2",
            relief="flat",
            padx=20,
            pady=8,
            borderwidth=0
        )
        btn.pack(side="right")
        
        return card
    
    def selecionar_arquivo(self):
        arquivo = filedialog.askopenfilename(
            title="Selecione o arquivo NetCDF",
            filetypes=[("Arquivos NetCDF", "*.nc"), ("Todos os arquivos", "*.*")]
        )
        if arquivo:
            self.arquivo_entrada.set(arquivo)
            # Sugerir nome de saída
            nome_base = Path(arquivo).stem
            pasta = Path(arquivo).parent
            self.arquivo_saida.set(str(pasta / f"{nome_base}.csv"))
            
            # Mostrar tamanho do arquivo
            tamanho_bytes = os.path.getsize(arquivo)
            tamanho_gb = tamanho_bytes / (1024 * 1024 * 1024)
            
            if tamanho_gb >= 1:
                self.status.set(f"✅ Arquivo selecionado: {tamanho_gb:.2f} GB")
            else:
                tamanho_mb = tamanho_bytes / (1024 * 1024)
                self.status.set(f"✅ Arquivo selecionado: {tamanho_mb:.0f} MB")
    
    def selecionar_destino(self):
        arquivo = filedialog.asksaveasfilename(
            title="Salvar CSV como",
            defaultextension=".csv",
            filetypes=[("Arquivo CSV", "*.csv"), ("Todos os arquivos", "*.*")]
        )
        if arquivo:
            self.arquivo_saida.set(arquivo)
    
    def iniciar_conversao(self):
        if not LIBS_OK:
            self.mostrar_erro_libs()
            return
        
        entrada = self.arquivo_entrada.get()
        saida = self.arquivo_saida.get()
        
        if not entrada:
            messagebox.showwarning("Aviso", "Selecione um arquivo NetCDF de entrada.")
            return
        
        if not saida:
            messagebox.showwarning("Aviso", "Escolha o local para salvar o CSV.")
            return
        
        if not os.path.exists(entrada):
            messagebox.showerror("Erro", "Arquivo de entrada não encontrado.")
            return
        
        # Iniciar conversão em thread separada
        self.processando = True
        self.cancelar = False
        self.btn_converter.config(state="disabled", bg=CORES['bg_card'])
        self.btn_cancelar.config(state="normal", bg=CORES['error'], fg="white")
        self.progresso.set(0)
        self.progress_percent.config(text="0%")
        
        thread = threading.Thread(target=self.converter, args=(entrada, saida))
        thread.daemon = True
        thread.start()
    
    def cancelar_conversao(self):
        if self.processando:
            self.cancelar = True
            self.status.set("⏳ Cancelando operação...")
    
    def atualizar_progresso(self, valor, mensagem):
        self.progresso.set(valor)
        self.progress_percent.config(text=f"{int(valor)}%")
        self.status.set(mensagem)
        self.root.update_idletasks()
    
    def converter(self, entrada, saida):
        try:
            self.atualizar_progresso(5, "📖 Abrindo arquivo NetCDF...")
            
            # Abrir dataset
            ds = xr.open_dataset(entrada)
            
            if self.cancelar:
                ds.close()
                self.finalizar_conversao(False, "❌ Conversão cancelada pelo usuário.")
                return
            
            # Informações do arquivo
            dims = dict(ds.dims)
            vars_list = list(ds.data_vars)
            
            self.atualizar_progresso(10, f"📋 Variáveis encontradas: {', '.join(vars_list[:5])}...")
            
            # Calcular tamanho total
            total_pontos = 1
            for dim in ds.dims.values():
                total_pontos *= dim
            
            self.atualizar_progresso(15, f"📊 Total de pontos de dados: {total_pontos:,}")
            
            # Identificar dimensão para dividir (geralmente tempo)
            dim_dividir = list(ds.dims.keys())[0]
            tamanho_dim = ds.dims[dim_dividir]
            
            # Tamanho do chunk baseado no número de pontos
            if total_pontos > 100_000_000:  # > 100M pontos
                chunk_size = max(1, tamanho_dim // 1000)
            elif total_pontos > 10_000_000:  # > 10M pontos
                chunk_size = max(1, tamanho_dim // 100)
            else:
                chunk_size = max(1, tamanho_dim // 10)
            
            self.atualizar_progresso(20, f"⚙️ Processando em blocos de {chunk_size} registros...")
            
            primeiro = True
            total_linhas = 0
            
            for i in range(0, tamanho_dim, chunk_size):
                if self.cancelar:
                    ds.close()
                    self.finalizar_conversao(False, "❌ Conversão cancelada pelo usuário.")
                    return
                
                fim = min(i + chunk_size, tamanho_dim)
                progresso_atual = 20 + (i / tamanho_dim) * 70
                
                percentual = int((i / tamanho_dim) * 100)
                self.atualizar_progresso(
                    progresso_atual,
                    f"🔄 Processando bloco {i+1:,} a {fim:,} de {tamanho_dim:,} ({percentual}%)"
                )
                
                # Selecionar subset
                subset = ds.isel({dim_dividir: slice(i, fim)})
                
                try:
                    # Converter para DataFrame
                    df_chunk = subset.to_dataframe().reset_index()
                    df_chunk = df_chunk.replace([np.inf, -np.inf], np.nan)
                    
                    # Salvar no CSV
                    if primeiro:
                        df_chunk.to_csv(saida, index=False, encoding='utf-8-sig', mode='w')
                        primeiro = False
                    else:
                        df_chunk.to_csv(saida, index=False, encoding='utf-8-sig', mode='a', header=False)
                    
                    total_linhas += len(df_chunk)
                    del df_chunk
                    gc.collect()
                    
                except MemoryError:
                    self.atualizar_progresso(progresso_atual, "⚠️ Memória baixa, usando blocos menores...")
                    
                    # Tentar com chunks menores
                    for j in range(i, fim, max(1, chunk_size // 10)):
                        if self.cancelar:
                            ds.close()
                            self.finalizar_conversao(False, "❌ Conversão cancelada.")
                            return
                        
                        fim_menor = min(j + max(1, chunk_size // 10), fim)
                        subset_menor = ds.isel({dim_dividir: slice(j, fim_menor)})
                        df_mini = subset_menor.to_dataframe().reset_index()
                        df_mini = df_mini.replace([np.inf, -np.inf], np.nan)
                        
                        if primeiro:
                            df_mini.to_csv(saida, index=False, encoding='utf-8-sig', mode='w')
                            primeiro = False
                        else:
                            df_mini.to_csv(saida, index=False, encoding='utf-8-sig', mode='a', header=False)
                        
                        total_linhas += len(df_mini)
                        del df_mini
                        gc.collect()
            
            ds.close()
            gc.collect()
            
            self.atualizar_progresso(95, "📝 Finalizando arquivo...")
            
            # Tamanho do arquivo de saída
            tamanho_saida_bytes = os.path.getsize(saida)
            tamanho_saida_mb = tamanho_saida_bytes / (1024 * 1024)
            
            if tamanho_saida_mb >= 1024:
                tamanho_str = f"{tamanho_saida_mb/1024:.2f} GB"
            else:
                tamanho_str = f"{tamanho_saida_mb:.1f} MB"
            
            self.finalizar_conversao(
                True, 
                f"✅ Conversão concluída com sucesso!\n"
                f"📊 {total_linhas:,} linhas exportadas\n"
                f"💾 Tamanho: {tamanho_str}"
            )
            
        except Exception as e:
            self.finalizar_conversao(False, f"❌ Erro: {str(e)}")
    
    def finalizar_conversao(self, sucesso, mensagem):
        self.processando = False
        self.progresso.set(100 if sucesso else 0)
        self.progress_percent.config(text="100%" if sucesso else "0%")
        self.status.set(mensagem)
        self.btn_converter.config(state="normal", bg=CORES['success'])
        self.btn_cancelar.config(state="disabled", bg=CORES['bg_card'], fg=CORES['texto_secundario'])
        
        if sucesso:
            self.label_status.config(fg=CORES['success'])
            self.root.after(100, lambda: messagebox.showinfo(
                "Sucesso! 🎉", 
                f"{mensagem}\n\nArquivo salvo em:\n{self.arquivo_saida.get()}"
            ))
        else:
            self.label_status.config(fg=CORES['error'])
            if "cancelad" not in mensagem.lower():
                self.root.after(100, lambda: messagebox.showerror("Erro", mensagem))


def main():
    root = tk.Tk()
    
    # Tentar definir ícone
    try:
        root.iconbitmap("icon.ico")
    except:
        pass
    
    # Configurar DPI awareness para Windows
    try:
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except:
        pass
    
    app = ConversorNetCDF(root)
    root.mainloop()


if __name__ == "__main__":
    main()
