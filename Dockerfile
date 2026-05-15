FROM oven/bun:latest

# Instalamos dependencias básicas
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Instalamos yt-dlp usando pip (es la forma más robusta en Linux)
RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app

# Dependencias de Bun
COPY package.json bun.lock ./
RUN bun install

# El resto del código
COPY . .

EXPOSE 8080

CMD ["bun", "run", "index.ts"]
