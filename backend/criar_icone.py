"""
Gera o ícone icon.ico para o Conversor NetCDF.
Execute com: python criar_icone.py
Requer: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import struct
import io
import os

# Cores da Prefeitura de Araruna
COR_FUNDO    = (14, 21, 32)    # #0e1520 — fundo escuro
COR_LARANJA  = (232, 119, 34)  # #e87722 — laranja prefeitura
COR_BRANCO   = (255, 255, 255)
COR_AZUL     = (59, 130, 246)  # #3b82f6


def desenhar_icone(size: int) -> Image.Image:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    m = size // 16  # margem

    # ── Fundo circular ──────────────────────────────────────────────────────
    d.ellipse([m, m, size - m, size - m],
              fill=COR_FUNDO, outline=COR_LARANJA, width=max(2, size // 32))

    # ── Escudo (polígono simples) ────────────────────────────────────────────
    cx = size // 2
    cy = size // 2
    r  = int(size * 0.30)

    # Topo do escudo (retângulo arredondado no topo + ponta abaixo)
    sx = cx - r
    sy = int(cy - r * 1.05)
    sw = r * 2
    sh = int(r * 1.6)

    # Corpo do escudo
    d.rounded_rectangle(
        [sx, sy, sx + sw, sy + sh],
        radius=max(2, r // 4),
        fill=COR_LARANJA,
        outline=COR_BRANCO,
        width=max(1, size // 64)
    )

    # Ponta inferior
    ponta = [
        (cx - r,      sy + sh - max(2, r // 6)),
        (cx + r,      sy + sh - max(2, r // 6)),
        (cx,          sy + sh + int(r * 0.55)),
    ]
    d.polygon(ponta, fill=COR_LARANJA, outline=COR_BRANCO)

    # ── Letras "DC" dentro do escudo ────────────────────────────────────────
    font_size = max(8, int(r * 0.85))
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except Exception:
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except Exception:
            font = ImageFont.load_default()

    texto = "DC"
    bbox = d.textbbox((0, 0), texto, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = cx - tw // 2
    ty = sy + (sh // 2) - th // 2 - max(2, size // 32)

    # Sombra sutil
    d.text((tx + 1, ty + 1), texto, font=font, fill=(0, 0, 0, 180))
    d.text((tx, ty), texto, font=font, fill=COR_BRANCO)

    return img


def salvar_ico(caminho: str):
    tamanhos = [256, 128, 64, 48, 32, 16]
    frames = []
    for s in tamanhos:
        img = desenhar_icone(s)
        frames.append(img)

    # Salva como .ico com múltiplos tamanhos
    frames[0].save(
        caminho,
        format='ICO',
        sizes=[(s, s) for s in tamanhos],
        append_images=frames[1:]
    )
    print(f"[OK] Icone criado: {caminho}")
    print(f"     Tamanhos: {tamanhos}")


if __name__ == '__main__':
    destino = os.path.join(os.path.dirname(__file__), 'icon.ico')
    salvar_ico(destino)
