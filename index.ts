import { Hono } from 'hono';
import { getMetadata, downloadVideo, downloadAudio } from './downloader';
import path from 'path';
import YTdlpWrap from 'yt-dlp-wrap';

// --- Lógica de CLI ---
const args = process.argv.slice(2);

if (args.length > 0) {
    const url = args[0];
    const mode = args[1] || 'video'; // 'video' o 'audio'

    console.log(`🚀 Modo CLI activado para: ${url}`);
    
    if (mode === 'audio') {
        await downloadAudio(url as any);
    } else {
        await downloadVideo(url as any);
    }
    process.exit(0);
}

// --- Lógica de API (Hono) ---
const app = new Hono();

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YTDL Pro - Descargador Premium</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #ff0050;
            --secondary: #00f2ea;
            --bg: #0a0b1e;
            --card-bg: rgba(255, 255, 255, 0.05);
            --text: #ffffff;
            --text-dim: #b0b0b0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background: radial-gradient(circle at top right, #1a1b3a, var(--bg));
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 2rem;
        }

        .container {
            max-width: 900px;
            width: 100%;
            text-align: center;
        }

        header {
            margin-bottom: 3rem;
        }

        h1 {
            font-size: 3.5rem;
            font-weight: 800;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }

        p.subtitle {
            color: var(--text-dim);
            font-size: 1.1rem;
        }

        .search-box {
            position: relative;
            background: var(--card-bg);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 0.5rem;
            border-radius: 50px;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            margin-bottom: 2rem;
        }

        .search-box:focus-within {
            border-color: var(--secondary);
            box-shadow: 0 0 20px rgba(0, 242, 234, 0.2);
        }

        input {
            background: transparent;
            border: none;
            outline: none;
            color: white;
            padding: 1rem 2rem;
            font-size: 1.2rem;
            flex: 1;
        }

        button.search-btn {
            background: linear-gradient(135deg, var(--primary), #ff4d00);
            color: white;
            border: none;
            padding: 1rem 2.5rem;
            border-radius: 40px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
        }

        button.search-btn:hover {
            transform: scale(1.05);
            opacity: 0.9;
        }

        #result-container {
            display: none;
            animation: fadeInUp 0.5s ease forwards;
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .video-card {
            background: var(--card-bg);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 2rem;
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 2rem;
            text-align: left;
        }

        .thumbnail {
            width: 100%;
            border-radius: 16px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        }

        .info h2 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            line-height: 1.2;
        }

        .uploader {
            color: var(--secondary);
            font-weight: 600;
            margin-bottom: 1rem;
            display: block;
        }

        .formats-list {
            margin-top: 1.5rem;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 1rem;
            max-height: 300px;
            overflow-y: auto;
            padding-right: 10px;
        }

        .formats-list::-webkit-scrollbar {
            width: 5px;
        }
        .formats-list::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
        }

        .format-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 0.8rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }

        .format-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: var(--secondary);
        }

        .format-btn span {
            display: block;
            font-size: 0.8rem;
            color: var(--text-dim);
        }

        .loader {
            display: none;
            width: 40px;
            height: 40px;
            border: 4px solid var(--card-bg);
            border-top-color: var(--secondary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 2rem auto;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .video-card {
                grid-template-columns: 1fr;
            }
            h1 { font-size: 2.5rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Descargar videos/audios</h1>
            <p class="subtitle">Ingresa la url del video de youtube.</p>
        </header>

        <div class="search-box">
            <input type="text" id="url-input" placeholder="Pegá el link de YouTube acá, fiera...">
            <button class="search-btn" id="search-btn">Analizar</button>
        </div>

        <div id="loader" class="loader"></div>

        <div id="result-container">
            <div class="video-card">
                <img id="v-thumb" class="thumbnail" src="" alt="Thumbnail">
                <div class="info">
                    <span id="v-uploader" class="uploader"></span>
                    <h2 id="v-title"></h2>
                    <p id="v-duration" class="subtitle"></p>

                    <div class="formats-section" style="margin-top: 2rem;">
                        <h3>🎵 Audio</h3>
                        <div id="audio-formats" class="formats-list"></div>
                    </div>
                    
                    <div class="formats-section">
                        <h3>🎥 Video</h3>
                        <div id="video-formats" class="formats-list"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const searchBtn = document.getElementById('search-btn');
        const urlInput = document.getElementById('url-input');
        const loader = document.getElementById('loader');
        const resultContainer = document.getElementById('result-container');

        searchBtn.addEventListener('click', async () => {
            let url = urlInput.value.trim();
            if (!url) return alert('¡Pasame una URL, che!');

            loader.style.display = 'block';
            resultContainer.style.display = 'none';

            try {
                const response = await fetch(\`/info?url=\${encodeURIComponent(url)}\`);
                const data = await response.json();

                if (data.error) throw new Error(data.error);

                document.getElementById('v-thumb').src = data.thumbnail;
                document.getElementById('v-title').innerText = data.title;
                document.getElementById('v-uploader').innerText = data.uploader;
                document.getElementById('v-duration').innerText = \`Duración: \${data.duration}s\`;

                const videoDiv = document.getElementById('video-formats');
                const audioDiv = document.getElementById('audio-formats');
                videoDiv.innerHTML = '';
                audioDiv.innerHTML = '';

                data.formats.forEach(f => {
                    if (!f.hasVideo && !f.hasAudio) return;

                    const btn = document.createElement('button');
                    btn.className = 'format-btn';
                    const size = f.filesize ? \`(\${(f.filesize / 1024 / 1024).toFixed(1)}MB)\` : '';
                    
                    let label = f.resolution || f.extension;
                    let soundLabel = '';
                    if (f.hasVideo && !f.hasAudio) soundLabel = ' 🔇 (Mudo)';
                    if (f.hasVideo && f.hasAudio) soundLabel = ' 🔊 (Con Audio)';

                    btn.innerHTML = \`
                        <strong>\${label}\${soundLabel}</strong>
                        <span>\${f.note || ''} \${size}</span>
                        <span>\${f.extension.toUpperCase()}</span>
                    \`;
                    btn.onclick = () => download(url, f.formatId);
                    
                    if (f.hasVideo) {
                        videoDiv.appendChild(btn);
                    } else {
                        audioDiv.appendChild(btn);
                    }
                });

                resultContainer.style.display = 'block';
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                loader.style.display = 'none';
            }
        });

        function download(url, formatId) {
            window.location.href = \`/download?url=\${encodeURIComponent(url)}&formatId=\${formatId}\`;
        }
    </script>
</body>
</html>`;

app.get('/', (c) => {
    return c.html(HTML_CONTENT);
});

app.get('/info', async (c) => {
    const url = c.req.query('url');
    if (!url) return c.json({ error: 'Falta la URL, máquina' }, 400);

    try {
        const info = await getMetadata(url);
        return c.json(info);
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.get('/download', async (c) => {
    const url = c.req.query('url');
    const formatId = c.req.query('formatId') || 'best';

    if (!url) return c.json({ error: 'Pasame la URL' }, 400);

    console.log(`📡 Iniciando stream de descarga para: ${url} (Formato: ${formatId})`);

    // Obtenemos info básica para el nombre del archivo
    let title = 'video';
    let ext = 'mp4';
    try {
        const info = await getMetadata(url);
        title = info.title.replace(/[^\w\s-]/g, ''); // Limpiar nombre
        const formatInfo = info.formats.find(f => f.formatId === formatId);
        if (formatInfo) ext = formatInfo.extension;
    } catch (e) {
        console.warn('⚠️ No se pudo obtener metadata para el nombre del archivo, usando valores por defecto.');
    }

    const isWin = process.platform === 'win32';
    const ytdlp = new YTdlpWrap(path.join(process.cwd(), 'bin', isWin ? 'yt-dlp.exe' : 'yt-dlp'));
    const stream = ytdlp.execStream([
        url,
        '-f', formatId,
        '--no-playlist',
        '--js-runtime', 'bun'
    ]);

    return new Response(stream as any, {
        headers: {
            'Content-Disposition': `attachment; filename="${title}.${ext}"`,
            'Content-Type': 'application/octet-stream',
        },
    });
});

console.log('📡 Servidor API levantado en el puerto 7860');
export default {
    port: 7860,
    fetch: app.fetch,
    idleTimeout: 60, // Aumentamos a 60 segundos por las dudas
};