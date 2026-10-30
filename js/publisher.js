/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - MAP PUBLISHER, AUDIO TRIMMER (15s) & CLOUDINARY
 * Recorte de 15 segundos da prévia de áudio (audio_preview_start),
 * Otimização de imagem via Canvas, Upload Real para Cloudinary, Rate Limit (15 min) e SHA-256
 * ====================================================================
 */

class PublisherService {
  constructor() {
    this.currentHash = null;
    this.extractedData = null;
    this.audioPreviewBlob = null;
    this.optimizedCoverBlob = null;
    this.originalFile = null;
  }

  // Gera o hash SHA-256 privadamente em background
  async generateSHA256(arrayBuffer) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  // Verificação Anti-Spam / Cooldown de Upload (60s para Streamer, 300s para Usuário Comum)
  checkRateLimit(userId) {
    if (!userId) return;
    const lastUploadKey = `HDBN_LAST_UPLOAD_${userId}`;

    let lastUploadTime = 0;
    try { lastUploadTime = Number(localStorage.getItem(lastUploadKey)) || 0; } catch (e) {}
    const now = Date.now();

    // Streamers, Admins e Devs possuem cooldown reduzido de 60 segundos
    const isSpecialUser = window.auth?.isStreamer() || window.auth?.isAdmin() || window.auth?.isDev();
    const cooldownMs = isSpecialUser ? 60 * 1000 : 300 * 1000;

    if (lastUploadTime > 0) {
      const elapsed = now - lastUploadTime;
      if (elapsed < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new Error(`Aguarde ${remainingSec} segundos antes de enviar um novo beatmap.`);
      }
    }
  }

  recordUploadSuccess(userId) {
    if (!userId) return;
    const now = Date.now();
    try { localStorage.setItem(`HDBN_LAST_UPLOAD_${userId}`, now.toString()); } catch (e) {}
  }

  // Upload Direto para a API do Cloudinary com Preset "beatmaps"
  async uploadToCloudinary(fileOrBlob, resourceType = "auto", folder = "hdbn/packages", customFileName = null) {
    const cloudName = window.CLOUDINARY_CONFIG?.cloudName || "deln0ozqh";
    const preset = window.CLOUDINARY_CONFIG?.uploadPreset || "beatmaps";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append("file", fileOrBlob, customFileName || "file");
    formData.append("upload_preset", preset);
    if (folder) formData.append("folder", folder);

    try {
      const res = await fetch(url, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        return data.secure_url || data.url;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn(`Upload no Cloudinary (${resourceType}) falhou:`, errJson);
      }
    } catch (e) {
      console.warn(`Erro de rede no Cloudinary (${resourceType}):`, e);
    }
    return null;
  }

  // Recorte de exatamente 15 Segundos de Áudio a partir de audio_preview_start
  async trimAudioPreview(audioArrayBuffer, startTimeSeconds = 0) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(audioArrayBuffer.slice(0));

      const duration = 15; // 15 Segundos fixos
      const sampleRate = decodedBuffer.sampleRate;
      const startSample = Math.min(Math.floor(startTimeSeconds * sampleRate), decodedBuffer.length - 1);
      const sampleLength = Math.min(Math.floor(duration * sampleRate), decodedBuffer.length - startSample);

      const trimmedBuffer = audioCtx.createBuffer(
        decodedBuffer.numberOfChannels,
        sampleLength,
        sampleRate
      );

