import YTdlpWrap from 'yt-dlp-wrap';
import path from 'path';
import fs from 'fs';

const isWin = process.platform === 'win32';
const BIN_PATH = isWin ? path.join(process.cwd(), 'bin', 'yt-dlp.exe') : 'yt-dlp';
const ytdlp = new YTdlpWrap(BIN_PATH);

export interface VideoFormat {
    formatId: string;
    extension: string;
    resolution?: string;
    filesize?: number;
    vcodec?: string;
    acodec?: string;
    note?: string;
    hasVideo: boolean;
    hasAudio: boolean;
}

export interface VideoMetadata {
    title: string;
    duration: number;
    thumbnail: string;
    uploader: string;
    formats: VideoFormat[];
}

export async function getMetadata(url: string): Promise<VideoMetadata> {
    console.log(`🔍 Consultando metadata para: ${url}...`);
    const start = Date.now();
    try {
        // Creamos una promesa que falla a los 30 segundos si yt-dlp se cuelga
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Tiempo de espera agotado (yt-dlp colgado)')), 35000)
        );

        const args = [
            url, 
            '-j', 
            '--no-playlist',
            '--no-check-certificates',
            '--no-warnings',
            '--prefer-free-formats',
            '--youtube-skip-dash-manifest',
            '--force-ipv4',
            '--extractor-args', 'youtube:player_client=android,web'
        ];

        // Si existen cookies, las usamos para evitar bloqueos
        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        if (fs.existsSync(cookiesPath)) {
            args.push('--cookies', cookiesPath);
            console.log('🍪 Usando cookies.txt para la consulta');
        }

        const metadataPromise = ytdlp.execPromise(args);

        const metadataStr = await Promise.race([metadataPromise, timeout]) as string;
        const metadata = JSON.parse(metadataStr);
        
        const end = Date.now();
        console.log(`✅ Metadata obtenida en ${((end - start) / 1000).toFixed(2)}s`);
        
        // Filtramos y limpiamos los formatos para el frontend
        const cleanFormats = metadata.formats
            .map((f: any) => ({
                formatId: f.format_id,
                extension: f.ext,
                resolution: f.resolution || (f.height ? `${f.height}p` : undefined),
                filesize: f.filesize || f.filesize_approx,
                vcodec: f.vcodec,
                acodec: f.acodec,
                note: f.format_note,
                hasVideo: f.vcodec !== 'none',
                hasAudio: f.acodec !== 'none'
            }))
            .reverse();

        return {
            title: metadata.title,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            uploader: metadata.uploader,
            formats: cleanFormats
        };
    } catch (error) {
        throw new Error(`No se pudo obtener la info del video: ${error}`);
    }
}

export async function downloadVideo(url: string, options: { format?: string, output?: string } = {}) {
    const outputPath = options.output || path.join(process.cwd(), 'downloads', '%(title)s.%(ext)s');
    
    if (!fs.existsSync(path.join(process.cwd(), 'downloads'))) {
        fs.mkdirSync(path.join(process.cwd(), 'downloads'));
    }

    console.log(`🎬 Arrancando descarga de: ${url}`);
    
    return new Promise((resolve, reject) => {
        ytdlp.exec([
            url,
            '-f', options.format || 'bestvideo+bestaudio/best',
            '-o', outputPath,
            '--no-playlist'
        ])
        .on('progress', (progress) => {
            console.log(`📊 Progreso: ${progress.percent}% - Velocidad: ${progress.currentSpeed} - ETA: ${progress.eta}`);
        })
        .on('error', (err) => {
            console.error('❌ Error en la descarga:', err);
            reject(err);
        })
        .on('close', () => {
            console.log('✅ ¡Descarga terminada, fiera!');
            resolve(true);
        });
    });
}

export async function downloadAudio(url: string, options: { output?: string } = {}) {
    const outputPath = options.output || path.join(process.cwd(), 'downloads', '%(title)s.mp3');

    if (!fs.existsSync(path.join(process.cwd(), 'downloads'))) {
        fs.mkdirSync(path.join(process.cwd(), 'downloads'));
    }

    console.log(`🎵 Bajando audio de: ${url}`);

    return new Promise((resolve, reject) => {
        ytdlp.exec([
            url,
            '-x', // Extract audio
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '-o', outputPath,
            '--no-playlist'
        ])
        .on('progress', (progress) => {
            console.log(`📊 Progreso: ${progress.percent}% - ETA: ${progress.eta}`);
        })
        .on('error', (err) => {
            console.error('❌ Error bajando el audio:', err);
            reject(err);
        })
        .on('close', () => {
            console.log('✅ ¡Audio listo para el reproductor!');
            resolve(true);
        });
    });
}
