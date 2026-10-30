import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Shared server-side Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION_KAK_BINTANG = `Kamu adalah "Kak Bintang", asisten guru belajar anak sekolah dasar (SD) di Indonesia yang ceria, suportif, sabar, hangat, dan ekspresif.
Tugasmu adalah menganalisis foto atau teks soal pekerjaan rumah (PR) siswa sesuai kurikulum sekolah dasar saat ini di Indonesia (Kurikulum Merdeka: Fase A untuk Kelas 1-2, Fase B untuk Kelas 3-4, atau Fase C untuk Kelas 5-6), lalu memberikan panduan penyelesaian langkah demi langkah yang mudah dipahami anak dan membantu orang tua mendampingi.

ATURAN PERAN & GAYA BAHASA:
1. Nada Bicara: Sangat natural, ramah, hangat, dan interaktif selayaknya guru les privat terbaik yang duduk di samping anak. Gunakan sapaan akrab seperti "Adik", "Sahabat Juara", atau "Kawan Bintang".
2. Kecepatan & Kepadatan (PENTING): Tuliskan penjelasan secara ringkas, to the point, padat nalar, dan hindari kata-kata bertele-tele agar hasil selesai dalam hitungan detik.
3. Dinamika Suara (Pacing & Intonasi): "skrip_audio_narasi" terdiri dari 3-4 kalimat santai, hangat, dan antusias dengan tanda baca (koma, titik, tanda seru, elipsis '...') untuk jeda napas yang pas saat dibacakan.
4. ATURAN ENDING NARASI (WAJIB): Kalimat penutup narasi suara WAJIB mengajak anak melihat dan membuka papan tulis virtual di bawahnya! Contoh kalimat penutup: "Nah, sekarang yuk kita buka langkah demi langkahnya di papan tulis digital di bawah ya!" atau "Yuk langsung lihat cara lengkap dan jawabannya di papan tulis virtual di bawah!".
5. Metode Pedagogi: Jangan mendikte jawaban di awal. Tuntun: apa yang diketahui & ditanyakan -> langkah nalar/perhitungan -> kesimpulan jawaban akhir yang rapi.
6. Validasi Kurikulum: Gunakan istilah Kurikulum Merdeka terkini.

FORMAT OUTPUT: Berikan respons HANYA dalam format JSON murni sesuai skema.`;

const PR_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ringkasan_materi: {
      type: Type.STRING,
      description: 'Mata pelajaran, kelas, dan topik bahasan (contoh: Matematika - Pecahan Campuran Kelas 5 SD)',
    },
    skrip_audio_narasi: {
      type: Type.STRING,
      description: 'Naskah lisan Kak Bintang yang ringkas (3-4 kalimat santai). Kalimat terakhir WAJIB mengarahkan ke papan tulis digital di bawah (contoh: "Yuk buka langkah demi langkahnya di papan tulis digital di bawah ya!")',
    },
    langkah_papan_tulis: {
      type: Type.ARRAY,
      description: '3 langkah pengerjaan bersih untuk papan tulis digital (Identifikasi, Proses, Jawaban Akhir)',
      items: {
        type: Type.OBJECT,
        properties: {
          urutan: { type: Type.INTEGER },
          judul_langkah: { type: Type.STRING },
          tampilan_layar: { type: Type.STRING },
        },
        required: ['urutan', 'judul_langkah', 'tampilan_layar'],
      },
    },
    tips_juara: {
      type: Type.STRING,
      description: '1 tips ringkas mudah ingat konsep ini di sekolah',
    },
    soal_latihan_serupa: {
      type: Type.STRING,
      description: '1 soal latihan tambahan serupa untuk uji mandiri anak',
    },
  },
  required: [
    'ringkasan_materi',
    'skrip_audio_narasi',
    'langkah_papan_tulis',
    'tips_juara',
    'soal_latihan_serupa',
  ],
};

// Robust fallback models for high speed & high demand spikes
const FALLBACK_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