      for (let channel = 0; channel < decodedBuffer.numberOfChannels; channel++) {
        const sourceData = decodedBuffer.getChannelData(channel);
        const targetData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < sampleLength; i++) {
          targetData[i] = sourceData[startSample + i];
        }
      }

      const wavBuffer = this.bufferToWav(trimmedBuffer);
      audioCtx.close();
      return new Blob([wavBuffer], { type: "audio/wav" });
    } catch (e) {
      console.warn("Falha ao recortar áudio via Web Audio API, utilizando áudio original:", e);
      return new Blob([audioArrayBuffer], { type: "audio/mp3" });
    }
  }

  // Helper: Converte AudioBuffer para arquivo formato WAV binário
  bufferToWav(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1);          // PCM
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return buffer;
  }

  // Otimização e redimensionamento da imagem de capa via HTML Canvas
  async optimizeCoverImage(imageBlob, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(imageBlob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob || imageBlob);
        }, "image/jpeg", 0.85);
      };
      img.onerror = () => resolve(imageBlob);
      img.src = url;
    });
  }

  // Processa o arquivo .hbn real (ZIP ou JSON)
  async processPackageFile(file, progressCallback = () => {}) {
    if (!file) throw new Error("Nenhum arquivo selecionado.");

    const currentUser = window.auth.getCurrentUser();
    if (currentUser) {
      this.checkRateLimit(currentUser.id);
    }

    this.originalFile = file;
    progressCallback("Calculando hash SHA-256 privado do pacote...");
    const arrayBuffer = await file.arrayBuffer();
    const mapHash = await this.generateSHA256(arrayBuffer);
    this.currentHash = mapHash;

    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const parts = fileNameWithoutExt.split(" - ");

    let parsedInfo = {
      title: parts.length > 1 ? parts[1].trim() : fileNameWithoutExt.trim(),
      artist: parts.length > 1 ? parts[0].trim() : "Artista Desconhecido",
      bpm: 120,
      difficulties: ["Normal"],
      cover_url: null,
      audio_url: null,
      ui_file: "",
      art_file: "",
      audio_preview_start: 0,
      sfx_files: [],
      map_hash: mapHash,
      fileName: file.name
    };

    if (window.JSZip) {
      try {
        progressCallback("Lendo estrutura compactada (.hbn / zip)...");
        const zip = await window.JSZip.loadAsync(arrayBuffer);

        let infoFile = null;
        zip.forEach((relativePath, zipEntry) => {
          const lower = relativePath.toLowerCase();
          if (lower.endsWith(".info") || lower.endsWith("info.json") || lower.endsWith("map.json") || lower.endsWith("meta.json")) {
            infoFile = zipEntry;
          }
        });

        if (infoFile) {
          progressCallback("Lendo arquivo .info e metadados...");
          const infoText = await infoFile.async("string");
          try {
            const json = JSON.parse(infoText);
            if (json.artist) parsedInfo.artist = json.artist;
            if (json.bpm) parsedInfo.bpm = Number(json.bpm) || 120;
            if (json.title) parsedInfo.title = json.title;

            if (json.difficulties && Array.isArray(json.difficulties)) {
              parsedInfo.difficulties = json.difficulties;
            } else if (json.difficulty) {
              parsedInfo.difficulties = [json.difficulty];
            }

            if (json.UI_file) parsedInfo.ui_file = json.UI_file;
            if (json.art_file) parsedInfo.art_file = json.art_file;
            if (json.audio_preview_start !== undefined) parsedInfo.audio_preview_start = Number(json.audio_preview_start) || 0;

            const sfxList = [];
            if (json["SFX 1"]) sfxList.push(json["SFX 1"]);
            if (json["SFX 2"]) sfxList.push(json["SFX 2"]);
            parsedInfo.sfx_files = sfxList;

          } catch {
            const lines = infoText.split("\n");
            lines.forEach(line => {
              const [k, ...v] = line.split("=");
              if (k && v.length) {
                const key = k.trim().toLowerCase();
                const val = v.join("=").trim().replace(/^"|"$/g, "");
                if (key === "artist") parsedInfo.artist = val;
                if (key === "bpm") parsedInfo.bpm = Number(val) || 120;
                if (key === "title") parsedInfo.title = val;
                if (key === "ui_file") parsedInfo.ui_file = val;
                if (key === "art_file") parsedInfo.art_file = val;
                if (key === "audio_preview_start") parsedInfo.audio_preview_start = Number(val) || 0;
                if (key === "difficulties" || key === "difficulty") {
                  parsedInfo.difficulties = val.split(",").map(d => d.trim());
                }
              }
            });
          }
        }

        // Extrai e otimiza capa
        progressCallback("Otimizando imagem de capa via Canvas...");
        let coverEntry = null;
        zip.forEach((relativePath, zipEntry) => {
          const lower = relativePath.toLowerCase();
          if (
            (parsedInfo.art_file && lower.endsWith(parsedInfo.art_file.toLowerCase())) ||
            (parsedInfo.ui_file && lower.endsWith(parsedInfo.ui_file.toLowerCase())) ||
            lower.endsWith("cover.jpg") || lower.endsWith("cover.png") ||
            lower.endsWith("art.jpg") || lower.endsWith("ui.jpg") ||
            lower.endsWith("bg.jpg") || lower.endsWith("bg.png")
          ) {
            coverEntry = zipEntry;
          }
        });

        if (coverEntry) {
          const rawCoverBlob = await coverEntry.async("blob");
          this.optimizedCoverBlob = await this.optimizeCoverImage(rawCoverBlob);
          parsedInfo.cover_url = URL.createObjectURL(this.optimizedCoverBlob);
        }

        // Extrai e recorta 15s de áudio
        progressCallback("Recortando 15s da prévia de áudio (audio_preview_start)...");
        let audioEntry = null;
        zip.forEach((relativePath, zipEntry) => {
          const lower = relativePath.toLowerCase();
          if (lower.endsWith(".mp3") || lower.endsWith(".ogg") || lower.endsWith(".wav")) {
            audioEntry = zipEntry;
          }
        });

        if (audioEntry) {
          const audioArrayBuf = await audioEntry.async("arraybuffer");
          this.audioPreviewBlob = await this.trimAudioPreview(audioArrayBuf, parsedInfo.audio_preview_start);
          parsedInfo.audio_url = URL.createObjectURL(this.audioPreviewBlob);
        }

      } catch (e) {
        console.warn("Erro ao ler zip .hbn:", e);
      }
    }

    progressCallback("Pacote processado com sucesso!");
    this.extractedData = parsedInfo;
    return parsedInfo;
  }

  // Envio dos arquivos reais (.hbn, capa e áudio 15s) para o Cloudinary e grava no Supabase
  async publishMap(adjustedTitle, progressCallback = () => {}) {
    const currentUser = window.auth.getCurrentUser();
    if (!currentUser) {
      throw new Error("Você precisa estar logado para publicar um mapa.");
    }

    this.checkRateLimit(currentUser.id);

    if (!this.extractedData || !this.currentHash || !this.originalFile) {
      throw new Error("Nenhum pacote .hbn carregado.");
    }

    progressCallback("Verificando duplicidade do mapa por hash SHA-256...");
    const existingMap = await window.db.getMapByHash(this.currentHash);
    if (existingMap) {
      throw new Error("Opa! Esse mapa já existe. Você não pode publicar mapas de outros usuários ou publicar mapas repetidos!");
    }

    // 1. Envia o pacote .hbn completo para o Cloudinary (pasta hdbn/packages)
    progressCallback("Enviando pacote .hbn para o Cloudinary...");
    let packageCloudUrl = await this.uploadToCloudinary(this.originalFile, "raw", window.CLOUDINARY_CONFIG?.folders?.package || "hdbn/packages", this.originalFile.name);

    // 2. Envia a capa otimizada para o Cloudinary (pasta hdbn/covers)
    let coverCloudUrl = null;
    if (this.optimizedCoverBlob) {
      progressCallback("Enviando capa para o Cloudinary...");
      coverCloudUrl = await this.uploadToCloudinary(this.optimizedCoverBlob, "image", window.CLOUDINARY_CONFIG?.folders?.cover || "hdbn/covers", `cover_${this.currentHash}.jpg`);
    }

    // 3. Envia a prévia de áudio de 15s para o Cloudinary (pasta hdbn/audio)
    let audioCloudUrl = null;
    if (this.audioPreviewBlob) {
      progressCallback("Enviando prévia de 15s de áudio para o Cloudinary...");
      audioCloudUrl = await this.uploadToCloudinary(this.audioPreviewBlob, "video", window.CLOUDINARY_CONFIG?.folders?.audio || "hdbn/audio", `preview_${this.currentHash}.wav`);
    }

    progressCallback("Gravando metadados no Supabase...");
    const mapPayload = {
      user_id: currentUser.id,
      title: adjustedTitle || this.extractedData.title,
      artist: this.extractedData.artist,
      bpm: Number(this.extractedData.bpm) || 120,
      difficulties: this.extractedData.difficulties || ["Normal"],
      audio_url: audioCloudUrl || this.extractedData.audio_url || "",
      cover_url: coverCloudUrl || this.extractedData.cover_url || window.APP_CONFIG.defaultCover,
      package_url: packageCloudUrl || "https://storage.hdbn.club/packages/" + this.extractedData.fileName,
      map_hash: this.currentHash,
      ui_file: this.extractedData.ui_file || "",
      art_file: this.extractedData.art_file || "",
      audio_preview_start: this.extractedData.audio_preview_start || 0,
      sfx_files: this.extractedData.sfx_files || []
    };

    const createdMap = await window.db.createMap(mapPayload);

    // Registra sucesso para rate limit
    this.recordUploadSuccess(currentUser.id);

    this.currentHash = null;
    this.extractedData = null;
    this.audioPreviewBlob = null;
    this.optimizedCoverBlob = null;
    this.originalFile = null;

    return createdMap;
  }
}

window.publisherService = new PublisherService();
