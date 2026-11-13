/**
 * voiceRecorder.ts
 * Utilitas perekaman suara dan Speech-to-Text (Transkripsi Suara)
 * Mendukung izin perangkat, perekaman audio (MediaRecorder), dan pengenalan suara instan bahasa Indonesia (Web Speech API).
 */

export interface VoiceRecordingResult {
  transcript: string;
  audioUrl?: string;
  duration: number; // Dalam detik
}

export interface VoiceRecorderState {
  isRecording: boolean;
  duration: number;
  transcript: string;
  permissionStatus: 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';
  errorMessage: string | null;
}

// Deteksi dukungan browser
export function isAudioRecordingSupported(): boolean {
  return typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Controller Perekam Suara & Suara-ke-Teks
 */
export class VoiceRecorderController {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private speechRecognition: any = null;
  private timerInterval: any = null;
  private startTime: number = 0;

  private onStateChange: (state: Partial<VoiceRecorderState>) => void;
  private currentTranscript: string = '';
  private durationSeconds: number = 0;

  constructor(onStateChange: (state: Partial<VoiceRecorderState>) => void) {
    this.onStateChange = onStateChange;
  }

  /**
   * Cek status izin mikrofon saat ini (jika didukung Permissions API)
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (!isAudioRecordingSupported()) return 'unsupported';

    try {
      if (navigator.permissions && navigator.permissions.query) {
        // Query permission name 'microphone'
        const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        return status.state; // 'granted' | 'denied' | 'prompt'
      }
    } catch {
      // Beberapa browser tidak mendukung query 'microphone'
    }
    return 'prompt';
  }

  /**
   * Mulai merekam suara dan mendengarkan kata-kata pengguna
   */
  async startRecording(initialTranscript: string = ''): Promise<boolean> {
    if (!isAudioRecordingSupported()) {
      this.onStateChange({
        permissionStatus: 'unsupported',
        errorMessage: 'Peramban atau perangkat Anda belum mendukung perekaman audio mikrofon.',
      });
      return false;
    }

    this.onStateChange({
      permissionStatus: 'requesting',
      errorMessage: null,
    });

    this.currentTranscript = initialTranscript;
    this.durationSeconds = 0;
    this.audioChunks = [];

    // 1. Meminta izin akses mikrofon dari perangkat
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.onStateChange({
        permissionStatus: 'granted',
        errorMessage: null,
      });
    } catch (err: any) {
      console.warn('[VoiceRecorder] Gagal memperoleh izin mikrofon:', err);
      let errorMsg = 'Izin mikrofon ditolak oleh perangkat atau peramban.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Akses mikrofon ditolak. Silakan izinkan akses mikrofon pada setelan perangkat atau ikon kunci/izin di bilah alamat peramban Anda.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Perangkat keras mikrofon tidak terdeteksi pada perangkat Anda.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Mikrofon sedang digunakan oleh aplikasi lain.';
      }

      this.onStateChange({
        permissionStatus: 'denied',
        errorMessage: errorMsg,
        isRecording: false,
      });
      return false;
    }

    // 2. Inisialisasi MediaRecorder untuk merekam suara asli
    try {
      let mimeType = '';
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/aac',
      ];
      for (const type of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // Simpan chunk tiap 250ms
    } catch (recorderErr) {
      console.warn('[VoiceRecorder] MediaRecorder tidak dapat diinisialisasi:', recorderErr);
      // Lanjutkan jika speech recognition masih bisa
    }

    // 3. Inisialisasi Speech Recognition untuk transkripsi kata-kata secara instan
    if (isSpeechRecognitionSupported()) {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.lang = 'id-ID'; // Bahasa Indonesia
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;

        let accumulatedFinal = initialTranscript ? initialTranscript + ' ' : '';

        this.speechRecognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              accumulatedFinal += transcriptPiece + ' ';
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          const combined = (accumulatedFinal + interimTranscript).trim();
          this.currentTranscript = combined;
          this.onStateChange({ transcript: combined });
        };

        this.speechRecognition.onerror = (event: any) => {
          // Error non-fatal seperti 'no-speech' dibiarkan
          if (event.error !== 'no-speech') {
            console.warn('[VoiceRecorder] Speech recognition notice:', event.error);
          }
        };

        // Jika koneksi terputus saat masih merekam, sambungkan kembali
        this.speechRecognition.onend = () => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            try {
              this.speechRecognition?.start();
            } catch {
              // Ignore restart error
            }
          }
        };

        this.speechRecognition.start();
      } catch (speechErr) {
        console.warn('[VoiceRecorder] SpeechRecognition error:', speechErr);
      }
    }

    // 4. Timer perekaman
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      this.durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      this.onStateChange({ duration: this.durationSeconds });
    }, 500);

    this.onStateChange({
      isRecording: true,
      duration: 0,
      transcript: this.currentTranscript,
      errorMessage: null,
    });

    return true;
  }

  /**
   * Hentikan perekaman dan kembalikan hasil audio & teks transkripsi
   */
  async stopRecording(): Promise<VoiceRecordingResult> {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop Speech Recognition
    if (this.speechRecognition) {
      try {
        this.speechRecognition.onend = null;
        this.speechRecognition.stop();
      } catch {
        // Ignore
      }
      this.speechRecognition = null;
    }

    const finalDuration = this.durationSeconds || Math.max(1, Math.floor((Date.now() - this.startTime) / 1000));

    // Stop MediaRecorder dan dapatkan audio Data URL
    let audioUrl: string | undefined = undefined;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) return resolve();
        this.mediaRecorder.onstop = () => resolve();
        try {
          this.mediaRecorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Konversi audio chunks menjadi data URL
    if (this.audioChunks.length > 0) {
      try {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        audioUrl = await blobToDataUrl(audioBlob);
      } catch (e) {
        console.warn('[VoiceRecorder] Gagal mengonversi blob audio:', e);
      }
    }

    // Lepaskan stream perangkat agar indikator mikrofon mati
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.onStateChange({
      isRecording: false,
      duration: finalDuration,
    });

    let finalText = this.currentTranscript.trim();
    if (!finalText) {
      finalText = `[Catatan Suara] Rekaman suara instan (${formatAudioDuration(finalDuration)})`;
    }

    return {
      transcript: finalText,
      audioUrl,
      duration: finalDuration,
    };
  }

  /**
   * Batalkan perekaman dan bersihkan seluruh stream
   */
  cancelRecording(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.speechRecognition) {
      try {
        this.speechRecognition.onend = null;
        this.speechRecognition.stop();
      } catch {
        // Ignore
      }
      this.speechRecognition = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.audioChunks = [];
    this.currentTranscript = '';
    this.durationSeconds = 0;

    this.onStateChange({
      isRecording: false,
      duration: 0,
      transcript: '',
      errorMessage: null,
    });
  }
}

/**
 * Konversi audio blob ke data URL (base64) agar bisa disimpan permanen di localStorage / Supabase
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Format durasi audio (detik -> mm:ss)
 */
export function formatAudioDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