// Helper: Format Gemini API errors into clean user-friendly messages
function formatGeminiError(error: any): string {
  if (!error) return 'Terjadi kendala saat memproses soal. Silakan coba lagi.';
  const msg = error.message || String(error);

  try {
    const parsed = typeof msg === 'string' && msg.trim().startsWith('{') ? JSON.parse(msg) : null;
    if (parsed?.error) {
      const code = parsed.error.code;
      const innerMsg = parsed.error.message || '';
      const status = parsed.error.status || '';

      if (code === 503 || status === 'UNAVAILABLE' || innerMsg.includes('high demand') || innerMsg.includes('temporarily')) {
        return 'Server Gemini sedang mengalami lonjakan antrean yang sangat tinggi dari Google. Sistem sudah mencoba model alternatif. Silakan tekan tombol "Coba Lagi" beberapa detik lagi.';
      }
      if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
        return 'Batas kuota layanan sementara sedang penuh. Mohon tunggu sejenak lalu tekan "Coba Lagi".';
      }
      if (code === 403 || status === 'PERMISSION_DENIED') {
        return 'Akses API belum memiliki izin. Silakan periksa konfigurasi API Key di menu Secrets.';
      }
      if (innerMsg) {
        return innerMsg;
      }
    }
  } catch {
    // Non-JSON error message
  }

  if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
    return 'Server sedang mengalami lonjakan antrean tinggi. Mohon tunggu beberapa saat dan tekan tombol "Coba Lagi".';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Batas permintaan sedang penuh. Mohon tunggu sejenak lalu coba kembali.';
  }

  return msg;
}

