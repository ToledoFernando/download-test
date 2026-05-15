import YTdlpWrap from 'yt-dlp-wrap';
import fs from 'fs';
import path from 'path';

const isWin = process.platform === 'win32';
const BIN_DIR = path.join(process.cwd(), 'bin');
const BIN_PATH = path.join(BIN_DIR, isWin ? 'yt-dlp.exe' : 'yt-dlp');
const ytdlp = new YTdlpWrap(BIN_PATH);

async function setup() {
    if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR);
    }

    if (fs.existsSync(BIN_PATH)) {
        console.log('✅ yt-dlp ya está instalado en:', BIN_PATH);
        return;
    }

    console.log('⏳ Descargando yt-dlp binary (esto puede tardar un cachito)...');
    try {
        // El método downloadFromGithub baja el binario para la plataforma actual
        await YTdlpWrap.downloadFromGithub(BIN_PATH);
        
        // IMPORTANTE: En Linux/Docker necesitamos darle permisos de ejecución
        if (process.platform !== 'win32') {
            fs.chmodSync(BIN_PATH, '755');
            console.log('🔑 Permisos de ejecución otorgados a yt-dlp');
        }
        
        console.log('🚀 yt-dlp descargado con éxito en:', BIN_PATH);
    } catch (error) {
        console.error('❌ Error bajando yt-dlp:', error);
        process.exit(1);
    }
}

setup();
