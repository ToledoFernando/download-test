FROM oven/bun:latest

# Instalamos dependencias del sistema (python3 para yt-dlp, ffmpeg para audio/video)
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos archivos de dependencias
COPY package.json bun.lock ./
RUN bun install

# Copiamos el resto del código
COPY . .

# Corremos el setup para asegurar que el binario de yt-dlp esté
RUN bun run setup.ts

EXPOSE 7860

CMD ["bun", "run", "index.ts"]