// Helper: Fast call with ThinkingLevel.LOW and instant fallback for sub-5-second analysis
async function generateContentWithRetry(params: {
  contents: any;
  config: any;
}): Promise<any> {
  let lastError: any = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const modelConfig = { ...params.config };
      // ThinkingLevel is only supported on Gemini 3 and Gemini 4 models
      // ThinkingLevel.LOW cuts latency down to ~1.5 - 2.5 seconds!
      if (modelName.startsWith('gemini-3') || modelName.startsWith('gemini-4')) {
        modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else {
        delete modelConfig.thinkingConfig;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: modelConfig,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Fast Fallback] ${modelName} error, immediately trying next model:`, err?.message);
    }
  }

  throw lastError;
}

// Helper: Extract File ID and type from Google Drive / Docs URL
function extractDriveFileId(url: string): { fileId: string; type: 'file' | 'doc' } | null {
  if (!url) return null;
  const docMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) return { fileId: docMatch[1], type: 'doc' };

  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (match) return { fileId: match[1], type: 'file' };

  const directIdMatch = url.match(/^[a-zA-Z0-9_-]{25,}$/);
  if (directIdMatch) return { fileId: directIdMatch[0], type: 'file' };

  return null;
}

// Helper: Download content from Google Drive
async function fetchFromGoogleDrive(fileId: string, type: 'file' | 'doc' = 'file'): Promise<{
  dataBase64?: string;
  mimeType: string;
  textContent?: string;
}> {
  // If Google Doc, export as plain text
  if (type === 'doc') {
    const docUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
    const docRes = await fetch(docUrl);
    if (docRes.ok) {
      const text = await docRes.text();
      return { mimeType: 'text/plain', textContent: text };
    }
  }

  // First try direct Google UserContent CDN (works quickly and reliably for shared drive images)
  const lh3Url = `https://lh3.googleusercontent.com/d/${fileId}`;
  try {
    const cdnRes = await fetch(lh3Url);
    if (cdnRes.ok) {
      const cType = cdnRes.headers.get('content-type') || 'image/jpeg';
      if (cType.startsWith('image/')) {
        const arr = await cdnRes.arrayBuffer();
        return {
          dataBase64: Buffer.from(arr).toString('base64'),
          mimeType: cType,
        };
      }
    }
  } catch (e) {
    console.warn('lh3 CDN fetch failed, trying uc download:', e);
  }

  // Fallback to export download
  const dlUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(dlUrl, { redirect: 'follow' });

  if (!res.ok) {
    throw new Error('Tidak dapat mengunduh berkas dari link Google Drive. Pastikan izin berbagi (sharing) sudah diatur ke "Siapa saja yang memiliki link" (Anyone with the link).');
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (contentType.includes('text/html')) {
    const htmlText = buffer.toString('utf-8');
    const confirmMatch = htmlText.match(/href="(\/uc\?export=download[^"]+)"/);
    if (confirmMatch) {
      const confirmUrl = `https://drive.google.com${confirmMatch[1].replace(/&amp;/g, '&')}`;
      const secondRes = await fetch(confirmUrl);
      if (secondRes.ok) {
        const secondArr = await secondRes.arrayBuffer();
        return {
          dataBase64: Buffer.from(secondArr).toString('base64'),
          mimeType: secondRes.headers.get('content-type') || 'image/jpeg',
        };
      }
    }
    throw new Error('File Google Drive tidak dapat diakses secara publik. Mohon ubah akses file di Google Drive menjadi "Siapa saja yang memiliki link" (Anyone with the link).');
  }

  return {
    dataBase64: buffer.toString('base64'),
    mimeType: contentType,
  };
}

// API Endpoint: Validasi dan Pratinjau Link Google Drive
app.post('/api/resolve-drive-link', async (req, res) => {
  try {
    const { driveUrl } = req.body;
    if (!driveUrl) {
      return res.status(400).json({ error: 'Link Google Drive wajib diisi.' });
    }

    const driveInfo = extractDriveFileId(driveUrl.trim());
    if (!driveInfo) {
      return res.status(400).json({
        error: 'Format link Google Drive tidak valid. Gunakan format seperti: https://drive.google.com/file/d/.../view atau https://docs.google.com/document/d/...',
      });
    }

    const fetched = await fetchFromGoogleDrive(driveInfo.fileId, driveInfo.type);

    return res.json({
      success: true,
      fileId: driveInfo.fileId,
      type: driveInfo.type,
      mimeType: fetched.mimeType,
      previewUrl: fetched.mimeType.startsWith('image/')
        ? `data:${fetched.mimeType};base64,${fetched.dataBase64}`
        : undefined,
      dataBase64: fetched.dataBase64,
      textContent: fetched.textContent,
    });
  } catch (error: any) {
    console.error('Error resolving Google Drive link:', error);
    return res.status(400).json({
      error: error.message || 'Gagal mengambil file dari Google Drive. Pastikan izin file sudah publik (Anyone with the link).',
    });
  }
});

// API Endpoint: Menganalisis Soal PR
app.post('/api/analyze-pr', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType, driveUrl, fase, mataPelajaran } = req.body;

    if (!prompt && !imageBase64 && !driveUrl) {
      return res.status(400).json({ error: 'Harap masukkan teks soal, unggah foto, atau cantumkan link Google Drive.' });
    }

    const contents: any[] = [];
    let resolvedImageBase64 = imageBase64;
    let resolvedMimeType = mimeType || 'image/jpeg';
    let extraDriveText = '';

    // Jika ada link Google Drive dan belum ada imageBase64
    if (driveUrl && !resolvedImageBase64) {
      const driveInfo = extractDriveFileId(driveUrl.trim());
      if (driveInfo) {
        try {
          const driveData = await fetchFromGoogleDrive(driveInfo.fileId, driveInfo.type);
          if (driveData.dataBase64) {
            resolvedImageBase64 = driveData.dataBase64;
            resolvedMimeType = driveData.mimeType;
          } else if (driveData.textContent) {
            extraDriveText = `\n[Isi Dokumen Google Drive]:\n${driveData.textContent}\n`;
          }
        } catch (driveErr: any) {
          return res.status(400).json({
            error: `Gagal membaca Google Drive: ${driveErr.message}`,
          });
        }
      }
    }

    // Jika ada gambar PR (dari upload langsung atau dari Google Drive)
    if (resolvedImageBase64) {
      const cleanBase64 = resolvedImageBase64.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: resolvedMimeType,
          data: cleanBase64,
        },
      });
    }

    // Tambahkan teks instruksi soal & preferensi kurikulum
    let userPromptText = `Bantu bahas soal PR siswa SD ini ya Kak Bintang!\n`;
    if (fase) {
      userPromptText += `Fase/Tingkat Kelas: ${fase}\n`;
    }
    if (mataPelajaran) {
      userPromptText += `Mata Pelajaran: ${mataPelajaran}\n`;
    }
    if (driveUrl) {
      userPromptText += `Sumber Soal: Link Google Drive (${driveUrl})\n`;
    }
    if (extraDriveText) {
      userPromptText += extraDriveText;
    }
    if (prompt) {
      userPromptText += `Catatan/Teks Soal dari Siswa: "${prompt}"\n`;
    } else {
      userPromptText += `Silakan baca dan transkripsikan soal yang tertera pada lembar PR di atas, lalu bimbing penyelesaiannya secara lengkap.\n`;
    }

    contents.push({
      text: userPromptText,
    });

    const response = await generateContentWithRetry({
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_KAK_BINTANG,
        responseMimeType: 'application/json',
        responseSchema: PR_RESPONSE_SCHEMA,
      },
    });

    const rawText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Fallback clean markdown if any
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error analyzing PR:', error);
    const friendlyError = formatGeminiError(error);
    return res.status(500).json({
      error: friendlyError,
    });
  }
});

