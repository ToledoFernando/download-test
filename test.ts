import { getMetadata } from './downloader';

const TEST_URL = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ'; // Un video cortito de Big Buck Bunny o similar

async function test() {
    console.log('🧪 Probando obtención de metadata...');
    try {
        const info = await getMetadata(TEST_URL);
        console.log('✅ Metadata obtenida con éxito:');
        console.log(`📌 Título: ${info.title}`);
        console.log(`👤 Uploader: ${info.uploader}`);
        console.log(`⏱ Duración: ${info.duration} seg`);
    } catch (err) {
        console.error('❌ Falló el test de metadata:', err);
    }
}

test();