// API Endpoint: Evaluasi Jawaban Soal Latihan Mandiri
app.post('/api/check-practice', async (req, res) => {
  try {
    const { soal, jawabanSiswa, ringkasanMateri } = req.body;

    if (!soal || !jawabanSiswa) {
      return res.status(400).json({ error: 'Soal dan jawaban siswa wajib diisi.' });
    }

    const checkPrompt = `Sebagai Kak Bintang, periksa jawaban murid SD berikut untuk soal latihan mandiri:
Materi: ${ringkasanMateri || 'Soal SD'}
Soal: "${soal}"
Jawaban Siswa: "${jawabanSiswa}"

Berikan evaluasi yang sangat hangat, menyemangati, dan edukatif:
1. Apakah jawabannya sudah tepat? (benar atau perlu sedikit diperbaiki)
2. Bintang apresiasi (1 sampai 3 bintang)
3. Penjelasan singkat yang mudah dipahami bila ada kekeliruan, atau pujian antusias bila tepat
4. Kalimat penyemangat khas Kak Bintang`;

    const response = await generateContentWithRetry({
      contents: checkPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_KAK_BINTANG,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            stars: { type: Type.INTEGER, description: '1, 2, atau 3 bintang' },
            headline: { type: Type.STRING, description: 'Contoh: Hebat Banget! / Sedikit Lagi Juara!' },
            feedback: { type: Type.STRING, description: 'Ulasan ramah nalar' },
            jawabanBenar: { type: Type.STRING, description: 'Jawaban dan pembahasan yang semestinya' },
            pesanPenyemangat: { type: Type.STRING, description: 'Pesan penyemangat hangat' },
          },
          required: ['isCorrect', 'stars', 'headline', 'feedback', 'pesanPenyemangat'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error checking practice:', error);
    const friendlyError = formatGeminiError(error);
    return res.status(500).json({
      error: friendlyError,
    });
  }
});

// API Endpoint: Generate Server-Side TTS Audio with Gemini 3.8 Flash Lite TTS
app.post('/api/generate-tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Teks narasi wajib diisi.' });
    }

    // Keep speech text concise for fast generation (< 1.5s)
    const trimmedText = text.slice(0, 320);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: trimmedText,
              speechMetadata: {
                style: 'Cheerful, warm, patient and expressive elementary school teacher speaking Indonesian',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('Audio tidak ditemukan dari respons model.');
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (error: any) {
    console.error('Error generating TTS audio:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan file audio suara.',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Tanya Guru API', character: 'Kak Bintang' });
});

// Production static file serving vs Vite development middleware
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Tanya Guru Server running on http://0.0.0.0:${port}`);
});
