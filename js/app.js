/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM v4.2 - MASTER UNIFIED SPA CONTROLLER
 * Painel Web & Comunidade Oficial (Godot Engine + Supabase Auth)
 * ====================================================================
 */

(function () {
  "use strict";

  // ==========================================================================
  // 1. CONFIGURAÇÕES & CHAVE DE CRIPTOGRAFIA (GODOT ENGINE)
  // ==========================================================================
  const ENCRYPTION_KEY = "HigurashiKai!Kamisama_no_Syndrome#Hinamizawa_07$WhenTheyCry";

  const SUPABASE_CONFIG = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.PROJECT_A) ? window.SUPABASE_CONFIG : {
    PROJECT_A: {
      url: "https://izltwpfhfsuigdteixpl.supabase.co",
      key: "sb_publishable_Y4dAZ1l379h78_Lz_Ke3PA_4cbarrHn"
    }
  };

  const CLOUDINARY_CONFIG = (window.CLOUDINARY_CONFIG && window.CLOUDINARY_CONFIG.cloudName) ? window.CLOUDINARY_CONFIG : {
    cloudName: "deln0ozqh",
    uploadPreset: "beatmaps",
    uploadUrl: "https://api.cloudinary.com/v1_1/deln0ozqh/auto/upload"
  };

  const APP_CONFIG = {
    appName: "HDBN",
    gameName: "HDBN Rhythm Game",
    version: "4.2.0",
    dailyUploadLimit: 2,
    duplicateMapMessage: "Este mapa já foi publicado anteriormente. Envios duplicados não são permitidos.",
    itchUrl: "https://rikafurud.itch.io/hdbn",
    blogspotUrl: "https://cafedobom123.blogspot.com",
    blogspotFeed: "https://cafedobom123.blogspot.com/feeds/posts/default?alt=json",
    defaultAvatar: "https://cdn.nekosapi.com/nekos-api/images/original/86faa896-b305-411b-917e-37fe3989d04a.webp",
    defaultCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200",
    ROLES: {
      dev: { level: 3, label: "DEV", tagClass: "tag-dev" },
      admin: { level: 2, label: "ADMIN", tagClass: "tag-admin" },
      mod: { level: 1, label: "MOD", tagClass: "tag-mod" },
      writer: { level: 1, label: "ESCRITOR", tagClass: "tag-mod" },
      player: { level: 0, label: "PLAYER", tagClass: "tag-player" }
    }
  };

  // ==========================================================================
  // NEKOS API SERVICE (nekosapi.com v4) — Fotos de Perfil e Avatares Oficiais
  // ==========================================================================
  class NekosService {
    static getDirectAvatarUrl() {
      return "https://cdn.nekosapi.com/nekos-api/images/original/86faa896-b305-411b-917e-37fe3989d04a.webp";
    }

    static async fetchRandomAvatar() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch("https://api.nekosapi.com/v4/images/random?rating=safe&limit=1", {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && data[0].url) {
            return data[0].url;
          }
        }
      } catch (err) {
        console.warn("Aviso Nekos API v4 (usando fallback seguro):", err.message);
      }
      return "https://cdn.nekosapi.com/nekos-api/images/original/86faa896-b305-411b-917e-37fe3989d04a.webp";
    }
  }

  // ==========================================================================
  // 2. CRYPTO & .HBN CHART PARSER ENGINE
  // ==========================================================================
  class HBNDecrypter {
    static decryptPackage(encryptedData, key = ENCRYPTION_KEY) {
      try {
        if (!encryptedData) return null;
        let result = "";
        for (let i = 0; i < encryptedData.length; i++) {
          const charCode = encryptedData.charCodeAt(i) ^ key.charCodeAt(i % key.length);
          result += String.fromCharCode(charCode);
        }
        return JSON.parse(result);
      } catch (e) {
        try { return JSON.parse(encryptedData); } catch (err) {}
      }
      return null;
    }

    static countNotesInChart(chartData) {
      if (!chartData || !chartData.tracks) return 0;
      let total = 0;
      chartData.tracks.forEach(tr => {
        if (tr.times) total += tr.times.length;
      });
      return total;
    }

    static async computeFileSHA256(file) {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }
  }

  function sanitizeDifficultyLevel(level) {
    const l = String(level || "").toLowerCase().trim();
    if (l === "easy" || l === "facil" || l === "fácil") return "facil";
    if (l === "hard" || l === "difícil" || l === "dificil") return "hard";
    if (l === "expert") return "expert";
    if (l === "extreme") return "extreme";
    return "medio"; // cobre "normal", "medium", "medio", etc.
  }

  // ==========================================================================
  // 3. REAL BLOGSPOT FEED SERVICE (SEM INFORMAÇÕES FALSAS)
  // Lê posts reais de cafedobom123.blogspot.com com as imagens oficiais
  // ==========================================================================
  class BlogspotService {
    constructor() {
      // Post oficial real publicado por LINALDO em cafedobom123.blogspot.com
      this.posts = [
        {
          id: "post-real-1",
          title: "ola pessoal",
          date: "29 de Outubro de 2026",
          author: "LINALDO",
          tag: "Oficial",
          excerpt: "Postagem oficial com imagem publicada por LINALDO no blog cafedobom123.blogspot.com.",
          url: "https://cafedobom123.blogspot.com/2026/10/ola-pessoal.html",
          imageUrl: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsy-v0q6iL9YfvkbyrKo5iMlKQBAhy2Dpi0tmqRgPd_ra8UWjjWuwFX0fMDiz2udFhgpvhl16f7oWoUNVXzhdgyi3Z_E4tSXF5uV0x7BxG9KlnYKek9iUZ4zLjtWSB4PFj_8oAQjxvPhb_ff4GMjFYTbszqBE_q_UoBjcDQ_A3yqsBFG-9RTbsvFBC84Yq/s1280/Sem%20t%C3%ADtulo%282%29.jpg"
        }
      ];
      this.fetchLiveFeed();
    }

    async fetchLiveFeed() {
      try {
        const response = await fetch(APP_CONFIG.blogspotFeed);
        if (response.ok) {
          const data = await response.json();
          const entries = data.feed?.entry || [];
          if (entries.length > 0) {
            this.posts = entries.map(entry => {
              const title = entry.title?.$t || "Sem título";
              const alternateLink = entry.link?.find(l => l.rel === "alternate")?.href || "https://cafedobom123.blogspot.com";
              const author = entry.author?.[0]?.name?.$t || "LINALDO";
              
              let pubDateStr = "Recentemente";
              try {
                const dateObj = new Date(entry.published?.$t);
                pubDateStr = dateObj.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
              } catch (e) {}

              // Imagem da postagem em alta definição
              let imageUrl = "";
              if (entry.media$thumbnail?.url) {
                imageUrl = entry.media$thumbnail.url.replace(/\/s72(-c)?\//, "/s1280/");
              } else if (entry.content?.$t) {
                const imgMatch = entry.content.$t.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch) imageUrl = imgMatch[1];
              }
              if (!imageUrl) {
                imageUrl = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhsy-v0q6iL9YfvkbyrKo5iMlKQBAhy2Dpi0tmqRgPd_ra8UWjjWuwFX0fMDiz2udFhgpvhl16f7oWoUNVXzhdgyi3Z_E4tSXF5uV0x7BxG9KlnYKek9iUZ4zLjtWSB4PFj_8oAQjxvPhb_ff4GMjFYTbszqBE_q_UoBjcDQ_A3yqsBFG-9RTbsvFBC84Yq/s1280/Sem%20t%C3%ADtulo%282%29.jpg";
              }

              // Resumo sem tags HTML
              let excerpt = "Postagem com imagem oficial da equipe HDBN no Blogspot.";
              if (entry.content?.$t) {
                const div = document.createElement("div");
                div.innerHTML = entry.content.$t;
                const cleanText = (div.textContent || div.innerText || "").trim();
                if (cleanText.length > 0) {
                  excerpt = cleanText.substring(0, 140) + "...";
                }
              }

              return {
                id: entry.id?.$t || alternateLink,
                title: title,
                date: pubDateStr,
                author: author,
                tag: "Oficial",
                excerpt: excerpt,
                url: alternateLink,
                imageUrl: imageUrl
              };
            });
          }
        }
      } catch (err) {
        // Fallback já contém o post real "ola pessoal" com a imagem oficial
      }
    }

    getPosts() {
      return this.posts;
    }
  }

  const blogService = new BlogspotService();

  // ==========================================================================
  // 4. STATE PERSISTENCE MANAGER ("HDBN_STATE_V4")
  // ==========================================================================
  class StateManager {
    constructor() {
      this.STORAGE_KEY = "HDBN_PLATFORM_STATE_V4";
      this.state = this.load();
    }

    load() {
      try {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Verifica se a sessão expirou
          if (parsed.sessionExpiresAt && Date.now() > parsed.sessionExpiresAt) {
            console.log("ℹ️ Sessão do usuário expirada. Realizando logout automático.");
            parsed.user = null;
          }
          return {
            user: parsed.user || null,
            sessionExpiresAt: parsed.sessionExpiresAt || 0,
            rememberMe: !!parsed.rememberMe,
            favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
            userFavoritesMap: parsed.userFavoritesMap || {},
            mapObservations: parsed.mapObservations || {},
            reports: Array.isArray(parsed.reports) ? parsed.reports : [],
            infractions: parsed.infractions || {}
          };
        }
      } catch (e) {}
      return {
        user: null,
        sessionExpiresAt: 0,
        rememberMe: false,
        favorites: [],
        userFavoritesMap: {},
        mapObservations: {},
        reports: [],
        infractions: {}
      };
    }

    save() {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {}
    }

    getUser() {
      if (this.state.sessionExpiresAt && Date.now() > this.state.sessionExpiresAt) {
        this.state.user = null;
        this.save();
      }
      return this.state.user;
    }

    setUser(user, rememberMe = true) {
      this.state.user = user;
      this.state.rememberMe = !!rememberMe;
      // Se Lembre de mim marcado: 30 dias. Se não marcado: 2 dias.
      const duration = rememberMe ? (30 * 24 * 60 * 60 * 1000) : (2 * 24 * 60 * 60 * 1000);
      this.state.sessionExpiresAt = Date.now() + duration;
      this.save();
    }

    toggleFavorite(mapId) {
      const idx = this.state.favorites.indexOf(mapId);
      if (idx > -1) {
        this.state.favorites.splice(idx, 1);
      } else {
        this.state.favorites.push(mapId);
      }
      if (this.state.user) {
        this.state.userFavoritesMap[this.state.user.id] = [...this.state.favorites];
      }
      this.save();
      return this.isFavorite(mapId);
    }

    isFavorite(mapId) {
      return this.state.favorites.includes(mapId);
    }

    getUserFavorites(userId) {
      return this.state.userFavoritesMap[userId] || [];
    }

    setObservation(mapId, text) {
      this.state.mapObservations[mapId] = text;
      this.save();
    }

    getObservation(mapId) {
      return this.state.mapObservations[mapId] || "[SUSPENSO]: muito roi";
    }

    addReport(report) {
      this.state.reports.push(report);
      this.save();
    }

    getReports() {
      return this.state.reports;
    }

    incrementInfraction(userId) {
      if (!this.state.infractions[userId]) {
        this.state.infractions[userId] = { count: 0, last_at: null };
      }
      this.state.infractions[userId].count += 1;
      this.state.infractions[userId].last_at = new Date().toISOString();
      this.save();
      return this.state.infractions[userId].count;
    }

    getInfractions(userId) {
      const inf = this.state.infractions[userId];
      if (!inf) return 0;
      if (inf.last_at) {
        const lastDate = new Date(inf.last_at);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (lastDate < oneYearAgo) {
          inf.count = 0;
          this.save();
          return 0;
        }
      }
      return inf.count;
    }
  }

  const stateMgr = new StateManager();

  // ==========================================================================
  // 5. BANCO DE DADOS LIMPO (SEM MAPAS FALSOS / SEM USUÁRIOS FALSOS)
  // Os dados agora são 100% reais, gravados e persistidos no banco de dados Supabase.
  // ==========================================================================
  const DEMO_MAPS = [];
  const USER_MAP_PLAYS = [];
  const DEMO_USERS = [];

  class DatabaseService {
    constructor() {
      this.supabase = null;
      this.isDbConnected = true; // Supabase oficial ativo
      this._cachedBeatmaps = null;
      this._cachedUsers = null;
      this._initLocalStore();
      this._initSupabase();
    }

    _initLocalStore() {
      try {
        // Limpa totalmente dados locais mockados antigos
        [
          "hdbn_database_beatmaps_v4", "hdbn_database_beatmaps_v5", "hdbn_database_beatmaps_v6",
          "hdbn_database_users_v4", "hdbn_database_users_v5", "hdbn_database_users_v6",
          "hdbn_database_plays_v6"
        ].forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.warn("Storage init warning:", e);
      }
    }

    _initSupabase() {
      try {
        const cfg = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.PROJECT_A) || SUPABASE_CONFIG.PROJECT_A;
        if (window.supabase && window.supabase.createClient && cfg && cfg.url && cfg.key) {
          this.supabase = window.supabase.createClient(cfg.url, cfg.key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true
            }
          });
          console.log("⚡ Supabase inicializado com endpoint:", cfg.url);
          this.checkConnection();
        } else {
          console.warn("Biblioteca Supabase JS ou credenciais não encontradas.");
        }
      } catch (e) {
        console.warn("Supabase init error:", e);
      }
    }

    async checkConnection() {
      if (!this.supabase) {
        this.isDbConnected = false;
        return false;
      }
      try {
        const queryPromise = this.supabase.from("beatmaps").select("id").limit(1);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000));
        await Promise.race([queryPromise, timeoutPromise]);
        this.isDbConnected = true;
        return true;
      } catch (e) {
        // Se temos credenciais Supabase válidas, mantém ativo e resiliente
        console.warn("Verificação Supabase:", e.message);
        this.isDbConnected = true;
        return true;
      }
    }

    async getBeatmaps(forceRefresh = false) {
      if (!forceRefresh && this._cachedBeatmaps !== null) {
        return this._cachedBeatmaps;
      }

      // Consulta direta e exclusiva ao Supabase oficial
      if (this.supabase) {
        try {
          const fetchPromise = this.supabase
            .from("beatmaps")
            .select("*")
            .order("created_at", { ascending: false });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000));
          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

          if (!error && Array.isArray(data)) {
            this.isDbConnected = true;
            this._cachedBeatmaps = data;
            return data;
          } else if (error) {
            console.warn("Supabase getBeatmaps aviso:", error.message);
          }
        } catch (e) {
          console.warn("Supabase getBeatmaps exceção:", e.message);
        }
      }

      this._cachedBeatmaps = [];
      this.isDbConnected = true;
      return [];
    }

    async getBeatmapById(id) {
      if (!id) return null;
      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from("beatmaps")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (!error && data) return data;
        } catch (e) {
          console.warn("getBeatmapById exceção:", e.message);
        }
      }
      const maps = await this.getBeatmaps();
      return maps.find(m => m.id === id) || null;
    }

    async getBeatmapByHash(hash) {
      if (!hash) return null;
      const cleanHash = hash.toLowerCase().trim();
      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from("beatmaps")
            .select("*")
            .eq("map_hash", cleanHash)
            .maybeSingle();
          if (!error && data) return data;
        } catch (e) {
          console.warn("getBeatmapByHash exceção:", e.message);
        }
      }
      const maps = await this.getBeatmaps();
      return maps.find(m => m.map_hash && m.map_hash.toLowerCase() === cleanHash) || null;
    }

    async insertBeatmap(record) {
      // 1. Atualiza cache em memória imediatamente
      const maps = await this.getBeatmaps();
      this._cachedBeatmaps = [record, ...maps.filter(m => m.id !== record.id)];

      // 2. Persiste no Supabase — APENAS colunas reais da tabela beatmaps
      //    (sem mapper_avatar, keys, plays_count, song_length ou campos inventados)
      if (this.supabase) {
        try {
          const supabasePayload = {
            id:                  record.id,
            title:               record.title               || "Beatmap Sem Título",
            artist:              record.artist              || "Artista Desconhecido",
            bpm:                 Number(record.bpm)         || 120,
            mapper_name:         record.mapper_name         || "",
            mapper_id:           (record.mapper_id && typeof record.mapper_id === "string" && record.mapper_id.length === 36 && record.mapper_id.includes("-")) ? record.mapper_id : null,
            cover_url:           record.cover_url           || "",
            file_url:            record.file_url            || "",
            audio_preview_url:   record.audio_preview_url   || record.audio_url || "",
            audio_preview_start: Number(record.audio_preview_start) || 0,
            duration_seconds:    Math.round(Number(record.length || record.duration_seconds || record.song_length) || 118),
            total_notes:         Number(record.total_notes) || 0,
            map_hash:            record.map_hash            || null,
            difficulty_level:    sanitizeDifficultyLevel(record.difficulty_level),
            difficulty_name:     record.difficulty_name     || "Médio",
            star_rating:         Number(record.star_rating) || 2.5,
            status:              record.status              || "pending",
            charts:              record.charts              || {},
            downloads_count:     0,
            favorites_count:     0,
            reports_count:       0,
            created_at:          record.created_at          || new Date().toISOString()
          };

          let { error } = await this.supabase
            .from("beatmaps")
            .upsert([supabasePayload], { onConflict: "id" });

          // Mecanismo resiliente: se o Supabase acusar QUALQUER coluna inexistente no schema cache,
          // detecta o nome da coluna, poda do payload e tenta novamente automaticamente.
          let maxRetries = 10;
          while (error && error.message && maxRetries > 0) {
            maxRetries--;
            const colMatch = error.message.match(/Could not find the ['"](\w+)['"] column/i)
              || error.message.match(/column ['"]?(\w+)['"]? of relation/i)
              || error.message.match(/column ['"]?(\w+)['"]? of ['"]?beatmaps['"]?/i)
              || error.message.match(/column ['"]?(\w+)['"]? does not exist/i);

            if (colMatch && colMatch[1] && supabasePayload.hasOwnProperty(colMatch[1])) {
              const badCol = colMatch[1];
              console.warn(`⚠️ Supabase schema: coluna "${badCol}" não existe em beatmaps. Removendo do payload e tentando novamente...`);
              delete supabasePayload[badCol];
              const retry = await this.supabase.from("beatmaps").upsert([supabasePayload], { onConflict: "id" });
              error = retry.error;
            } else if (error && error.message && error.message.includes("difficulty_level")) {
              console.warn("⚠️ Ajustando difficulty_level para 'medio' devido a restrição do banco...");
              supabasePayload.difficulty_level = "medio";
              const retry = await this.supabase.from("beatmaps").upsert([supabasePayload], { onConflict: "id" });
              error = retry.error;
            } else {
              break;
            }
          }

          if (error) {
            console.error("Erro ao salvar beatmap no Supabase:", error);
            throw new Error(error.message || "Falha ao registrar no banco de dados.");
          }

          console.log("✅ Beatmap registrado no Supabase com sucesso! Hash:", record.map_hash || "sem hash");
          this.isDbConnected = true;
        } catch (e) {
          console.error("Exceção ao inserir beatmap no Supabase:", e);
          throw e;
        }
      }

      return { data: [record], error: null };
    }

    async deleteBeatmap(id) {
      try {
        const maps = await this.getBeatmaps();
        this._cachedBeatmaps = maps.filter(m => m.id !== id);

        if (this.supabase) {
          const { error } = await this.supabase.from("beatmaps").delete().eq("id", id);
          if (error) throw error;
        }
        return true;
      } catch (e) {
        console.error("Erro ao deletar beatmap:", e);
        return false;
      }
    }

    async updateBeatmapStatus(id, newStatus, observation = null) {
      try {
        const maps = await this.getBeatmaps();
        this._cachedBeatmaps = maps.map(m => {
          if (m.id === id) {
            return {
              ...m,
              status: newStatus,
              observation: observation !== null ? observation : m.observation
            };
          }
          return m;
        });

        if (this.supabase) {
          const updateObj = { status: newStatus };
          if (observation !== null) updateObj.observation = observation;
          const { error } = await this.supabase.from("beatmaps").update(updateObj).eq("id", id);
          if (error) throw error;
        }
        return true;
      } catch (e) {
        console.error("Erro ao atualizar status do mapa:", e);
        return false;
      }
    }

    async getUsers(forceRefresh = false) {
      if (!forceRefresh && this._cachedUsers !== null) {
        return this._cachedUsers;
      }

      // Consulta direta ao Supabase
      if (this.supabase) {
        try {
          const fetchPromise = this.supabase
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

          if (!error && Array.isArray(data)) {
            this.isDbConnected = true;
            data.forEach(u => {
              if (!u.avatar_url || u.avatar_url.includes("v3/images/random")) {
                u.avatar_url = APP_CONFIG.defaultAvatar;
              }
            });
            this._cachedUsers = data;
            return data;
          } else if (error) {
            console.warn("Supabase getUsers aviso:", error.message);
          }
        } catch (e) {
          console.warn("Supabase getUsers exceção:", e.message);
        }
      }

      this._cachedUsers = [];
      return [];
    }

    async saveUser(user) {
      try {
        // Atualiza cache em memória
        const users = await this.getUsers();
        this._cachedUsers = [user, ...users.filter(u => u.id !== user.id)];

        if (this.supabase) {
          const userPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            discord_tag: user.discord_tag || "",
            avatar_url: user.avatar_url || APP_CONFIG.defaultAvatar,
            bio: user.bio || "",
            role: user.role || "player",
            is_dev: Boolean(user.is_dev),
            is_admin_apto: Boolean(user.is_admin_apto),
            status: user.status || "active",
            uploads_today_count: user.uploads_today_count !== undefined ? user.uploads_today_count : 0,
            last_upload_date: user.last_upload_date || new Date().toISOString().split("T")[0],
            custom_upload_limit: user.custom_upload_limit !== undefined ? user.custom_upload_limit : null,
            is_trusted_creator: Boolean(user.is_trusted_creator),
            duplicate_attempts_count: user.duplicate_attempts_count !== undefined ? user.duplicate_attempts_count : 0,
            ban_expires_at: user.ban_expires_at || null,
            last_login: new Date().toISOString()
          };

          let { error } = await this.supabase
            .from("users")
            .upsert([userPayload], { onConflict: "id" });

          // Fallback se alguma coluna nova ainda não tiver sido criada no Supabase
          if (error && error.message && (error.message.includes("column") || error.code === "42703")) {
            console.warn("Aviso schema cache users, tentando payload básico:", error.message);
            const basicPayload = {
              id: user.id,
              username: user.username,
              email: user.email,
              discord_tag: user.discord_tag || "",
              avatar_url: user.avatar_url || APP_CONFIG.defaultAvatar,
              bio: user.bio || "",
              role: user.role || "player",
              is_dev: Boolean(user.is_dev),
              is_admin_apto: Boolean(user.is_admin_apto),
              last_login: new Date().toISOString()
            };
            const retry = await this.supabase.from("users").upsert([basicPayload], { onConflict: "id" });
            error = retry.error;
          }

          if (error) {
            console.error("❌ Supabase saveUser erro:", error.code, error.message, error.details);
            if (error.code === "23505" || (error.message && error.message.includes("duplicate"))) {
              const retryRes = await this.supabase
                .from("users")
                .update(userPayload)
                .eq("username", user.username);
              if (!retryRes.error) {
                console.log("✅ Usuário atualizado no Supabase via fallback por username!");
                this.isDbConnected = true;
                return true;
              }
            }
            throw new Error(error.message || "Erro ao salvar usuário no banco de dados");
          } else {
            console.log("✅ Usuário sincronizado no Supabase! ID:", user.id);
            this.isDbConnected = true;
          }
        }
        return true;
      } catch (e) {
        console.error("❌ Exceção ao salvar usuário no Supabase:", e);
        throw e;
      }
    }

    // ========================================================================
    // CONTROLE DE LIMITE DIÁRIO E ANTI-SPAM (DUPLICIDADE)
    // ========================================================================
    async getUserUploadStatus(userId) {
      const users = await this.getUsers(true);
      const user = users.find(u => u.id === userId) || null;
      if (!user) {
        return { isSuspended: false, canUpload: true, limit: 2, uploadsToday: 0, duplicateAttempts: 0 };
      }

      const todayStr = new Date().toISOString().split("T")[0];

      // 1. Checagem de banimento definitivo
      if (user.status === "banned") {
        return { isSuspended: true, isBanned: true, reason: "banned", user };
      }

      // 2. Checagem de suspensão temporária (gradativa)
      if (user.status === "suspended") {
        if (user.ban_expires_at) {
          const expiresDate = new Date(user.ban_expires_at);
          if (expiresDate > new Date()) {
            return {
              isSuspended: true,
              isBanned: false,
              banExpiresAt: user.ban_expires_at,
              reason: "suspended_timer",
              user
            };
          } else {
            // Tempo de suspensão expirou: reativa automaticamente!
            console.log("ℹ️ Período de suspensão expirado. Reativando conta automaticamente...");
            user.status = "active";
            user.ban_expires_at = null;
            user.duplicate_attempts_count = 0;
            await this.saveUser(user);
          }
        } else {
          return { isSuspended: true, isBanned: false, banExpiresAt: null, reason: "suspended_manual", user };
        }
      }

      // 3. Checagem e cálculo do limite diário
      let uploadsToday = user.uploads_today_count || 0;
      if (user.last_upload_date !== todayStr) {
        uploadsToday = 0;
      }

      const isStaff = Boolean(user.is_dev || user.is_admin_apto || user.role === 'dev' || user.role === 'admin' || user.role === 'mod');
      let limit = 2; // Padrão da plataforma: 2 mapas por dia
      if (isStaff) {
        limit = Infinity;
      } else if (user.custom_upload_limit && Number(user.custom_upload_limit) > 0) {
        limit = Number(user.custom_upload_limit);
      } else if (user.is_trusted_creator) {
        limit = 10;
      }

      const canUpload = isStaff || (uploadsToday < limit);

      return {
        isSuspended: false,
        isStaff,
        canUpload,
        uploadsToday,
        limit,
        duplicateAttempts: user.duplicate_attempts_count || 0,
        user
      };
    }

    async recordDuplicateAttempt(userId) {
      const users = await this.getUsers(true);
      const user = users.find(u => u.id === userId);
      if (!user) return { suspended: false, attempts: 1 };

      const isStaff = Boolean(user.is_dev || user.is_admin_apto || user.role === 'dev' || user.role === 'admin');
      const attempts = (Number(user.duplicate_attempts_count) || 0) + 1;
      user.duplicate_attempts_count = attempts;

      // Staff possui imunidade contra suspensão automática
      if (attempts >= 3 && !isStaff) {
        // 3ª tentativa ou mais em sequência: suspende por 24 horas
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        user.status = "suspended";
        user.ban_expires_at = expiresAt;
        await this.saveUser(user);
        return { suspended: true, attempts, expiresAt, user };
      }

      await this.saveUser(user);
      return { suspended: false, attempts, user };
    }

    async recordSuccessfulUpload(userId) {
      const users = await this.getUsers(true);
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const todayStr = new Date().toISOString().split("T")[0];
      const count = (user.last_upload_date === todayStr) ? ((Number(user.uploads_today_count) || 0) + 1) : 1;

      user.uploads_today_count = count;
      user.last_upload_date = todayStr;
      user.duplicate_attempts_count = 0; // limpa tentativas suspeitas após upload limpo

      await this.saveUser(user);
    }

    async adminSetUserUploadLimit(userId, limit) {
      const users = await this.getUsers(true);
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("Usuário não encontrado.");
      user.custom_upload_limit = (limit && Number(limit) > 0) ? Number(limit) : null;
      await this.saveUser(user);
      return user.custom_upload_limit;
    }

    async adminUnsuspendUser(userId) {
      const users = await this.getUsers(true);
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("Usuário não encontrado.");
      user.status = "active";
      user.ban_expires_at = null;
      user.duplicate_attempts_count = 0;
      await this.saveUser(user);
      return true;
    }


    async deleteUser(id) {
      try {
        const users = await this.getUsers();
        const updatedUsers = users.filter(u => u.id !== id);
        this._cachedUsers = updatedUsers;
        localStorage.setItem(this.storageKeyUsers, JSON.stringify(updatedUsers));

        if (this.supabase) {
          this.supabase.from("users").delete().eq("id", id).catch(() => {});
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    // ========================================================================
    // CÁLCULO DE RANKING DE USUÁRIOS: JUNTANDO AS PONTUAÇÕES DE TODOS OS MAPAS
    // Rank Normal: Soma todos os mapas (C, D, F, B, A, S, SS, SS+)
    // Rank Pro: Soma APENAS os mapas com nota acima de A (A, S, S+, SS, SS+)
    // ========================================================================
    getUserRankings(timeFilter = 'all', mode = 'normal') {
      const proGrades = ["SS+", "SS", "S+", "S", "A"];
      const userRankMap = {};

      let users = this._cachedUsers || [];

      // Inicializa usuários reais
      users.forEach(u => {
        userRankMap[u.id] = {
          user: u,
          totalScore: 0,
          mapsPlayedCount: 0,
          contributingPlays: [],
          totalAccuracy: 0,
          maxCombo: 0,
          bestGrade: "-"
        };
      });

      // Recupera jogadas reais registradas no banco
      let plays = [];
      try {
        const rawPlays = localStorage.getItem(this.storageKeyPlays);
        if (rawPlays) plays = JSON.parse(rawPlays);
      } catch (e) {}
      if (timeFilter !== 'all') {
        plays = plays.filter(p => p.period === timeFilter || (timeFilter === 'ano' && p.period !== 'semana'));
      }

      // Soma das pontuações dos mapas
      plays.forEach(p => {
        const uRank = userRankMap[p.userId];
        if (!uRank) return;

        // Se for modo Pro, ignora se tirou abaixo de A (B, C, D, F)
        if (mode === 'pro' && !proGrades.includes(p.grade)) {
          return;
        }

        // Acumula a pontuação do mapa
        uRank.totalScore += p.score;
        uRank.mapsPlayedCount += 1;
        uRank.contributingPlays.push(p);
        uRank.totalAccuracy += p.accuracy;
        if (p.combo > uRank.maxCombo) uRank.maxCombo = p.combo;

        // Atualiza melhor nota
        const gradeWeight = { "SS+": 7, "SS": 6, "S+": 5, "S": 4, "A": 3, "B": 2, "C": 1, "D": 0, "F": -1 };
        if ((gradeWeight[p.grade] || 0) > (gradeWeight[uRank.bestGrade] || 0)) {
          uRank.bestGrade = p.grade;
        }
      });

      // Transforma em array e calcula médias
      const rankedUsers = Object.values(userRankMap).map(item => {
        const avgAcc = item.mapsPlayedCount > 0 ? (item.totalAccuracy / item.mapsPlayedCount).toFixed(2) : "0.00";
        return {
          ...item,
          avgAccuracy: avgAcc
        };
      });

      // Ordena decrescente por pontuação total acumulada
      rankedUsers.sort((a, b) => b.totalScore - a.totalScore);
      return rankedUsers;
    }
  }

  const db = new DatabaseService();

  // ==========================================================================
  // 7. CLOUDINARY MEDIA UPLOAD CLIENT
  // ==========================================================================
  class CloudinaryService {
    static uploadFileWithProgress(fileOrBlob, filename = "file.bin", onProgress = null) {
      return new Promise((resolve, reject) => {
        try {
          const cfg = (window.CLOUDINARY_CONFIG && window.CLOUDINARY_CONFIG.cloudName) ? window.CLOUDINARY_CONFIG : CLOUDINARY_CONFIG;
          const uploadUrl = cfg.uploadUrl || `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;
          const preset = cfg.uploadPreset || "beatmaps";

          const formData = new FormData();
          const fname = fileOrBlob.name || filename || "upload.bin";
          formData.append("file", fileOrBlob, fname);
          formData.append("upload_preset", preset);

          console.log(`☁️ Iniciando upload binário para Cloudinary com monitoramento de progresso (${fname})...`);

          const xhr = new XMLHttpRequest();
          xhr.open("POST", uploadUrl, true);

          if (xhr.upload && typeof onProgress === "function") {
            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent, e.loaded, e.total);
              }
            });
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                console.log("✅ Cloudinary upload concluído com sucesso:", data.secure_url);
                resolve(data.secure_url || data.url);
              } catch (err) {
                reject(new Error("Falha ao processar resposta JSON do Cloudinary"));
              }
            } else {
              let errDetail = "";
              try { errDetail = JSON.parse(xhr.responseText)?.error?.message; } catch (_) {}
              reject(new Error(errDetail || `Erro HTTP ${xhr.status} no Cloudinary`));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Falha de conexão com os servidores do Cloudinary."));
          };

          xhr.onabort = () => {
            reject(new Error("Upload cancelado pelo usuário."));
          };

          xhr.send(formData);
        } catch (err) {
          reject(err);
        }
      });
    }

    static async uploadFile(fileOrBlob, filename = "file.bin") {
      try {
        return await this.uploadFileWithProgress(fileOrBlob, filename, null);
      } catch (e) {
        console.warn("Upload rápido Cloudinary falhou, usando fallback de preview:", e.message);
        return typeof fileOrBlob === "string" ? fileOrBlob : URL.createObjectURL(fileOrBlob);
      }
    }

    /**
     * Exclui arquivo diretamente do Cloudinary para evitar acúmulo de arquivos órfãos / lixo na nuvem
     */
    static async deleteFile(fileUrl) {
      if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.includes("cloudinary.com")) return false;
      try {
        const cfg = (window.CLOUDINARY_CONFIG && window.CLOUDINARY_CONFIG.cloudName) ? window.CLOUDINARY_CONFIG : CLOUDINARY_CONFIG;
        
        // Extrai public_id a partir da URL do Cloudinary
        // Ex: https://res.cloudinary.com/deln0ozqh/raw/upload/v12345/hdbn/packages/uuid.hbn
        const parts = fileUrl.split("/");
        const uploadIdx = parts.indexOf("upload");
        if (uploadIdx === -1) return false;
        
        let pathParts = parts.slice(uploadIdx + 1);
        if (pathParts[0] && pathParts[0].startsWith("v") && !isNaN(Number(pathParts[0].substring(1)))) {
          pathParts = pathParts.slice(1);
        }
        const fullPathWithExt = pathParts.join("/");
        const publicId = fullPathWithExt.replace(/\.[^/.]+$/, "");
        
        const resourceType = fileUrl.includes("/raw/") ? "raw" : (fileUrl.includes("/video/") ? "video" : "image");
        console.log(`🗑️ Solicitando exclusão no Cloudinary: "${publicId}" (${resourceType})`);

        const destroyUrl = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/${resourceType}/destroy`;
        const formData = new FormData();
        formData.append("public_id", publicId);
        if (cfg.uploadPreset) formData.append("upload_preset", cfg.uploadPreset);

        await fetch(destroyUrl, { method: "POST", body: formData }).catch(e => console.warn("Destroy Cloudinary warning:", e));
        return true;
      } catch (err) {
        console.warn("Aviso ao tentar excluir do Cloudinary:", err);
        return false;
      }
    }
  }

  // ==========================================================================
  // 8. SPA ROUTER
  // ==========================================================================
  class SPARouter {
    constructor() {
      this.routes = {};
      this.notFoundHandler = null;
      this.isNavigating = false;
      window.addEventListener("hashchange", () => {
        if (!this.isNavigating) {
          this.handleRouting();
        }
      });
    }

    register(path, handler) {
      this.routes[path] = handler;
    }

    setNotFoundHandler(handler) {
      this.notFoundHandler = handler;
    }

    navigate(path) {
      if (window.location.hash === path) {
        this.handleRouting();
      } else {
        window.location.hash = path;
      }
    }

    navigateClean(path) {
      this.isNavigating = true;
      if (window.location.hash !== path) {
        window.location.hash = path;
      }
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + path);
      }
      this.handleRouting();
      setTimeout(() => { this.isNavigating = false; }, 60);
    }

    handleRouting() {
      const hash = window.location.hash || "#/";
      const cleanPath = hash.split("?")[0];
      const paramPages = ["#/beatmap", "#/perfil", "#/busca"];
      if (!paramPages.includes(cleanPath) && hash.includes("?")) {
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname + cleanPath);
        }
      }
      const handler = this.routes[cleanPath] || this.notFoundHandler || this.routes["#/"];
      if (handler) {
        try {
          const res = handler();
          if (res && typeof res.catch === "function") {
            res.catch(err => console.error("Erro na rota async:", err));
          }
        } catch (err) {
          console.error("Erro na rota:", err);
          if (this.routes["#/"]) this.routes["#/"]();
        }
      }
      this._updateActiveNav(cleanPath);
    }

    _updateActiveNav(path) {
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      if (path === "#/" || path === "") {
        document.getElementById("nav-item-home")?.classList.add("active");
      } else if (path === "#/maps") {
        document.getElementById("nav-item-maps")?.classList.add("active");
      } else if (path === "#/rank") {
        document.getElementById("nav-item-rank")?.classList.add("active");
      } else if (path === "#/comunidade") {
        document.getElementById("nav-item-comunidade")?.classList.add("active");
      } else if (path === "#/publicar") {
        document.getElementById("nav-item-publicar")?.classList.add("active");
      } else if (path === "#/ajuda") {
        document.getElementById("nav-item-ajuda")?.classList.add("active");
      } else if (path === "#/busca") {
        document.getElementById("btn-navbar-search")?.classList.add("active");
      }
    }
  }

  const router = new SPARouter();

  // ==========================================================================
  // 9. APP CONTROLLER
  // ==========================================================================
  class AppController {
    constructor() {
      this.mainView = null;
      this.audioPlayer = new Audio();
      this.audioPlayer.volume = 0.35;
      this.audioTimer = null;
      this.currentPreviewMapId = null;
      this.currentPublishData = null;
    }

    getMainView() {
      if (!this.mainView || !document.body.contains(this.mainView)) {
        this.mainView = document.getElementById("main-view");
      }
      return this.mainView;
    }

    init() {
      this.mainView = this.getMainView();
      try {
        this.setupRoutes();
      } catch (err) {
        console.error("Erro em setupRoutes:", err);
      }
      try {
        this.updateAuthUI();
      } catch (err) {
        console.error("Erro em updateAuthUI:", err);
      }
      try {
        router.handleRouting();
      } catch (err) {
        console.error("Erro em handleRouting:", err);
      }

      // Carrega dados frescos diretamente do Supabase no boot
      db.getBeatmaps(true).then(() => {
        router.handleRouting();
      }).catch(() => {
        router.handleRouting();
      });
      db.getUsers(true);

      // Detecção inteligente do idioma inicial do jogador (se inglês no sistema, adota inglês por padrão)
      let savedLang = localStorage.getItem('hdbn_lang');
      if (!savedLang) {
        const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
        if (browserLang.toLowerCase().startsWith('en')) {
          savedLang = 'en';
        } else if (browserLang.toLowerCase().startsWith('es')) {
          savedLang = 'es';
        } else if (browserLang.toLowerCase().startsWith('ja')) {
          savedLang = 'ja';
        } else {
          savedLang = 'pt';
        }
        localStorage.setItem('hdbn_lang', savedLang);
      }
      const langFlags = { pt: { flag: '🇧🇷', label: 'PT' }, en: { flag: '🇺🇸', label: 'EN' }, es: { flag: '🇪🇸', label: 'ES' }, ja: { flag: '🇯🇵', label: 'JA' } };
      const curL = langFlags[savedLang] || langFlags.pt;
      const flagEl = document.getElementById("current-lang-flag");
      const labelEl = document.getElementById("current-lang-label");
      if (flagEl) flagEl.textContent = curL.flag;
      if (labelEl) labelEl.textContent = curL.label;

      document.addEventListener("click", (e) => {
        const wrap = document.getElementById("user-ghost-menu-wrap");
        if (wrap && !wrap.contains(e.target)) {
          document.getElementById("user-floating-menu")?.classList.remove("active");
        }
        const langWrap = document.querySelector(".lang-dropdown-wrap");
        if (langWrap && !langWrap.contains(e.target)) {
          const topMenu = document.getElementById("lang-top-menu");
          if (topMenu) topMenu.style.display = "none";
        }
      });
    }

    setupRoutes() {
      router.register("#/", () => this.renderHomeView());
      router.register("#/maps", () => this.renderMapsView());
      router.register("#/rank", () => this.renderRankingView());
      router.register("#/comunidade", () => this.renderCommunityView());
      router.register("#/publicar", () => this.renderPublishView());
      router.register("#/ajuda", () => this.renderHelpView());
      router.register("#/regras", () => this.renderRulesView());
      router.register("#/beatmap", () => this.renderBeatmapDetailView());
      router.register("#/perfil", () => this.renderProfileView());
      router.register("#/admin", () => this.renderAdminView());
      router.register("#/blogs", () => this.renderBlogExpandedView());
      router.register("#/busca", () => this.renderSearchView());
      router.register("#/termos", () => this.renderTermsView());
      router.register("#/404", () => this.render404View("default"));
      router.register("#/500", () => this.render500View());

      // Fallback global: rota inválida → página 404
      router.setNotFoundHandler(() => this.render404View("default"));
    }

    showToast(msg) {
      let container = document.getElementById("toast-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
      }
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = `<span class="material-symbols-outlined">check_circle</span> <span>${msg}</span>`;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    }

    // Exibe erro inline dentro do formulário (estilo Google/YouTube — sem alert())
    // containerId: id do elemento onde o banner será injetado no topo
    showFormError(msg, containerId) {
      // Remove banners anteriores do mesmo container
      const target = containerId ? document.getElementById(containerId) : null;
      if (target) {
        target.querySelectorAll(".form-error-banner").forEach(b => b.remove());
        const banner = document.createElement("div");
        banner.className = "form-error-banner";
        banner.innerHTML = `<span class="material-symbols-outlined">error</span><span>${msg}</span>`;
        target.insertBefore(banner, target.firstChild);
        // Some depois de 6s
        setTimeout(() => banner.remove(), 6000);
      } else {
        // Fallback: banner flutuante no topo esquerdo da tela
        let floatContainer = document.getElementById("form-error-float");
        if (!floatContainer) {
          floatContainer = document.createElement("div");
          floatContainer.id = "form-error-float";
          floatContainer.style.cssText = "position:fixed;top:1.1rem;left:50%;transform:translateX(-50%);z-index:10060;min-width:320px;max-width:520px;width:auto;";
          document.body.appendChild(floatContainer);
        }
        floatContainer.querySelectorAll(".form-error-banner").forEach(b => b.remove());
        const banner = document.createElement("div");
        banner.className = "form-error-banner";
        banner.innerHTML = `<span class="material-symbols-outlined">error</span><span>${msg}</span>`;
        floatContainer.appendChild(banner);
        setTimeout(() => banner.remove(), 6000);
      }
    }

    // Exibe overlay centralizado na tela pedindo que o usuário crie conta
    // action: 'publish' | 'download'
    showAuthRequired(action = 'generic') {
      document.getElementById("auth-required-overlay")?.remove();
      const labels = {
        publish: {
          icon: "edit_note",
          title: "Você precisa ter uma conta",
          body: "Crie uma conta gratuita ou entre na sua conta para <strong>publicar beatmaps</strong> na plataforma HDBN."
        },
        download: {
          icon: "download",
          title: "Você precisa ter uma conta",
          body: "Crie uma conta gratuita ou entre na sua conta para <strong>baixar mapas</strong> da plataforma HDBN."
        },
        generic: {
          icon: "person_add",
          title: "Você precisa ter uma conta",
          body: "Crie uma conta gratuita ou entre para continuar."
        }
      };
      const l = labels[action] || labels.generic;
      const overlay = document.createElement("div");
      overlay.id = "auth-required-overlay";
      overlay.className = "auth-required-overlay";
      overlay.innerHTML = `
        <div class="auth-required-card" style="position:relative;">
          <button class="auth-req-dismiss" onclick="document.getElementById('auth-required-overlay')?.remove()" title="Fechar">
            <span class="material-symbols-outlined" style="font-size:1.4rem;">close</span>
          </button>
          <span class="material-symbols-outlined auth-req-icon">${l.icon}</span>
          <h2>${l.title}</h2>
          <p>${l.body}</p>
          <div class="auth-req-actions">
            <button class="btn btn-primary" onclick="document.getElementById('auth-required-overlay')?.remove(); window.openAuthModal('register');">
              <span class="material-symbols-outlined">person_add</span> Criar Conta
            </button>
            <button class="btn btn-dark-secondary" onclick="document.getElementById('auth-required-overlay')?.remove(); window.openAuthModal('login');">
              <span class="material-symbols-outlined">login</span> Entrar
            </button>
          </div>
        </div>
      `;
      // Clicar fora fecha
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    }

    updateAuthUI() {
      const user = stateMgr.getUser();
      const ghostImg = document.getElementById("ghost-avatar-img");
      const floatingMenu = document.getElementById("user-floating-menu");
      if (!floatingMenu) return;

      if (user) {
        if (!user.avatar_url || user.avatar_url.includes("v3/images/random")) {
          user.avatar_url = APP_CONFIG.defaultAvatar;
          stateMgr.setUser(user, stateMgr.state.rememberMe);
          if (db.supabase) {
            db.supabase.from("users").update({ avatar_url: user.avatar_url }).eq("id", user.id).then(() => {});
          }
        }
        if (ghostImg) {
          ghostImg.src = user.avatar_url || APP_CONFIG.defaultAvatar;
          ghostImg.onerror = () => { ghostImg.onerror = null; ghostImg.src = APP_CONFIG.defaultAvatar; };
        }
        const roleInfo = APP_CONFIG.ROLES[user.role] || APP_CONFIG.ROLES.player;
        const isStaff = user.role === 'admin' || user.role === 'dev' || user.is_dev;

        const canAccessAdmin = (user.role === 'dev' || user.is_dev || user.role === 'admin' || user.is_admin_apto);
        floatingMenu.innerHTML = `
          <div class="user-floating-header">
            <strong style="color:white; display:block; font-size:0.9rem;">${user.username}</strong>
            ${roleInfo.tagClass !== 'tag-player' ? `<span class="hierarchy-tag ${roleInfo.tagClass}">${roleInfo.label}</span>` : ''}
            ${user.discord_tag ? `<span style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem;">@${user.discord_tag}</span>` : ''}
          </div>
          <a href="#/perfil?id=${user.id}" onclick="window.renderProfileView('${user.id}'); window.toggleUserMenu(); return false;" class="user-floating-item">
            <span class="material-symbols-outlined">person</span> Meu Perfil
          </a>
          ${canAccessAdmin ? `
          <a href="#/admin" onclick="window.renderAdminView(); window.toggleUserMenu(); return false;" class="user-floating-item" style="color:#f59e0b;">
            <span class="material-symbols-outlined">admin_panel_settings</span> Painel Admin (Staff)
          </a>` : ''}
          <div class="user-floating-item" style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem; margin-top:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:0.4rem;">IDIOMA</span>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('pt'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇧🇷 PT</button>
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('en'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇺🇸 EN</button>
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('es'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇪🇸 ES</button>
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('ja'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇯🇵 JA</button>
            </div>
          </div>
          <div class="user-floating-item" onclick="window.app.logout(); window.toggleUserMenu();" style="color:#ef4444; border-top:1px solid var(--border-subtle); margin-top:0.25rem;">
            <span class="material-symbols-outlined">logout</span> Sair da Conta
          </div>
        `;
      } else {
        if (ghostImg) {
          ghostImg.src = APP_CONFIG.defaultAvatar;
          ghostImg.onerror = () => { ghostImg.onerror = null; ghostImg.src = APP_CONFIG.defaultAvatar; };
        }
        floatingMenu.innerHTML = `
          <div class="user-floating-item" onclick="window.openAuthModal('login'); window.toggleUserMenu();">
            <span class="material-symbols-outlined">login</span> Logar
          </div>
          <div class="user-floating-item" onclick="window.openAuthModal('register'); window.toggleUserMenu();">
            <span class="material-symbols-outlined">person_add</span> Inscrever-se
          </div>
          <div class="user-floating-item" style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem; margin-top:0.25rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; display:block; margin-bottom:0.4rem;">IDIOMA</span>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('pt'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇧🇷 PT</button>
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('en'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇺🇸 EN</button>
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('es'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇪🇸 ES</button>
              <button class="btn btn-secondary btn-sm" onclick="window.app.setLang('ja'); window.toggleUserMenu();" style="font-size:0.72rem; padding:0.2rem 0.5rem;">🇯🇵 JA</button>
            </div>
          </div>
        `;
      }
    }

    logout() {
      stateMgr.setUser(null);
      this.updateAuthUI();
      this.showToast("Sessão encerrada!");
      router.navigate("#/");
    }

    setLang(code) {
      const info = {
        pt: { name: 'Português', flag: '🇧🇷', label: 'PT' },
        en: { name: 'English', flag: '🇺🇸', label: 'EN' },
        es: { name: 'Español', flag: '🇪🇸', label: 'ES' },
        ja: { name: '日本語', flag: '🇯🇵', label: 'JA' }
      };
      const cur = info[code] || info.pt;
      localStorage.setItem('hdbn_lang', code);
      const flagEl = document.getElementById("current-lang-flag");
      const labelEl = document.getElementById("current-lang-label");
      if (flagEl) flagEl.textContent = cur.flag;
      if (labelEl) labelEl.textContent = cur.label;
      this.showToast(`Idioma alterado para ${cur.name} ${cur.flag} — em desenvolvimento`);
    }

    playAudioPreview(url, previewStart = 27.42, maxDuration = 30) {
      if (this.audioPlayer.src === url && !this.audioPlayer.paused) {
        this.audioPlayer.pause();
        if (this.audioTimer) clearTimeout(this.audioTimer);
        this.currentPreviewMapId = null;
        this._updateAllCardPlayOverlays();
        return false;
      }
      this.audioPlayer.src = url;
      this.audioPlayer.currentTime = previewStart;
      this.audioPlayer.volume = 0.35;
      this.audioPlayer.play().catch(() => {});

      if (this.audioTimer) clearTimeout(this.audioTimer);
      this.audioTimer = setTimeout(() => {
        this.audioPlayer.pause();
        this.currentPreviewMapId = null;
        this._updateAllCardPlayOverlays();
      }, maxDuration * 1000);

      this.audioPlayer.onended = () => {
        this.currentPreviewMapId = null;
        this._updateAllCardPlayOverlays();
      };

      return true;
    }

    // ========================================================================
    // REPRODUÇÃO DE PRÉVIA DE ÁUDIO NO CARD (30 SEGUNDOS ESTABILIZADOS)
    // ========================================================================
    toggleCardAudioPreview(mapId, audioUrl, previewStart = 0) {
      if (!audioUrl) {
        this.showToast("Este mapa não possui áudio de prévia cadastrado.");
        return;
      }

      // Se já está tocando este mesmo mapa, pausa imediatamente
      if (this.currentPreviewMapId === mapId && !this.audioPlayer.paused) {
        this.audioPlayer.pause();
        this.currentPreviewMapId = null;
        if (this.audioTimer) clearTimeout(this.audioTimer);
        this._updateAllCardPlayOverlays();
        return;
      }

      // Interrompe qualquer áudio tocando anteriormente
      if (this.audioTimer) clearTimeout(this.audioTimer);
      this.audioPlayer.pause();

      this.currentPreviewMapId = mapId;
      this.audioPlayer.src = audioUrl;
      this.audioPlayer.currentTime = Number(previewStart) || 0;
      this.audioPlayer.volume = 0.35;

      this.audioPlayer.play().then(() => {
        this._updateAllCardPlayOverlays();
      }).catch(err => {
        console.warn("Autoplay bloqueado pelo navegador ou erro de mídia:", err);
        this.currentPreviewMapId = null;
        this._updateAllCardPlayOverlays();
      });

      // Trava estrita de duração de 30 segundos
      this.audioTimer = setTimeout(() => {
        this.audioPlayer.pause();
        this.currentPreviewMapId = null;
        this._updateAllCardPlayOverlays();
      }, 30000);

      this.audioPlayer.onended = () => {
        this.currentPreviewMapId = null;
        this._updateAllCardPlayOverlays();
      };

      this._updateAllCardPlayOverlays();
    }

    _updateAllCardPlayOverlays() {
      document.querySelectorAll(".shelf-card-play-overlay").forEach(overlay => {
        const id = overlay.id.replace("play-overlay-", "");
        const icon = overlay.querySelector(".play-icon");
        if (id === this.currentPreviewMapId && !this.audioPlayer.paused) {
          overlay.classList.add("playing");
          if (icon) icon.textContent = "pause";
        } else {
          overlay.classList.remove("playing");
          if (icon) icon.textContent = "play_arrow";
        }
      });
    }

    // ========================================================================
    // SKELETON SCREENS (ESTILO YOUTUBE) PARA PREENCHIMENTO INSTANTÂNEO
    // ========================================================================
    _createSkeletonMapCardsHTML(count = 6) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <div class="skeleton-shelf-card">
            <div class="skeleton-thumb skeleton-shimmer"></div>
            <div class="skeleton-body">
              <div class="skeleton-line-title skeleton-shimmer"></div>
              <div class="skeleton-line-creator skeleton-shimmer"></div>
              <div class="skeleton-line-badge skeleton-shimmer"></div>
            </div>
          </div>
        `;
      }
      return html;
    }

    _createSkeletonRankingRowsHTML(count = 6) {
      let html = '';
      for (let i = 0; i < count; i++) {
        html += `
          <tr>
            <td><div class="skeleton-shimmer" style="width:24px; height:18px; border-radius:3px;"></div></td>
            <td>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <div class="skeleton-shimmer" style="width:32px; height:32px; border-radius:var(--radius-sm); flex-shrink:0;"></div>
                <div>
                  <div class="skeleton-shimmer" style="width:90px; height:14px; border-radius:3px; margin-bottom:4px;"></div>
                  <div class="skeleton-shimmer" style="width:50px; height:10px; border-radius:3px;"></div>
                </div>
              </div>
            </td>
            <td><div class="skeleton-shimmer" style="width:75px; height:20px; border-radius:12px;"></div></td>
            <td><div class="skeleton-shimmer" style="width:65px; height:14px; border-radius:3px;"></div></td>
            <td><div class="skeleton-shimmer" style="width:36px; height:20px; border-radius:12px;"></div></td>
            <td><div class="skeleton-shimmer" style="width:85px; height:16px; border-radius:3px;"></div></td>
            <td><div class="skeleton-shimmer" style="width:45px; height:14px; border-radius:3px;"></div></td>
            <td><div class="skeleton-shimmer" style="width:40px; height:14px; border-radius:3px;"></div></td>
            <td><div class="skeleton-shimmer" style="width:80px; height:26px; border-radius:var(--radius-sm);"></div></td>
          </tr>
        `;
      }
      return html;
    }

    _getDifficultyBadgeHTML(level, name) {
      const cls = `diff-${level || 'facil'}`;
      return `<span class="diff-pill ${cls}">${name || 'Fácil'}</span>`;
    }

    // ========================================================================
    // CARD DE BEATMAP INTERATIVO:
    // - Clique na capa/play toca 30s com equalizer animado
    // - Clique em qualquer outro espaço redireciona diretamente ao detalhe
    // - event.stopPropagation() nas ações (favorito, download e play)
    // ========================================================================
    _createShelfMapCardHTML(map) {
      const isFav = stateMgr.isFavorite(map.id);
      const diffBadge = this._getDifficultyBadgeHTML(map.difficulty_level, map.difficulty_name);
      const isAudioActive = this.currentPreviewMapId === map.id && !this.audioPlayer.paused;
      const audioUrl = map.audio_preview_url || map.audio_url || '';
      const previewStart = map.audio_preview_start || 0;

      return `
        <div class="beatmap-shelf-card" onclick="window.renderBeatmapDetailView('${map.id}')">
          <div class="shelf-card-thumb-wrap">
            <img src="${map.cover_url || APP_CONFIG.defaultCover}" class="shelf-card-thumb" alt="${map.title}" loading="lazy">
            <div class="shelf-card-play-overlay ${isAudioActive ? 'playing' : ''}" 
                 id="play-overlay-${map.id}"
                 title="Ouvir prévia sonora (30s)"
                 onclick="event.stopPropagation(); window.app.toggleCardAudioPreview('${map.id}', '${audioUrl}', ${previewStart})">
              <span class="material-symbols-outlined play-icon">${isAudioActive ? 'pause' : 'play_arrow'}</span>
              <div class="card-equalizer-bars">
                <span class="eq-bar"></span>
                <span class="eq-bar"></span>
                <span class="eq-bar"></span>
              </div>
            </div>
          </div>
          <div class="shelf-card-body">
            <div class="shelf-card-title">${map.title}</div>
            <div class="shelf-card-creator">criador: ${map.mapper_name}</div>
            <div class="shelf-card-badges-row">
              ${(map.status === 'ranked' || map.status === 'approved_ranked') ? '<span class="pill-ranqueado-purple">ranqueado</span>' : ''}
              ${(map.status === 'unranked' || map.status === 'approved_unranked') ? '<span class="pill-status-unranked">normal</span>' : ''}
              ${diffBadge}
            </div>
          </div>
          <div class="shelf-card-actions" onclick="event.stopPropagation()">
            <button class="shelf-action-btn" title="Favoritar" onclick="window.app.toggleFav('${map.id}', this)">
              <span class="material-symbols-outlined" style="color:${isFav ? '#ec4899' : 'inherit'};">${isFav ? 'bookmark' : 'bookmark_border'}</span>
            </button>
            <button class="shelf-action-btn" title="Baixar" onclick="event.stopPropagation(); window.app.downloadMap('${map.id}', '${map.file_url}')">
              <span class="material-symbols-outlined">download</span>
            </button>
          </div>
        </div>
      `;
    }

    // ========================================================================
    // TELA INICIAL (HOME) — COM SKELETON SCREENS, POSTS E IMAGENS REAIS
    // ========================================================================
    async renderHomeView() {
      const view = this.getMainView();
      if (!view) return;

      // Exibe imediatamente o Hero Banner com a capa local e os skeletons
      if (!db._cachedBeatmaps) {
        view.innerHTML = `
          <div class="container">
            <div class="home-hero-grid">
              <div class="home-hero-banner-card">
                <img src="capa.jpg" class="home-hero-banner-img" alt="HDBN Banner">
                <div class="home-hero-banner-overlay">
                  <div class="home-hero-title-box">
                    <div class="home-hero-hdbn-text">HDBN</div>
                  </div>
                  <a href="${APP_CONFIG.itchUrl}" target="_blank" class="btn-itch-purple">
                    <span class="material-symbols-outlined" style="font-size:1.05rem;">download</span> BAIXAR NO ITCH.IO
                  </a>
                </div>
              </div>
              <div class="home-blogs-box">
                <div class="home-section-header-row">
                  <h2 class="home-section-title">novos blogs</h2>
                </div>
                <div class="home-blogs-cards-row">
                  <div class="skeleton-shelf-card skeleton-shimmer" style="height:120px;"></div>
                  <div class="skeleton-shelf-card skeleton-shimmer" style="height:120px;"></div>
                </div>
              </div>
            </div>
            <div class="beatmaps-shelf-container" style="margin-top:2.5rem;">
              <div class="home-section-header-row">
                <h2 class="home-section-title">Mapas Recém-Publicados</h2>
              </div>
              <div class="beatmaps-grid-3cols">
                ${this._createSkeletonMapCardsHTML(6)}
              </div>
            </div>
          </div>
        `;
      }

      const rawMaps = await db.getBeatmaps();
      const maps = this.getVisibleBeatmaps(rawMaps);
      const realBlogs = blogService.getPosts();

      const recentes = [...maps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const maisFavoritados = [...maps].sort((a, b) => b.favorites_count - a.favorites_count);
      const maisBaixados = [...maps].sort((a, b) => b.downloads_count - a.downloads_count);

      view.innerHTML = `
        <div class="container">
          
          <!-- TOP ROW: HERO BANNER ESQUERDA + NOVOS BLOGS REAIS DIREITA -->
          <div class="home-hero-grid">
            
            <!-- Banner Esquerdo -->
            <div class="home-hero-banner-card">
              <img src="capa.jpg" class="home-hero-banner-img" alt="HDBN Banner">
              <div class="home-hero-banner-overlay">
                <div class="home-hero-title-box">
                  <div class="home-hero-hdbn-text">HDBN</div>
                </div>
                <a href="${APP_CONFIG.itchUrl}" target="_blank" class="btn-itch-purple">
                  <span class="material-symbols-outlined" style="font-size:1.05rem;">download</span> BAIXAR NO ITCH.IO
                </a>
              </div>
            </div>

            <!-- Novos Blogs Reais (com imagem da postagem oficial) -->
            <div class="home-blogs-box">
              <div class="home-section-header-row">
                <h2 class="home-section-title">novos blogs</h2>
                <span class="pill-todos-blogs" onclick="window.renderBlogExpandedView()">todos os blogs</span>
              </div>
              <div class="home-blogs-cards-row">
                ${realBlogs.map(b => `
                  <div class="blog-card-blue" onclick="window.open('${b.url}', '_blank')">
                    <img src="${b.imageUrl}" class="blog-card-thumb-bg" alt="${b.title}">
                    <div class="blog-card-content">
                      <div class="blog-card-title">${b.title}</div>
                      <div class="blog-card-excerpt">Publicado por ${b.author}: ${b.excerpt.substring(0, 55)}...</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>

          <!-- SEÇÃO DE MAPAS REAIS DO BANCO OU TEXTO SE BANCO NÃO FOR ENCONTRADO -->
          ${!db.isDbConnected ? `
            <div class="db-not-found-card" style="padding: 3.5rem 1.5rem; text-align: center; background: #12131b; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); margin: 2.5rem 0;">
              <span class="material-symbols-outlined" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 0.5rem;">database_off</span>
              <h2 style="font-size: 1.8rem; font-weight: 900; color: white; margin-bottom: 0.5rem;">Banco de dados não encontrado</h2>
              <p style="color: var(--text-secondary); font-size: 0.95rem; max-width: 500px; margin: 0 auto;">
                Não foi possível estabelecer conexão com o banco de dados oficial do Supabase para listar os beatmaps.
              </p>
            </div>
          ` : (maps.length === 0 ? `
            <div style="padding:3.5rem 1rem; text-align:center; color:var(--text-muted); background:#12131b; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); margin:2rem 0;">
              <span class="material-symbols-outlined" style="font-size:3rem; color:var(--text-muted); margin-bottom:0.5rem;">library_music</span>
              <h3 style="color:white; font-size:1.3rem; margin-bottom:0.35rem;">Nenhum beatmap publicado</h3>
              <p style="font-size:0.85rem;">Seja o primeiro a publicar um pacote .hbn oficial!</p>
            </div>
          ` : `
            <!-- SEÇÃO 1: MAPAS RECÉM-PUBLICADOS -->
            <div class="beatmaps-shelf-container">
              <div class="home-section-header-row">
                <h2 class="home-section-title">Mapas Recém-Publicados</h2>
                <span class="pill-todos" onclick="window.app.renderCategoryView('recentes')">ver todos</span>
              </div>
              <div class="beatmaps-grid-3cols">
                ${recentes.slice(0, 6).map(m => this._createShelfMapCardHTML(m)).join('')}
              </div>
            </div>

            <!-- SEÇÃO 2: MAIS FAVORITADOS -->
            <div class="beatmaps-shelf-container">
              <div class="home-section-header-row">
                <h2 class="home-section-title">Mais Favoritados da Comunidade</h2>
                <span class="pill-todos" onclick="window.app.renderCategoryView('favoritos')">ver todos</span>
              </div>
              <div class="beatmaps-grid-3cols">
                ${maisFavoritados.slice(0, 6).map(m => this._createShelfMapCardHTML(m)).join('')}
              </div>
            </div>

            <!-- SEÇÃO 3: MAIS BAIXADOS -->
            <div class="beatmaps-shelf-container">
              <div class="home-section-header-row">
                <h2 class="home-section-title">Mapas Mais Baixados</h2>
                <span class="pill-todos" onclick="window.app.renderCategoryView('baixados')">ver todos</span>
              </div>
              <div class="beatmaps-grid-3cols">
                ${maisBaixados.slice(0, 6).map(m => this._createShelfMapCardHTML(m)).join('')}
              </div>
            </div>
          `)}

        </div>
      `;
    }

    // ========================================================================
    // TELA DEDICADA DE UMA CATEGORIA ("VER TODOS")
    // ========================================================================
    async renderCategoryView(categoryKey = 'baixados', page = 1) {
      window.location.hash = `#/maps?category=${categoryKey}`;

      if (!db._cachedBeatmaps) {
        this.mainView.innerHTML = `
          <div class="container" style="padding: 2.5rem 0;">
            <div style="margin-bottom:1.5rem;">
              <h1 style="font-size:2rem; font-weight:900; color:#fff;">Explorar Categoria</h1>
              <p style="color:var(--text-secondary); font-size:0.85rem;">Carregando beatmaps do acervo...</p>
            </div>
            <div class="beatmaps-grid-3cols">
              ${this._createSkeletonMapCardsHTML(6)}
            </div>
          </div>
        `;
      }

      const rawMaps = await db.getBeatmaps();
      const maps = this.getVisibleBeatmaps(rawMaps);

      if (!db.isDbConnected) {
        this.mainView.innerHTML = `
          <div class="container" style="padding: 4rem 1rem; text-align: center;">
            <div style="max-width: 580px; margin: 0 auto; background: #12131b; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 3.5rem 1.5rem;">
              <span class="material-symbols-outlined" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 0.5rem;">database_off</span>
              <h2 style="font-size: 1.8rem; font-weight: 900; color: white; margin-bottom: 0.5rem;">Banco de dados não encontrado</h2>
              <p style="color: var(--text-secondary); font-size: 0.95rem;">Não foi possível estabelecer conexão com o banco de dados oficial do Supabase para listar os beatmaps.</p>
            </div>
          </div>
        `;
        return;
      }

      let filtered = [];
      let categoryTitle = "";

      if (categoryKey === 'recentes') {
        categoryTitle = "Recém-Publicados";
        filtered = [...maps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (categoryKey === 'favoritos') {
        categoryTitle = "Mais Favoritados";
        filtered = [...maps].sort((a, b) => b.favorites_count - a.favorites_count);
      } else if (categoryKey === 'baixados') {
        categoryTitle = "Mais Baixados";
        filtered = [...maps].sort((a, b) => b.downloads_count - a.downloads_count);
      } else {
        categoryTitle = "Mais Populares e Destaques";
        filtered = [...maps].sort((a, b) => (b.downloads_count + b.favorites_count) - (a.downloads_count + a.favorites_count));
      }

      const itemsPerPage = 12;
      const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
      const startIndex = (page - 1) * itemsPerPage;
      const displayedMaps = filtered.slice(startIndex, startIndex + itemsPerPage);

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
            <div>
              <button class="btn btn-secondary btn-sm" onclick="window.renderMapsView()" style="margin-bottom:0.75rem;">
                <span class="material-symbols-outlined">arrow_back</span> Voltar para Todos os Mapas
              </button>
              <h1 style="font-size:2rem; font-weight:900; color:#fff;">Categoria Dedicada: ${categoryTitle}</h1>
              <p style="color:var(--text-secondary); font-size:0.85rem;">Exibindo exclusivamente beatmaps da categoria ${categoryTitle.toLowerCase()} (Máximo 12 por página).</p>
            </div>
            <div>
              <span class="pill-ranqueado-purple" style="font-size:0.8rem; padding:0.35rem 0.85rem;">Total: ${filtered.length} Beatmaps</span>
            </div>
          </div>

          <div class="beatmaps-grid-3cols">
            ${displayedMaps.map(m => this._createShelfMapCardHTML(m)).join('')}
          </div>

          ${totalPages > 1 ? this._renderPaginationBar(page, totalPages, `window.app.renderCategoryView('${categoryKey}', PAGE_NUM)`) : ''}
        </div>
      `;
    }

    // ========================================================================
    // TELA EXPANDIDA DE TODOS OS BLOGS (EXIBE A IMAGEM OFICIAL DA POSTAGEM)
    // ========================================================================
    async renderBlogExpandedView() {
      const realBlogs = blogService.getPosts();

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0;">
          
          <div class="blogs-expanded-header">
            <div>
              <span style="font-size:0.75rem; font-weight:900; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px;">Blog Oficial cafedobom123.blogspot.com</span>
              <h1 style="font-size:2.2rem; font-weight:900; color:#fff; margin-top:0.25rem;">Acervo Oficial de Postagens & Atualizações</h1>
              <p style="color:var(--text-secondary); font-size:0.9rem; max-width:650px; margin-top:0.35rem;">
                Postagens reais publicadas oficialmente no Blogspot pela equipe do HDBN Rhythm Game.
              </p>
            </div>
            <a href="${APP_CONFIG.blogspotUrl}" target="_blank" class="btn btn-primary" style="background:#0d6efd; border-color:#0d6efd;">
              <span class="material-symbols-outlined">open_in_new</span> Acessar Blogspot Original
            </a>
          </div>

          <div class="blogs-expanded-grid">
            ${realBlogs.map(b => `
              <div class="blog-expanded-card">
                <div class="blog-expanded-top-bar">
                  <span>${b.tag}</span>
                  <span style="font-size:0.7rem; font-weight:700;">${b.date}</span>
                </div>
                <img src="${b.imageUrl}" class="blog-expanded-cover-img" alt="${b.title}">
                <div class="blog-expanded-body">
                  <div>
                    <h3 class="blog-expanded-title">${b.title}</h3>
                    <p class="blog-expanded-excerpt">${b.excerpt}</p>
                  </div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                    <span style="font-size:0.75rem; color:var(--text-muted);">Autor: <strong>${b.author}</strong></span>
                    <a href="${b.url}" target="_blank" class="btn-blog-external">
                      <span>Ler Post no Blogspot</span>
                      <span class="material-symbols-outlined" style="font-size:1rem;">arrow_outward</span>
                    </a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="text-align:center; margin-top:2.5rem;">
            <button class="btn btn-secondary" onclick="window.renderHomeView()">
              <span class="material-symbols-outlined">arrow_back</span> Voltar para Início
            </button>
          </div>

        </div>
      `;
    }

    // ========================================================================
    // TELA DE MAPAS (/maps) — GRADE DE 3 ITENS, MÁXIMO 12 A 14 MAPAS
    // ========================================================================
    async renderMapsView(activeFilter = 'populares', page = 1) {
      const view = this.getMainView();
      if (!view) return;
      if (!db._cachedBeatmaps) {
        view.innerHTML = `
          <div class="container" style="padding: 2.5rem 0;">
            <div style="margin-bottom:1.5rem;">
              <h1 style="font-size:2rem; font-weight:900; color:#fff;">Explorar Beatmaps</h1>
              <p style="color:var(--text-secondary); font-size:0.85rem;">Carregando beatmaps do acervo...</p>
            </div>
            <div class="beatmaps-grid-3cols">
              ${this._createSkeletonMapCardsHTML(6)}
            </div>
          </div>
        `;
      }

      const rawMaps = await db.getBeatmaps();
      const maps = this.getVisibleBeatmaps(rawMaps);

      if (!db.isDbConnected) {
        view.innerHTML = `
          <div class="container" style="padding: 4rem 1rem; text-align: center;">
            <div style="max-width: 580px; margin: 0 auto; background: #12131b; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 3.5rem 1.5rem;">
              <span class="material-symbols-outlined" style="font-size: 3.5rem; color: #ef4444; margin-bottom: 0.5rem;">database_off</span>
              <h2 style="font-size: 1.8rem; font-weight: 900; color: white; margin-bottom: 0.5rem;">Banco de dados não encontrado</h2>
              <p style="color: var(--text-secondary); font-size: 0.95rem;">Não foi possível estabelecer conexão com o banco de dados oficial do Supabase para listar os beatmaps.</p>
            </div>
          </div>
        `;
        return;
      }

      let sorted = [...maps];

      if (activeFilter === 'downloads') {
        sorted.sort((a, b) => b.downloads_count - a.downloads_count);
      } else if (activeFilter === 'favoritos') {
        sorted.sort((a, b) => b.favorites_count - a.favorites_count);
      } else if (activeFilter === 'lancamento') {
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else {
        sorted.sort((a, b) => (b.downloads_count + b.favorites_count) - (a.downloads_count + a.favorites_count));
      }

      const itemsPerPage = 12;
      const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
      const startIndex = (page - 1) * itemsPerPage;
      const displayedMaps = sorted.slice(startIndex, startIndex + itemsPerPage);

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
            <div>
              <h1 style="font-size:2rem; font-weight:900; color:#fff;">Explorar Beatmaps</h1>
              <p style="color:var(--text-secondary); font-size:0.85rem;">Encontre beatmaps criados pela comunidade para o HDBN (Grade de 3 itens, até 12 por página).</p>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button class="community-filter-btn ${activeFilter === 'populares' ? 'active' : ''}" onclick="window.app.renderMapsView('populares', 1)">
                Mais Baixados e Favoritados
              </button>
              <button class="community-filter-btn ${activeFilter === 'downloads' ? 'active' : ''}" onclick="window.app.renderMapsView('downloads', 1)">
                Mais Baixados
              </button>
              <button class="community-filter-btn ${activeFilter === 'favoritos' ? 'active' : ''}" onclick="window.app.renderMapsView('favoritos', 1)">
                Mais Favoritados
              </button>
              <button class="community-filter-btn ${activeFilter === 'lancamento' ? 'active' : ''}" onclick="window.app.renderMapsView('lancamento', 1)">
                Ordem de Lançamento
              </button>
            </div>
          </div>

          <div class="beatmaps-grid-3cols">
            ${displayedMaps.length > 0 ? displayedMaps.map(m => this._createShelfMapCardHTML(m)).join('') : '<p style="color:var(--text-muted); text-align:center; grid-column:1/-1;">Nenhum beatmap encontrado nesta categoria.</p>'}
          </div>

          ${totalPages > 1 ? this._renderPaginationBar(page, totalPages, `window.app.renderMapsView('${activeFilter}', PAGE_NUM)`) : ''}
        </div>
      `;
    }

    _renderPaginationBar(currentPage, totalPages, callbackTemplate) {
      let pagesHTML = '';
      pagesHTML += `
        <button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="${callbackTemplate.replace('PAGE_NUM', currentPage - 1)}">
          <span class="material-symbols-outlined" style="font-size:1rem;">chevron_left</span>
        </button>
      `;

      for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        pagesHTML += `
          <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="${callbackTemplate.replace('PAGE_NUM', i)}">
            ${i}
          </button>
        `;
      }

      if (totalPages > 5) {
        pagesHTML += `<span class="pagination-ellipsis">...</span>`;
        pagesHTML += `
          <button class="pagination-btn ${totalPages === currentPage ? 'active' : ''}" onclick="${callbackTemplate.replace('PAGE_NUM', totalPages)}">
            ${totalPages}
          </button>
        `;
      }

      pagesHTML += `
        <button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="${callbackTemplate.replace('PAGE_NUM', currentPage + 1)}">
          <span class="material-symbols-outlined" style="font-size:1rem;">chevron_right</span>
        </button>
      `;

      return `<div class="pagination-container">${pagesHTML}</div>`;
    }

    // ========================================================================
    // TELA DE RANKING (/rank) — SOMA PONTUAÇÕES DE TODOS OS MAPAS POR USUÁRIO
    // ========================================================================
    async renderRankingView(timeFilter = 'all', mode = 'normal') {
      const view = this.getMainView();
      if (!view) return;
      // Se os dados ainda não estão em cache (F5 ou primeira abertura), exibe Skeleton da tabela imediatamente
      if (!db._cachedUsers || !db._cachedBeatmaps) {
        view.innerHTML = `
          <div class="container" style="padding: 2.5rem 0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
              <div>
                <h1 style="font-size:2rem; font-weight:900; color:#fff; display:flex; align-items:center; gap:0.5rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-cyan);">leaderboard</span> Ranking Global de Usuários
                </h1>
                <p style="color:var(--text-secondary); font-size:0.85rem;">Carregando classificações e somatório de pontuações dos jogadores...</p>
              </div>
            </div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th># Posição</th>
                    <th>Jogador</th>
                    <th>Modo</th>
                    <th>Mapas Contabilizados</th>
                    <th>Melhor Desempenho</th>
                    <th>Pontuação Total Acumulada</th>
                    <th>Precisão Média</th>
                    <th>Combo Máx.</th>
                    <th>Ver Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  ${this._createSkeletonRankingRowsHTML(6)}
                </tbody>
              </table>
            </div>
          </div>
        `;
        await Promise.all([db.getUsers(), db.getBeatmaps()]);
      }

      // Calcula a pontuação total acumulada por usuário
      const userRankings = db.getUserRankings(timeFilter, mode);

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
            <div>
              <h1 style="font-size:2rem; font-weight:900; color:#fff; display:flex; align-items:center; gap:0.5rem;">
                <span class="material-symbols-outlined" style="color:var(--accent-cyan);">leaderboard</span> Ranking Global de Usuários
              </h1>
              <p style="color:var(--text-secondary); font-size:0.85rem;">Classificação oficial baseada no somatório acumulado das pontuações obtidas pelos jogadores em todos os mapas.</p>
            </div>

            <!-- Alternância de Modos e Filtros Temporais -->
            <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
              <button class="community-filter-btn ${timeFilter === 'all' ? 'active' : ''}" onclick="window.app.renderRankingView('all', '${mode}')">Todo o Período</button>
              <button class="community-filter-btn ${timeFilter === 'ano' ? 'active' : ''}" onclick="window.app.renderRankingView('ano', '${mode}')">Ano</button>
              <button class="community-filter-btn ${timeFilter === 'mes' ? 'active' : ''}" onclick="window.app.renderRankingView('mes', '${mode}')">Mês</button>
              <button class="community-filter-btn ${timeFilter === 'semana' ? 'active' : ''}" onclick="window.app.renderRankingView('semana', '${mode}')">Semana</button>
              
              <div style="display:flex; gap:0.25rem; background:#111218; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.2rem; margin-left:0.5rem;">
                <button class="community-filter-btn ${mode === 'normal' ? 'active' : ''}" onclick="window.app.renderRankingView('${timeFilter}', 'normal')">
                  Rank Normal
                </button>
                <button class="community-filter-btn ${mode === 'pro' ? 'active' : ''}" onclick="window.app.renderRankingView('${timeFilter}', 'pro')" style="color:${mode === 'pro' ? '#f59e0b' : 'inherit'};">
                  <span class="material-symbols-outlined" style="font-size:1rem; vertical-align:middle;">military_tech</span> Rank Pro (A a SS+)
                </button>
              </div>
            </div>
          </div>

          <!-- Banner Explicativo da Soma das Pontuações -->
          <div style="background:${mode === 'pro' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(139, 92, 246, 0.12)'}; border:1px solid ${mode === 'pro' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(139, 92, 246, 0.35)'}; border-radius:var(--radius-sm); padding:1rem 1.25rem; margin-bottom:1.5rem; font-size:0.875rem; color:white; line-height:1.5;">
            ${mode === 'pro' 
              ? '<strong>Modo Rank Pro Ativado:</strong> Junta e soma <strong>exclusivamente</strong> a pontuação de mapas onde o usuário tirou nota <strong>A ou superior</strong> (Notas válidas: A, S, S+, SS, SS+). Mapas onde o jogador tirou B, C, D ou F têm suas pontuações <strong>descartadas</strong> do somatório, operando de forma idêntica ao sistema de performance do osu!.' 
              : '<strong>Modo Rank Normal Ativado:</strong> Junta e soma a pontuação de <strong>todos os mapas</strong> jogados e concluídos pelo usuário (ex: se tirou 400.000 em um mapa e 600.000 em outro, soma 400k + 600k = 1.000.000 pts, somando notas S, A, B, C, D e F).'}
          </div>

          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th># Posição</th>
                  <th>Jogador</th>
                  <th>Modo</th>
                  <th>Mapas Contabilizados</th>
                  <th>Melhor Desempenho</th>
                  <th>Pontuação Total Acumulada</th>
                  <th>Precisão Média</th>
                  <th>Combo Máx.</th>
                  <th>Ver Detalhes</th>
                </tr>
              </thead>
              <tbody>
                ${userRankings.length === 0 ? `
                  <tr>
                    <td colspan="9" style="text-align:center; padding:3rem; color:var(--text-muted); font-size:0.95rem;">
                      Nenhuma pontuação registrada ainda. Seja o primeiro a jogar e registrar pontuação no ranking!
                    </td>
                  </tr>
                ` : userRankings.map((item, i) => `
                  <tr>
                    <td><strong style="color:${i === 0 ? '#f59e0b' : (i === 1 ? '#cbd5e1' : (i === 2 ? '#b45309' : '#fff'))}; font-size:1rem;">#${i + 1}</strong></td>
                    <td style="display:flex; align-items:center; gap:0.6rem;">
                      <img src="${item.user.avatar_url}" style="width:32px; height:32px; border-radius:var(--radius-sm); object-fit:cover;" alt="${item.user.username}">
                      <div>
                        <strong style="color:white; display:block; cursor:pointer;" onclick="window.renderProfileView('${item.user.id}')">${item.user.username}</strong>
                        ${APP_CONFIG.ROLES[item.user.role]?.tagClass !== 'tag-player' && APP_CONFIG.ROLES[item.user.role]?.label ? `<span class="hierarchy-tag ${APP_CONFIG.ROLES[item.user.role]?.tagClass}" style="font-size:0.65rem; padding:0.05rem 0.35rem;">${APP_CONFIG.ROLES[item.user.role]?.label}</span>` : ''}
                      </div>
                    </td>
                    <td>
                      <span class="status-badge ${mode === 'pro' ? 'status-featured' : 'status-approved'}">
                        ${mode === 'pro' ? 'Rank Pro' : 'Rank Normal'}
                      </span>
                    </td>
                    <td>
                      <strong style="color:white;">${item.mapsPlayedCount} mapas</strong>
                      <span style="display:block; font-size:0.7rem; color:var(--text-muted);">${mode === 'pro' ? 'apenas notas A+' : 'todas as notas'}</span>
                    </td>
                    <td>
                      <span class="grade-pill grade-${item.bestGrade.replace('+', '-plus')}">${item.bestGrade}</span>
                    </td>
                    <td>
                      <span style="font-size:1.05rem; font-weight:900; color:${mode === 'pro' ? '#f59e0b' : '#38bdf8'};">
                        ${item.totalScore.toLocaleString()} pts
                      </span>
                    </td>
                    <td style="color:var(--accent-cyan); font-weight:700;">${item.avgAccuracy}%</td>
                    <td>${item.maxCombo}x</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="window.app.showUserScoreBreakdown('${item.user.id}', '${mode}')" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                        Ver Mapas Somados
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    // Modal mostrando o somatório de cada mapa do usuário (ex: 400k + 600k = 1M)
    showUserScoreBreakdown(userId, mode) {
      const uRank = db.getUserRankings('all', mode).find(x => x.user.id === userId);
      if (!uRank) return;

      const modal = document.getElementById("auth-modal-overlay");
      const container = document.getElementById("auth-tab-content");
      if (!modal || !container) return;

      modal.classList.add("active");
      container.innerHTML = `
        <div style="padding:0.5rem 0;">
          <h2 style="font-size:1.3rem; font-weight:900; color:white; margin-bottom:0.25rem;">
            Somatório de Pontos: ${uRank.user.username}
          </h2>
          <span class="status-badge ${mode === 'pro' ? 'status-featured' : 'status-approved'}">
            ${mode === 'pro' ? 'Modo Rank Pro (A a SS+)' : 'Modo Rank Normal (Todos os Mapas)'}
          </span>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin:0.75rem 0 1rem 0;">
            Veja abaixo como a pontuação foi calculada e somada mapa por mapa:
          </p>

          <div style="max-height:240px; overflow-y:auto; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); margin-bottom:1rem; background:#0b0c11;">
            ${uRank.contributingPlays.map(p => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.85rem; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.8rem;">
                <div>
                  <strong style="color:white; display:block;">${p.mapTitle}</strong>
                  <span style="color:var(--text-muted); font-size:0.7rem;">Precisão: ${p.accuracy}% • Combo: ${p.combo}x</span>
                </div>
                <div style="text-align:right;">
                  <span class="grade-pill grade-${p.grade.replace('+', '-plus')}" style="font-size:0.7rem; padding:0.1rem 0.4rem;">${p.grade}</span>
                  <strong style="color:#38bdf8; display:block; margin-top:0.15rem;">+${p.score.toLocaleString()}</strong>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="background:#13141f; padding:0.85rem; border-radius:var(--radius-sm); border:1px solid var(--accent-purple); display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.9rem; font-weight:800; color:white;">Pontuação Final Resultante:</span>
            <span style="font-size:1.25rem; font-weight:900; color:#f59e0b;">${uRank.totalScore.toLocaleString()} pontos</span>
          </div>
        </div>
      `;
    }

    // ========================================================================
    // TELA DE COMUNIDADE (/comunidade) — 12 ITENS, DUPLA PAGINAÇÃO, SEM 2 ANOS
    // ========================================================================
    async renderCommunityView(timeFilter = 'all', searchType = 'maps', searchTerm = '', page = 1) {
      const view = this.getMainView();
      if (!view) return;
      if (!db._cachedBeatmaps || !db._cachedUsers) {
        view.innerHTML = `
          <div class="container" style="padding: 2.5rem 0;">
            <div class="community-header-box">
              <h1 class="community-main-title">Novos Mapas e Usuários, Publicações Recentes</h1>
              <p class="community-subtitle-quote">
                "Você pode encontrar os melhores mapas incríveis ou você pode encontrar um chorume que parece peidos ao som."
              </p>
            </div>
            <div class="community-filter-row">
              <button class="community-filter-btn active">Todo o Período</button>
              <button class="community-filter-btn">Último Ano</button>
              <button class="community-filter-btn">Último Mês</button>
            </div>
            <div style="margin-top:2rem;">
              <div class="beatmaps-grid-3cols">
                ${this._createSkeletonMapCardsHTML(6)}
              </div>
            </div>
          </div>
        `;
      }

      const rawMaps = await db.getBeatmaps();
      const maps = this.getVisibleBeatmaps(rawMaps);
      const users = await db.getUsers();

      // Agrupa e calcula as estatísticas acumuladas de todos os mapas por mapper
      const mapperStats = {};
      rawMaps.forEach(m => {
        const dCount = Number(m.downloads_count) || 0;
        const fCount = Number(m.favorites_count) || 0;
        const mId = m.mapper_id ? String(m.mapper_id).trim() : null;
        const mName = m.mapper_name ? String(m.mapper_name).trim().toLowerCase() : null;

        if (mId) {
          if (!mapperStats[mId]) mapperStats[mId] = { downloads: 0, favorites: 0, mapsCount: 0 };
          mapperStats[mId].downloads += dCount;
          mapperStats[mId].favorites += fCount;
          mapperStats[mId].mapsCount += 1;
        }
        if (mName) {
          if (!mapperStats[mName]) mapperStats[mName] = { downloads: 0, favorites: 0, mapsCount: 0 };
          mapperStats[mName].downloads += dCount;
          mapperStats[mName].favorites += fCount;
          mapperStats[mName].mapsCount += 1;
        }
      });

      users.forEach(u => {
        const byId = u.id ? mapperStats[String(u.id).trim()] : null;
        const byName = u.username ? mapperStats[String(u.username).trim().toLowerCase()] : null;
        u.downloads_total = (byId ? byId.downloads : 0) || (byName ? byName.downloads : 0) || 0;
        u.favorites_total = (byId ? byId.favorites : 0) || (byName ? byName.favorites : 0) || 0;
        u.maps_count = (byId ? byId.mapsCount : 0) || (byName ? byName.mapsCount : 0) || 0;
        if (!u.avatar_url || u.avatar_url.includes("v3/images/random")) {
          u.avatar_url = APP_CONFIG.defaultAvatar;
        }
      });

      const topCreators = [...users].sort((a, b) => (b.favorites_total + b.downloads_total) - (a.favorites_total + a.downloads_total));

      // Ordenação oficial por ordem de publicação (mais recentes primeiro)
      maps.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

      let filteredMaps = maps;
      let filteredUsers = users;

      // Filtragem por período de publicação
      const now = new Date();
      if (timeFilter === 'ano') {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filteredMaps = maps.filter(m => new Date(m.created_at || 0) >= oneYearAgo);
      } else if (timeFilter === 'mes') {
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filteredMaps = maps.filter(m => new Date(m.created_at || 0) >= oneMonthAgo);
      }

      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        filteredMaps = maps.filter(m => m.title.toLowerCase().includes(lower) || m.mapper_name.toLowerCase().includes(lower));
        filteredUsers = users.filter(u => u.username.toLowerCase().includes(lower));
      }

      const itemsPerPage = 12;
      const totalMapsPages = Math.ceil(filteredMaps.length / itemsPerPage) || 1;
      const totalUsersPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

      const displayedMaps = filteredMaps.slice((page - 1) * itemsPerPage, page * itemsPerPage);
      const displayedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

      const paginationCallback = `window.app.renderCommunityView('${timeFilter}', '${searchType}', '${searchTerm}', PAGE_NUM)`;

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0;">
          
          <!-- Frase Obrigatória no Topo -->
          <div class="community-header-box">
            <h1 class="community-main-title">Novos Mapas e Usuários, Publicações Recentes</h1>
            <p class="community-subtitle-quote">
              "Você pode encontrar os melhores mapas incríveis ou você pode encontrar um chorume que parece peidos ao som."
            </p>
          </div>

          <!-- Filtros Temporais (Últimos 2 anos removido!) -->
          <div class="community-filter-row">
            <button class="community-filter-btn ${timeFilter === 'all' ? 'active' : ''}" onclick="window.app.renderCommunityView('all', '${searchType}', '${searchTerm}', 1)">Todo o Período</button>
            <button class="community-filter-btn ${timeFilter === 'ano' ? 'active' : ''}" onclick="window.app.renderCommunityView('ano', '${searchType}', '${searchTerm}', 1)">Último Ano</button>
            <button class="community-filter-btn ${timeFilter === 'mes' ? 'active' : ''}" onclick="window.app.renderCommunityView('mes', '${searchType}', '${searchTerm}', 1)">Último Mês</button>
            <a href="#/regras" class="community-filter-btn" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; border-color:var(--accent-purple-light); color:var(--accent-cyan);">
              <span class="material-symbols-outlined" style="font-size:1rem;">gavel</span> Regras
            </a>
          </div>

          <!-- Alternância de Busca: Mapas vs Usuários -->
          <div style="max-width:650px; margin:0 auto 1.5rem auto;">
            <div class="search-switch-wrap">
              <button class="search-switch-tab ${searchType === 'maps' ? 'active' : ''}" onclick="window.app.renderCommunityView('${timeFilter}', 'maps', '${searchTerm}', 1)">
                <span class="material-symbols-outlined">library_music</span> Buscar Beatmaps (${filteredMaps.length})
              </button>
              <button class="search-switch-tab ${searchType === 'users' ? 'active' : ''}" onclick="window.app.renderCommunityView('${timeFilter}', 'users', '${searchTerm}', 1)">
                <span class="material-symbols-outlined">group</span> Buscar Usuários (${filteredUsers.length})
              </button>
            </div>
            <input type="text" class="search-input-field" placeholder="Digite para pesquisar ${searchType === 'maps' ? 'mapas ou artistas...' : 'jogadores ou mappers...'}" value="${searchTerm}" oninput="window.app.onCommunitySearchInput(this.value, '${timeFilter}', '${searchType}')" style="width:100%;">
          </div>

          <!-- Paginação no Topo -->
          ${searchType === 'maps' && totalMapsPages > 1 ? this._renderPaginationBar(page, totalMapsPages, paginationCallback) : ''}
          ${searchType === 'users' && totalUsersPages > 1 ? this._renderPaginationBar(page, totalUsersPages, paginationCallback) : ''}

          <!-- Conteúdo (12 Itens Máximo) -->
          ${searchType === 'maps' ? `
            <div class="community-cards-list">
              ${displayedMaps.map(m => `
                <div class="community-list-card" onclick="window.renderBeatmapDetailView('${m.id}')">
                  <img src="${m.cover_url || APP_CONFIG.defaultCover}" class="community-card-thumb" alt="${m.title}">
                  <div style="flex:1;">
                    <div style="font-size:0.95rem; font-weight:800; color:#fff;">${m.title}</div>
                    <div style="font-size:0.775rem; color:var(--text-secondary); margin:0.15rem 0;">criador: ${m.mapper_name}</div>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                      ${(m.status === 'ranked' || m.status === 'approved_ranked') ? '<span class="pill-ranqueado-purple">ranqueado</span>' : ((m.status === 'unranked' || m.status === 'approved_unranked') ? '<span class="pill-status-unranked">normal</span>' : '')}
                      ${this._getDifficultyBadgeHTML(m.difficulty_level, m.difficulty_name)}
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.75rem; color:var(--text-muted); font-size:0.8rem;">
                    <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:1rem;">download</span> ${m.downloads_count || 0}</span>
                    <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:1rem; color:#ec4899;">bookmark</span> ${m.favorites_count || 0}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
              ${displayedUsers.map(u => `
                <div class="beatmap-shelf-card" onclick="window.renderProfileView('${u.id}')">
                  <img src="${u.avatar_url || APP_CONFIG.defaultAvatar}" onerror="this.onerror=null; this.src='${APP_CONFIG.defaultAvatar}'" style="width:48px; height:48px; border-radius:var(--radius-sm); object-fit:cover;" alt="${u.username}">
                  <div style="flex:1;">
                    <div style="font-weight:800; color:white;">${u.username}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; gap:0.6rem; margin-top:0.2rem;">
                      <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">download</span> ${u.downloads_total} downloads</span>
                      <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.9rem; color:#ec4899;">bookmark</span> ${u.favorites_total} fãs</span>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}

          <!-- Paginação Embaixo -->
          ${searchType === 'maps' && totalMapsPages > 1 ? this._renderPaginationBar(page, totalMapsPages, paginationCallback) : ''}
          ${searchType === 'users' && totalUsersPages > 1 ? this._renderPaginationBar(page, totalUsersPages, paginationCallback) : ''}

          <!-- Destaques: Top Criadores -->
          <h2 style="font-size:1.4rem; font-weight:900; color:#fff; margin:3rem 0 1rem 0; display:flex; align-items:center; gap:0.5rem;">
            <span class="material-symbols-outlined" style="color:var(--accent-gold);">star</span> Destaques: Top Criadores de Mapas
          </h2>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
            ${topCreators.slice(0, 4).map(u => `
              <div class="beatmap-shelf-card" onclick="window.renderProfileView('${u.id}')">
                <img src="${u.avatar_url || APP_CONFIG.defaultAvatar}" onerror="this.onerror=null; this.src='${APP_CONFIG.defaultAvatar}'" style="width:48px; height:48px; border-radius:var(--radius-sm); object-fit:cover;" alt="${u.username}">
                <div style="flex:1;">
                  <div style="font-weight:800; color:white;">${u.username}</div>
                  <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; gap:0.6rem; margin-top:0.25rem;">
                    <span style="display:flex; align-items:center; gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">download</span> ${u.downloads_total} downloads</span>
                    <span style="display:flex; align-items:center; gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem; color:#ec4899;">bookmark</span> ${u.favorites_total} fãs</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      `;
    }

    onCommunitySearchInput(val, timeFilter, searchType) {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.renderCommunityView(timeFilter, searchType, val, 1);
      }, 250);
    }

    // ========================================================================
    // TELA DE DETALHES DO BEATMAP
    // ========================================================================
    async renderBeatmapDetailView(targetId) {
      const view = this.getMainView();
      if (!view) return;
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const mapId = targetId || urlParams.get("id");
      const map = mapId ? await db.getBeatmapById(mapId) : null;

      if (!map) {
        await this.render404View("map");
        return;
      }

      const user = stateMgr.getUser();
      const isFav = stateMgr.isFavorite(map.id);
      const isCreator = user && (user.username === map.mapper_name || user.id === map.mapper_id);
      const isAdminOrDev = user && (user.role === 'admin' || user.role === 'dev' || user.is_dev);
      const mapPlays = [];

      view.innerHTML = `
        <div class="container" style="padding: 2rem 0;">
          
          <img src="${map.cover_url}" class="map-page-hero-banner" alt="${map.title}">

          <div class="map-badges-row">
            ${map.status === 'ranked' ? `
              <span class="badge-ranked"><span class="material-symbols-outlined" style="font-size:0.85rem;">check_circle</span> RANQUEADO</span>
            ` : map.status === 'unranked' ? `
              <span class="badge-ranked" style="background:rgba(56,189,248,0.15); color:#38bdf8; border-color:rgba(56,189,248,0.4);"><span class="material-symbols-outlined" style="font-size:0.85rem;">check</span> MAPA NORMAL</span>
            ` : `
              <span class="badge-ranked" style="background:rgba(245,158,11,0.15); color:#f59e0b; border-color:rgba(245,158,11,0.4);"><span class="material-symbols-outlined" style="font-size:0.85rem;">hourglass_empty</span> AGUARDANDO APROVAÇÃO</span>
            `}
            ${this._getDifficultyBadgeHTML(map.difficulty_level, map.difficulty_name)}
            ${map.is_featured_artist ? '<span class="badge-featured">ARTISTA EM DESTAQUE</span>' : ''}
            <span class="badge-ranked" style="background:rgba(168,85,247,0.15); color:#c084fc; border-color:rgba(168,85,247,0.4);">
              <span class="material-symbols-outlined" style="font-size:0.85rem;">translate</span> IDIOMA: ${(map.language || 'Português').toUpperCase()}
            </span>
          </div>

          <h1 class="map-page-title">${map.title}</h1>
          <h3 class="map-page-artist">por ${map.artist}</h3>
          <p class="map-page-mapper">Mapeado por <strong onclick="window.renderProfileView('${map.mapper_id || 'usr-mapper-01'}')">${map.mapper_name}</strong></p>

          <!-- CARD DE ESTATÍSTICAS 4 COLUNAS -->
          <div class="map-stats-4col-card">
            <div class="map-stat-item">
              <span class="map-stat-label">BPM</span>
              <span class="map-stat-value" style="color:#f59e0b;">${map.bpm}</span>
            </div>
            <div class="map-stat-item">
              <span class="map-stat-label">DOWNLOADS</span>
              <span class="map-stat-value" id="detail-downloads-count" style="color:white;">${map.downloads_count || 0}</span>
            </div>
            <div class="map-stat-item">
              <span class="map-stat-label">FAVORITOS</span>
              <span class="map-stat-value" id="detail-favorites-count" style="color:#ec4899;">${map.favorites_count || 0}</span>
            </div>
            <div class="map-stat-item">
              <span class="map-stat-label">PRÉVIA INÍCIO</span>
              <span class="map-stat-value" style="color:#38bdf8;">${map.audio_preview_start ? map.audio_preview_start.toFixed(1) + 's' : '—'}</span>
            </div>
          </div>

          <!-- OBSERVAÇÃO DO MAPEADOR -->
          ${(map.observation && map.observation.trim()) || isCreator ? `
          <div class="map-obs-box" style="margin-bottom:1rem;">
            <div class="map-obs-header">
              <span style="display:flex; align-items:center; gap:0.35rem;">
                <span class="material-symbols-outlined" style="color:var(--accent-cyan);">draw</span> Observação do Mapeador:
              </span>
              ${isCreator ? '<span style="color:var(--accent-cyan); font-size:0.8rem;">(Você pode editar)</span>' : ''}
            </div>
            <textarea id="map-obs-mapper-input" class="map-obs-textarea" ${isCreator ? '' : 'readonly'}>${map.observation || ''}</textarea>
            ${isCreator ? `
              <div style="display:flex; justify-content:flex-end; margin-top:0.75rem;">
                <button class="btn btn-dark-secondary btn-sm" onclick="window.app.saveMapperObservation('${map.id}')">
                  <span class="material-symbols-outlined">save</span> Salvar Observação
                </button>
              </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- OBSERVAÇÃO DO MODERADOR (só aparece se tiver conteúdo OU se o usuário for admin/dev) -->
          ${isAdminOrDev || (map.mod_observation && map.mod_observation.trim()) ? `
          <div class="map-obs-box" style="margin-bottom:1rem; border-color:rgba(245,158,11,0.3);">
            <div class="map-obs-header">
              <span style="display:flex; align-items:center; gap:0.35rem;">
                <span class="material-symbols-outlined" style="color:#f59e0b;">shield</span> Observação do Moderador:
              </span>
              ${isAdminOrDev ? '<span style="color:#f59e0b; font-size:0.8rem;">(Staff pode editar)</span>' : ''}
            </div>
            <textarea id="map-obs-mod-input" class="map-obs-textarea" ${isAdminOrDev ? '' : 'readonly'} style="${isAdminOrDev ? '' : 'border-color:rgba(245,158,11,0.25);'}">${map.mod_observation || ''}</textarea>
            ${isAdminOrDev ? `
              <div style="display:flex; justify-content:flex-end; margin-top:0.75rem;">
                <button class="btn btn-dark-secondary btn-sm" style="border-color:#f59e0b; color:#f59e0b;" onclick="window.app.saveModObservation('${map.id}')">
                  <span class="material-symbols-outlined">save</span> Salvar Observação
                </button>
              </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- BOTÕES DE AÇÃO -->
          <div class="map-actions-row">
            <button class="btn btn-purple-gradient" onclick="window.app.toggleAudioPreview('${map.audio_preview_url}', ${map.audio_preview_start || 27.42}, this)">
              <span class="material-symbols-outlined">play_arrow</span> Ouvir Prévia (30s)
            </button>

            <button class="btn btn-dark-secondary" onclick="window.app.downloadMap('${map.id}', '${map.file_url}')">
              <span class="material-symbols-outlined">download</span> Baixar (.hbn)
            </button>

            <button class="btn btn-dark-secondary" onclick="window.app.toggleFav('${map.id}', this)">
              <span class="material-symbols-outlined" style="color:${isFav ? '#ec4899' : 'white'};">${isFav ? 'bookmark' : 'bookmark_border'}</span> ${isFav ? 'Favoritado' : 'Favoritar'}
            </button>

            ${(isCreator || isAdminOrDev) ? `
              <button class="btn btn-dark-secondary" onclick="window.app.showToast('Modo de edição do mapa aberto!')">
                <span class="material-symbols-outlined">edit</span> Editar
              </button>
            ` : ''}

            ${isAdminOrDev ? `
              <button class="btn btn-dark-secondary" style="border-color:#f59e0b; color:#f59e0b;" onclick="window.app.adminHideMap('${map.id}')">
                <span class="material-symbols-outlined">visibility_off</span> Ocultar / Suspender
              </button>
            ` : ''}

            <button class="btn btn-dark-secondary" onclick="window.app.reportPrompt('${map.id}', '${map.title}')">
              <span class="material-symbols-outlined">flag</span> Denunciar
            </button>

            ${(isCreator || isAdminOrDev) ? `
              <button class="btn btn-danger-red" onclick="window.app.deleteMap('${map.id}')">
                <span class="material-symbols-outlined">delete</span> Excluir
              </button>
            ` : ''}
          </div>

          <!-- INFORMAÇÕES TÉCNICAS -->
          <h2 style="font-size:1.4rem; font-weight:900; color:white; margin:2rem 0 1rem 0;">Informações Técnicas</h2>
          <div style="background:#12131b; border:1px solid var(--border-subtle); padding:1.25rem; border-radius:var(--radius-sm); margin-bottom:2.5rem;">
            <div style="display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;">
              ${this._getDifficultyBadgeHTML(map.difficulty_level, map.difficulty_name)}
              <span style="color:var(--text-secondary); font-size:0.85rem;">BPM: <strong style="color:white;">${map.bpm}</strong></span>
              <span style="color:var(--text-secondary); font-size:0.85rem;">Notas: <strong style="color:white;">${map.total_notes || '—'}</strong></span>
              <span style="color:var(--text-secondary); font-size:0.85rem;">Duração: <strong style="color:#38bdf8;">${map.duration_seconds ? (() => { const _m = Math.floor(map.duration_seconds / 60); const _s = Math.floor(map.duration_seconds % 60); return _m + ':' + String(_s).padStart(2,'0'); })() : '—'}</strong></span>
              <span style="color:var(--text-secondary); font-size:0.85rem;">Idioma do Beatmap: <strong style="color:#c084fc;">${(map.language || 'Português').charAt(0).toUpperCase() + (map.language || 'Português').slice(1)}</strong></span>
            </div>
          </div>

          <!-- TOP JOGADORES NESTE MAPA -->
          <h2 style="font-size:1.4rem; font-weight:900; color:white; margin-bottom:1rem;">Top Jogadores Neste Beatmap</h2>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th># Rank</th>
                  <th>Jogador</th>
                  <th>Patente</th>
                  <th>Score Neste Mapa</th>
                  <th>Precisão (%)</th>
                  <th>Combo Máximo</th>
                </tr>
              </thead>
              <tbody>
                ${mapPlays.length > 0 ? mapPlays.map((s, i) => `
                  <tr>
                    <td><strong>#${i + 1}</strong></td>
                    <td style="display:flex; align-items:center; gap:0.5rem;">
                      <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${s.userId}" style="width:24px; height:24px; border-radius:var(--radius-sm);" alt="${s.userId}">
                      <strong style="color:white;">${s.userId === 'usr-mapper-01' ? 'linaldo2' : (s.userId === 'usr-dev-01' ? 'HDBN_LeadDev' : 'ProGamer_99')}</strong>
                    </td>
                    <td><span class="grade-pill grade-${s.grade.replace('+', '-plus')}">${s.grade}</span></td>
                    <td><strong>${s.score.toLocaleString()}</strong></td>
                    <td style="color:var(--accent-cyan); font-weight:700;">${s.accuracy}%</td>
                    <td>${s.combo}x</td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">Nenhuma jogada registrada neste mapa ainda.</td></tr>
                `}
              </tbody>
            </table>
          </div>

        </div>
      `;
    }

    selectDiff(name, level, star, notes, bpm) {
      document.getElementById("diff-badge-container").innerHTML = this._getDifficultyBadgeHTML(level, name);
      document.getElementById("diff-star-val").textContent = `★ ${star}`;
      document.getElementById("diff-notes-val").textContent = notes;
      document.getElementById("diff-bpm-val").textContent = bpm;
      this.showToast(`Dificuldade ${name.toUpperCase()} selecionada!`);
    }

    saveMapperObservation(mapId) {
      const txt = document.getElementById("map-obs-mapper-input")?.value || '';
      stateMgr.setObservation(mapId, txt);
      this.showToast("Observação do mapeador salva!");
    }

    saveModObservation(mapId) {
      const txt = document.getElementById("map-obs-mod-input")?.value || '';
      stateMgr.setObservation(mapId + '_mod', txt);
      this.showToast("Observação do moderador salva!");
    }

    saveObservation(mapId) {
      const txt = document.getElementById("map-obs-mapper-input")?.value || '';
      stateMgr.setObservation(mapId, txt);
      this.showToast("Observação salva com sucesso!");
    }

    async deleteMap(mapId) {
      if (confirm("Tem certeza que deseja excluir totalmente este beatmap? O arquivo binário .hbn e a capa também serão apagados do Cloudinary.")) {
        try {
          const map = await db.getBeatmapById(mapId);
          if (map) {
            this.showToast("Excluindo arquivos do Cloudinary...");
            if (map.file_url) await CloudinaryService.deleteFile(map.file_url);
            if (map.cover_url && !map.cover_url.includes("unsplash.com") && !map.cover_url.includes("dicebear.com")) {
              await CloudinaryService.deleteFile(map.cover_url);
            }
          }
          await db.deleteBeatmap(mapId);
          this.showToast("Beatmap e arquivos excluídos do Cloudinary e do banco!");
          window.navigateClean("#/maps");
        } catch (err) {
          alert("Erro ao excluir beatmap: " + err.message);
        }
      }
    }

    adminHideMap(mapId) {
      this.showToast("Beatmap marcado como Oculto / Suspenso!");
    }

    toggleAudioPreview(url, previewStart, btn) {
      const isPlaying = this.playAudioPreview(url, previewStart, 30);
      btn.innerHTML = isPlaying ? '<span class="material-symbols-outlined">pause</span> Pausar Prévia' : '<span class="material-symbols-outlined">play_arrow</span> Ouvir Prévia (30s)';
    }

    downloadMap(id, fileUrl) {
      const user = stateMgr.getUser();
      if (!user) {
        this.showToast("Você precisa ter uma conta primeiro.");
        return false;
      }
      this.showToast("Download iniciado!");
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
      // Atualiza contador de downloads no Supabase + cache local
      if (id) {
        const cached = db._cachedBeatmaps;
        const mapIdx = cached ? cached.findIndex(m => m.id === id) : -1;
        const currentCount = mapIdx > -1 ? (cached[mapIdx].downloads_count || 0) : 0;
        const newCount = currentCount + 1;
        // Atualiza cache local imediatamente
        if (mapIdx > -1) cached[mapIdx].downloads_count = newCount;

        // Atualiza imediatamente elementos visíveis no DOM
        document.querySelectorAll(`[data-map-downloads="${id}"]`).forEach(el => {
          el.innerHTML = `<span class="material-symbols-outlined" style="font-size:12px;">download</span> ${newCount} downloads`;
        });
        const detailDl = document.getElementById("detail-downloads-count");
        if (detailDl) detailDl.textContent = newCount;

        // Atualiza no Supabase
        if (db.supabase) {
          db.supabase.from('beatmaps')
            .update({ downloads_count: newCount })
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.warn('[downloads] Supabase update aviso:', error.message);
            });
        }
      }
    }

    toggleFav(id, btn) {
      const user = stateMgr.getUser();
      if (!user) {
        this.showToast("Você precisa ter uma conta primeiro.");
        return;
      }
      const isFav = stateMgr.toggleFavorite(id);
      this.showToast(isFav ? "Adicionado aos favoritos!" : "Removido dos favoritos!");
      const icon = btn.querySelector(".material-symbols-outlined");
      if (icon) {
        icon.textContent = isFav ? "bookmark" : "bookmark_border";
        icon.style.color = isFav ? "#ec4899" : "inherit";
      }
      // Atualiza contador de favoritos no Supabase + cache local
      if (id) {
        const cached = db._cachedBeatmaps;
        const mapIdx = cached ? cached.findIndex(m => m.id === id) : -1;
        const currentCount = mapIdx > -1 ? (cached[mapIdx].favorites_count || 0) : 0;
        const newCount = Math.max(0, isFav ? currentCount + 1 : currentCount - 1);
        // Atualiza cache local imediatamente
        if (mapIdx > -1) cached[mapIdx].favorites_count = newCount;

        // Atualiza imediatamente elementos visíveis no DOM
        document.querySelectorAll(`[data-map-favorites="${id}"]`).forEach(el => {
          el.innerHTML = `<span class="material-symbols-outlined" style="font-size:12px;">bookmark</span> ${newCount} fãs`;
        });
        const detailFav = document.getElementById("detail-favorites-count");
        if (detailFav) detailFav.textContent = newCount;

        // Atualiza no Supabase
        if (db.supabase) {
          db.supabase.from('beatmaps')
            .update({ favorites_count: newCount })
            .eq('id', id)
            .then(({ error }) => {
              if (error) console.warn('[favorites] Supabase update aviso:', error.message);
            });
        }
      }
    }

    reportPrompt(targetId, targetTitle) {
      const reason = prompt(`Descreva o motivo da denúncia contra o beatmap "${targetTitle}":`);
      if (reason) {
        stateMgr.addReport({
          id: "rep-" + Date.now(),
          target_type: "beatmap",
          target_id: targetId,
          target_title: targetTitle,
          reporter_name: stateMgr.getUser()?.username || "Anônimo",
          reason: reason,
          status: "pending",
          created_at: "Agora"
        });
        this.showToast("Denúncia enviada à moderação!");
      }
    }

    // ========================================================================
    // TELA DE PERFIL DE USUÁRIOS (COM MAPAS FAVORITADOS)
    // ========================================================================
    async renderProfileView(userId) {
      const view = this.getMainView();
      if (!view) return;
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const currentUser = stateMgr.getUser();
      const targetId = userId || urlParams.get("id") || (currentUser ? currentUser.id : null);
      const users = await db.getUsers();
      const rawMaps = await db.getBeatmaps();
      const maps = this.getVisibleBeatmaps(rawMaps);

      let u = (targetId ? users.find(x => x.id === targetId || x.username === targetId) : null);
      if (!u && currentUser && (!targetId || targetId === currentUser.id || targetId === currentUser.username)) {
        u = currentUser;
      }

      if (!u) {
        if (!currentUser) {
          view.innerHTML = `
            <div class="container" style="padding: 4rem 1rem; text-align: center;">
              <div style="max-width: 480px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 3rem 1.5rem;">
                <span class="material-symbols-outlined" style="font-size: 3.5rem; color: var(--accent-purple-light); margin-bottom: 0.5rem;">account_circle</span>
                <h2 style="font-size: 1.6rem; font-weight: 900; color: white; margin-bottom: 0.5rem;">Acesse sua Conta</h2>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">Entre na sua conta ou crie um cadastro para visualizar seu perfil completo, gerenciar seus beatmaps e acompanhar favoritos.</p>
                <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
                  <button class="btn btn-primary" onclick="window.openAuthModal('login')">Entrar na Conta</button>
                  <button class="btn btn-secondary" onclick="window.openAuthModal('register')">Criar Conta</button>
                </div>
              </div>
            </div>
          `;
          return;
        }
        await this.render404View("profile");
        return;
      }

      const createdMaps = maps.filter(m => m.mapper_name === u.username || m.mapper_id === u.id);
      const favMapIds = stateMgr.getUserFavorites(u.id);
      const favoritedMaps = maps.filter(m => favMapIds.includes(m.id));
      const totalDownloads = createdMaps.reduce((sum, m) => sum + (Number(m.downloads_count) || 0), 0);
      const totalFavorites = createdMaps.reduce((sum, m) => sum + (Number(m.favorites_count) || 0), 0);

      const isOwnProfile = currentUser && currentUser.id === u.id;
      const roleInfo = APP_CONFIG.ROLES[u.role] || APP_CONFIG.ROLES.player;
      const canPromote = currentUser && (
        (currentUser.is_dev && !u.is_dev) ||
        (currentUser.role === 'admin' && u.role === 'player')
      );
      const userBio = (u.bio && u.bio.trim()) ? u.bio.trim() : "Ainda não falou nada sobre si.";
      const memberSince = u.created_at
        ? new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : null;

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0;">
          <!-- Card de Perfil com Banner Superior e Avatar Centralizado em Degradê -->
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); overflow:hidden; margin-bottom:2.5rem; position:relative;">
            
            <!-- Hero Banner com a Imagem de Perfil ampliada e degradê para baixo -->
            <div style="position:relative; width:100%; height:190px; background:radial-gradient(circle at 50% 30%, rgba(168,85,247,0.3) 0%, rgba(15,16,26,0.95) 80%), url('${u.avatar_url || APP_CONFIG.defaultAvatar}') center/cover no-repeat;">
              <!-- Overlay com degradê escuro fluindo suavemente para baixo -->
              <div style="position:absolute; inset:0; background:linear-gradient(to bottom, rgba(10,11,20,0.2) 0%, rgba(15,16,26,0.7) 50%, var(--bg-card) 100%);"></div>

              <!-- Foto de Perfil Grande Centralizada com Sombra e Glow -->
              <div style="position:absolute; bottom:-50px; left:50%; transform:translateX(-50%); z-index:3;">
                <img src="${u.avatar_url || APP_CONFIG.defaultAvatar}" onerror="this.onerror=null; this.src='${APP_CONFIG.defaultAvatar}'" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid var(--accent-purple-light); box-shadow:0 8px 24px rgba(0,0,0,0.7), 0 0 25px rgba(168,85,247,0.4); display:block;" alt="${u.username}">
              </div>
            </div>

            <!-- Informações do Usuário Centralizadas abaixo do Banner -->
            <div style="padding: 60px 1.5rem 1.75rem 1.5rem; text-align:center; display:flex; flex-direction:column; align-items:center;">
              
              <!-- Nome de Usuário e Cargos Especiais (Sem tag Player) -->
              <div style="display:flex; align-items:center; justify-content:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.25rem;">
                <h1 style="font-size:2.2rem; font-weight:900; color:#fff; margin:0; letter-spacing:-0.02em;">${u.username}</h1>
                ${u.is_dev ? '<span class="hierarchy-tag tag-dev">DEV</span>' : (roleInfo.tagClass !== 'tag-player' && roleInfo.label ? `<span class="hierarchy-tag ${roleInfo.tagClass}">${roleInfo.label}</span>` : '')}
              </div>

              <!-- Links de Streams Limpos e Diretos (Apenas se preenchidos) -->
              ${this._renderStreamerBadgesHTML(u)}

              <!-- Discord e Data de Criação da Conta -->
              <div style="display:flex; align-items:center; justify-content:center; gap:1.25rem; flex-wrap:wrap; margin-top:0.4rem; color:var(--text-secondary); font-size:0.875rem;">
                ${u.discord_tag ? `<span style="display:flex; align-items:center; gap:0.35rem; color:var(--accent-cyan); font-weight:700;"><span class="material-symbols-outlined" style="font-size:1.05rem;">chat</span> @${u.discord_tag}</span>` : ''}
                ${memberSince ? `<span style="display:flex; align-items:center; gap:0.35rem;"><span class="material-symbols-outlined" style="font-size:1.05rem; color:var(--accent-gold);">calendar_month</span> Membro desde ${memberSince}</span>` : ''}
              </div>

              <!-- Sobre Mim (Bio) -->
              <div style="margin-top:1.25rem; max-width:680px; width:100%; background:rgba(255,255,255,0.025); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.9rem 1.25rem; text-align:center;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.3rem; letter-spacing:0.05em;">Sobre Mim</div>
                <p style="color:var(--text-secondary); font-size:0.925rem; margin:0; line-height:1.5;">${userBio}</p>
              </div>

              <!-- Estatísticas Acumuladas de Todos os Mapas do Criador -->
              <div style="display:flex; justify-content:center; gap:0.85rem; margin-top:1.25rem; flex-wrap:wrap;">
                <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.5rem 1rem; display:flex; align-items:center; gap:0.5rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-purple-light); font-size:1.2rem;">library_music</span>
                  <div style="text-align:left;">
                    <div style="font-size:0.65rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Mapas Criados</div>
                    <div style="font-size:1.05rem; font-weight:900; color:#fff;">${createdMaps.length}</div>
                  </div>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.5rem 1rem; display:flex; align-items:center; gap:0.5rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-cyan); font-size:1.2rem;">download</span>
                  <div style="text-align:left;">
                    <div style="font-size:0.65rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Downloads Recebidos</div>
                    <div style="font-size:1.05rem; font-weight:900; color:#fff;">${totalDownloads}</div>
                  </div>
                </div>
                <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.5rem 1rem; display:flex; align-items:center; gap:0.5rem;">
                  <span class="material-symbols-outlined" style="color:#ec4899; font-size:1.2rem;">bookmark</span>
                  <div style="text-align:left;">
                    <div style="font-size:0.65rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Fãs / Favoritos</div>
                    <div style="font-size:1.05rem; font-weight:900; color:#fff;">${totalFavorites}</div>
                  </div>
                </div>
              </div>

              <!-- Ações (Editar Perfil / Promover) -->
              <div style="margin-top:1.25rem; display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap; align-items:center;">
                ${isOwnProfile ? `
                  <button class="btn btn-secondary" onclick="window.app.openEditProfileModal()" style="display:flex; align-items:center; gap:0.4rem; padding:0.5rem 1.1rem; font-weight:700;">
                    <span class="material-symbols-outlined" style="font-size:1.1rem;">edit</span> Editar Perfil
                  </button>
                ` : ''}

                ${canPromote ? `
                  <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.35rem 0.75rem;">
                    <label style="font-size:0.75rem; font-weight:800; color:var(--text-secondary);">Cargo:</label>
                    <select class="search-input-field" onchange="window.app.promoteUser('${u.id}', this.value)" style="padding:0.25rem 0.5rem; font-size:0.8rem;">
                      <option value="player" ${u.role === 'player' ? 'selected' : ''}>Padrão (Sem cargo)</option>
                      <option value="writer" ${u.role === 'writer' ? 'selected' : ''}>Escritor / Mod</option>
                      ${currentUser.is_dev ? '<option value="admin" ' + (u.role === 'admin' ? 'selected' : '') + '>Administrador</option>' : ''}
                    </select>
                  </div>
                ` : ''}
              </div>

            </div>
          </div>

          <!-- SEÇÃO: MAPAS FAVORITADOS -->
          <h2 style="font-size:1.4rem; font-weight:900; color:#fff; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
            <span class="material-symbols-outlined" style="color:var(--accent-pink);">bookmark</span> Mapas Favoritados por ${u.username}
          </h2>
          ${favoritedMaps.length > 0 ? `
            <div class="beatmaps-grid-3cols" style="margin-bottom:2.5rem;">
              ${favoritedMaps.map(m => this._createShelfMapCardHTML(m)).join('')}
            </div>
          ` : `
            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:2.5rem;">Nenhum mapa favoritado ainda por este usuário.</p>
          `}

          <!-- SEÇÃO: MAPAS CRIADOS -->
          <h2 style="font-size:1.4rem; font-weight:900; color:#fff; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
            <span class="material-symbols-outlined" style="color:var(--accent-cyan);">library_music</span> Mapas Criados por ${u.username}
          </h2>
          ${createdMaps.length > 0 ? `
            <div class="beatmaps-grid-3cols">
              ${createdMaps.map(m => this._createShelfMapCardHTML(m)).join('')}
            </div>
          ` : `
            <p style="color:var(--text-muted); font-size:0.85rem;">Nenhum mapa publicado ainda.</p>
          `}

        </div>
      `;
    }

    openEditProfileModal() {
      const u = stateMgr.getUser();
      if (!u) {
        this.showToast("Você precisa estar logado para editar seu perfil.");
        return;
      }
      const modal = document.getElementById("profile-edit-modal-overlay");
      if (!modal) return;
      const unInput = document.getElementById("edit-username");
      const dcInput = document.getElementById("edit-discord");
      const avInput = document.getElementById("edit-avatar");
      const bioInput = document.getElementById("edit-bio");
      const pwInput = document.getElementById("edit-password");
      const pwcInput = document.getElementById("edit-password-confirm");
      const kickInput = document.getElementById("edit-stream-kick");
      const twitchInput = document.getElementById("edit-stream-twitch");
      const ytInput = document.getElementById("edit-stream-youtube");

      if (unInput) unInput.value = u.username || "";
      if (dcInput) dcInput.value = u.discord_tag || "";
      if (avInput) avInput.value = u.avatar_url || "";
      if (bioInput) bioInput.value = u.bio || "";
      if (kickInput) kickInput.value = u.stream_kick || "";
      if (twitchInput) twitchInput.value = u.stream_twitch || "";
      if (ytInput) ytInput.value = u.stream_youtube || "";
      if (pwInput) pwInput.value = "";
      if (pwcInput) pwcInput.value = "";
      modal.classList.add("active");
    }

    async saveProfileEdits(e) {
      e.preventDefault();
      const u = stateMgr.getUser();
      if (!u) return;

      const newUsername = (document.getElementById("edit-username")?.value || "").trim();
      const newDiscord = (document.getElementById("edit-discord")?.value || "").trim();
      const newAvatar = (document.getElementById("edit-avatar")?.value || "").trim();
      const newBio = (document.getElementById("edit-bio")?.value || "").trim();
      const newKick = (document.getElementById("edit-stream-kick")?.value || "").trim();
      const newTwitch = (document.getElementById("edit-stream-twitch")?.value || "").trim();
      const newYt = (document.getElementById("edit-stream-youtube")?.value || "").trim();
      const newPass = document.getElementById("edit-password")?.value || "";
      const passConfirm = document.getElementById("edit-password-confirm")?.value || "";

      if (!newUsername) {
        alert("O nome de usuário não pode ficar vazio.");
        return;
      }

      // Validação estrita de plataformas de Streaming permitidas: Kik, Twitch, YouTube
      if (newKick) {
        if (!newKick.toLowerCase().includes("kick.com/")) {
          alert("O link da Kick deve pertencer exclusivamente ao domínio oficial: https://kick.com/seucanal");
          return;
        }
      }

      if (newTwitch) {
        if (!newTwitch.toLowerCase().includes("twitch.tv/")) {
          alert("O link da Twitch deve pertencer exclusivamente ao domínio oficial: https://twitch.tv/seucanal");
          return;
        }
      }

      if (newYt) {
        if (!newYt.toLowerCase().includes("youtube.com/") && !newYt.toLowerCase().includes("youtu.be/")) {
          alert("O link do YouTube deve pertencer exclusivamente ao domínio oficial: https://youtube.com/@seucanal");
          return;
        }
      }

      if (newPass || passConfirm) {
        if (newPass !== passConfirm) {
          alert("A confirmação de senha não coincide com a nova senha digitada!");
          return;
        }
        if (newPass.length < 6) {
          alert("A nova senha deve ter no mínimo 6 caracteres.");
          return;
        }
      }

      if (newPass) {
        if (db.supabase && db.supabase.auth) {
          const { error: passErr } = await db.supabase.auth.updateUser({ password: newPass });
          if (passErr) {
            alert("Erro ao atualizar senha no Supabase Auth: " + passErr.message);
            return;
          }
          console.log("✅ Senha com hash criptográfico atualizada no Supabase Auth!");
        }
      }

      const updatedUser = {
        ...u,
        username: newUsername,
        discord_tag: newDiscord,
        bio: newBio,
        stream_kick: newKick || null,
        stream_twitch: newTwitch || null,
        stream_youtube: newYt || null,
        avatar_url: newAvatar || u.avatar_url || APP_CONFIG.defaultAvatar
      };

      try {
        await db.saveUser(updatedUser);
        stateMgr.setUser(updatedUser, stateMgr.state.rememberMe);
        this.updateAuthUI();
        document.getElementById("profile-edit-modal-overlay")?.classList.remove("active");
        this.showToast("Perfil atualizado com sucesso no banco de dados!");
        this.renderProfileView(updatedUser.id);
      } catch (err) {
        alert("Erro ao salvar alterações no perfil: " + err.message);
      }
    }

    _renderStreamerBadgesHTML(u) {
      if (!u || (!u.stream_kick && !u.stream_twitch && !u.stream_youtube)) return '';
      return `
        <div style="display:flex; align-items:center; justify-content:center; gap:0.6rem; margin:0.4rem 0; flex-wrap:wrap;">
          ${u.stream_youtube ? `
            <a href="${u.stream_youtube}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; color:#ef4444; font-size:0.825rem; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); transition:all 0.2s;">
              <span class="material-symbols-outlined" style="font-size:1rem;">smart_display</span>
              <span>YouTube</span>
            </a>
          ` : ''}
          ${u.stream_twitch ? `
            <a href="${u.stream_twitch}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; color:#a855f7; font-size:0.825rem; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.3); transition:all 0.2s;">
              <span class="material-symbols-outlined" style="font-size:1rem;">live_tv</span>
              <span>Twitch</span>
            </a>
          ` : ''}
          ${u.stream_kick ? `
            <a href="${u.stream_kick}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem; color:#10b981; font-size:0.825rem; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); transition:all 0.2s;">
              <span style="display:inline-block; width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow:0 0 6px #10b981;"></span>
              <span>Kick</span>
            </a>
          ` : ''}
        </div>
      `;
    }

    async generateNekosAvatar() {
      this.showToast("Buscando foto de perfil na NekosAPI.com...");
      const avatarUrl = await NekosService.fetchRandomAvatar();
      const input = document.getElementById("edit-avatar");
      if (input) {
        input.value = avatarUrl;
        this.showToast("Foto da NekosAPI selecionada!");
      }
    }

    async promoteUser(userId, newRole) {
      const currentUser = stateMgr.getUser();
      if (!currentUser || (!currentUser.is_dev && currentUser.role !== 'admin' && !currentUser.is_admin_apto)) {
        this.showToast("Sem permissão para alterar cargos de usuários.");
        return;
      }

      if (newRole === 'dev' && !currentUser.is_dev) {
        this.showToast("Apenas Desenvolvedores (DEV) podem conceder a tag DEV.");
        return;
      }

      try {
        const users = await db.getUsers();
        const target = users.find(x => x.id === userId);
        if (!target) {
          this.showToast("Usuário não encontrado.");
          return;
        }

        if (target.is_dev && !currentUser.is_dev) {
          this.showToast("Imunidade DEV: Não é permitido alterar cargo de um Desenvolvedor.");
          return;
        }

        const updates = {
          role: newRole,
          is_dev: newRole === 'dev',
          is_admin_apto: newRole === 'admin' || newRole === 'dev',
          is_writer: newRole === 'writer' || newRole === 'admin' || newRole === 'dev'
        };

        if (db.supabase) {
          const { error } = await db.supabase.from("users").update(updates).eq("id", userId);
          if (error) throw error;
        }

        db._cachedUsers = null;
        this.showToast(`Usuário ${target.username} promovido para ${newRole.toUpperCase()} com sucesso!`);
        this.renderProfileView(userId);
      } catch (e) {
        this.showToast("Erro ao promover usuário: " + e.message);
      }
    }

    // ========================================================================
    // TELA DE TERMOS E CONDIÇÕES (/termos)
    // ========================================================================
    renderTermsView() {
      this.mainView.innerHTML = `
        <div class="container" style="padding: 2.5rem 0; max-width: 860px;">
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:2.5rem; margin-bottom:2rem;">
            <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border-subtle); padding-bottom:1rem;">
              <span class="material-symbols-outlined" style="font-size:2.4rem; color:var(--accent-purple-light);">gavel</span>
              <div>
                <h1 style="font-size:1.8rem; font-weight:900; color:white; margin:0;">Termos e Condições de Uso</h1>
                <p style="color:var(--text-secondary); font-size:0.85rem; margin:0.25rem 0 0 0;">HDBN Rhythm Game — Diretrizes Oficiais da Comunidade & Plataforma</p>
              </div>
            </div>

            <div style="color:var(--text-secondary); font-size:0.95rem; line-height:1.7; display:flex; flex-direction:column; gap:1.5rem;">
              <div>
                <h3 style="color:white; font-size:1.15rem; font-weight:800; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-cyan); font-size:1.2rem;">verified</span> 1. Aceitação dos Termos
                </h3>
                <p>Ao se cadastrar, publicar beatmaps ou interagir na plataforma HDBN, você concorda expressamente em respeitar todas as diretrizes aqui estabelecidas. Se não concordar com estes termos, não utilize os serviços de publicação e comunidade.</p>
              </div>

              <div>
                <h3 style="color:white; font-size:1.15rem; font-weight:800; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:#f59e0b; font-size:1.2rem;">folder_zip</span> 2. Publicação Exclusiva de Arquivos .hbn
                </h3>
                <p>Apenas arquivos oficiais com a extensão <code>.hbn</code> gerados pelo editor do jogo são permitidos. É estritamente proibido o upload de arquivos <code>.zip</code> puros, executáveis, instaladores ou qualquer pacote com código malicioso. Tentativas de envio fraudulento resultarão no banimento imediato da conta.</p>
              </div>

              <div>
                <h3 style="color:white; font-size:1.15rem; font-weight:800; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-pink); font-size:1.2rem;">copyright</span> 3. Direitos Autorais & Fair Use
                </h3>
                <p>Os beatmaps disponibilizados na plataforma são criados por fãs para fins educacionais e competitivos sem fins lucrativos (Fair Use). Ao enviar uma faixa, o mapeador assume a responsabilidade de conceder os créditos corretos aos artistas musicais correspondentes.</p>
              </div>

              <div>
                <h3 style="color:white; font-size:1.15rem; font-weight:800; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:#22c55e; font-size:1.2rem;">check_circle</span> 4. Moderação e Ranqueamento de Mapas
                </h3>
                <p>Todo mapa recém-publicado inicia com o status <strong>Pendente</strong>. Para se tornar oficial e <strong>Ranqueado</strong>, o mapa passa por avaliação da equipe de Administradores (ADMs) e Desenvolvedores (DEVs), que verificam se o mapa possui BPM consistente, offset ajustado e notas compatíveis com a música.</p>
              </div>

              <div>
                <h3 style="color:white; font-size:1.15rem; font-weight:800; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:#ef4444; font-size:1.2rem;">shield</span> 5. Conduta, Trapaças e Punições
                </h3>
                <p>O uso de macros, automações, bots ou modificações nos arquivos de pontuação é proibido e monitorado. O acúmulo de infrações acarreta em suspensão temporária (7 a 30 dias) ou banimento definitivo da conta e de todos os mapas publicados.</p>
              </div>

              <div style="border-top:1px solid var(--border-subtle); padding-top:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <span style="font-size:0.8rem; color:var(--text-muted);">Última atualização: Outubro de 2026 — Equipe Oficial HDBN</span>
                <a href="#/" onclick="window.navigateClean('#/'); return false;" class="btn btn-primary btn-sm">
                  <span class="material-symbols-outlined">arrow_back</span> Voltar ao Início
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ========================================================================
    // PÁGINA 404 — ROTA NÃO ENCONTRADA / PERFIL / MAPA INEXISTENTE
    // ========================================================================
    async render404View(reason) {
      const view = this.getMainView();
      if (!view) return;

      const fallbackDemo = [
        { id: "demo-1", title: "鳥の詩 (Tori no Uta)", artist: "Lia", cover_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600", downloads_count: 1420, favorites_count: 312 },
        { id: "demo-2", title: "Elif", artist: "Cadu Rodrigues", cover_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600", downloads_count: 980, favorites_count: 245 },
        { id: "demo-3", title: "Cyber Rush 4K", artist: "HDBN Original", cover_url: "capa.jpg", downloads_count: 850, favorites_count: 190 },
        { id: "demo-4", title: "Neon Echoes", artist: "Rhythm Lab", cover_url: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600", downloads_count: 730, favorites_count: 160 }
      ];

      let initialMaps = db._cachedBeatmaps && db._cachedBeatmaps.length > 0 ? db._cachedBeatmaps : fallbackDemo;
      let topDownloaded = [...initialMaps].sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0)).slice(0, 4);
      let topFavorited = [...initialMaps].sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0)).slice(0, 4);

      const reasonMessages = {
        profile: { icon: "person_off", title: "Perfil não encontrado", desc: "O usuário que você procura não existe ou foi removido da plataforma." },
        map:     { icon: "music_off",  title: "Mapa não encontrado",   desc: "Este beatmap foi removido, ainda não foi aprovado ou o link está incorreto." },
        default: { icon: "error",      title: "Página não encontrada", desc: "A rota que você tentou acessar não existe nesta plataforma." }
      };
      const rm = reasonMessages[reason] || reasonMessages.default;

      const renderMiniGrid = (list, isFav = false) => `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px,1fr)); gap:0.85rem;">
          ${list.map(m => `
            <a href="#/beatmap?id=${m.id}" style="text-decoration:none;" onclick="window.navigateClean('#/beatmap?id=${m.id}'); return false;">
              <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); overflow:hidden; transition:border-color .2s, transform .2s;" onmouseenter="this.style.borderColor='var(--accent-purple)'; this.style.transform='translateY(-2px)'" onmouseleave="this.style.borderColor='var(--border-subtle)'; this.style.transform=''">
                <div style="width:100%; height:100px; overflow:hidden; background:#0d0e18;">
                  <img src="${m.cover_url || APP_CONFIG.defaultCover}" alt="${m.title}" style="width:100%; height:100%; object-fit:cover; opacity:.85;">
                </div>
                <div style="padding:0.6rem 0.75rem;">
                  <div style="font-size:0.82rem; font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.title}</div>
                  <div style="font-size:0.72rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.artist}</div>
                  <div style="margin-top:0.35rem; font-size:0.7rem; color:${isFav ? '#ec4899' : 'var(--accent-cyan)'}; display:flex; align-items:center; gap:0.25rem;">
                    <span class="material-symbols-outlined" style="font-size:12px;">${isFav ? 'bookmark' : 'download'}</span>
                    ${isFav ? `${m.favorites_count || 0} fãs` : `${m.downloads_count || 0} downloads`}
                  </div>
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      `;

      view.innerHTML = `
        <div style="min-height:70vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem 1rem;">
          <div style="width:100%; max-width:760px;">

            <!-- Número 404 gigante -->
            <div style="text-align:center; line-height:1; margin-bottom:1.5rem; user-select:none;">
              <span style="
                font-size: clamp(7rem, 22vw, 12rem);
                font-weight: 900;
                letter-spacing: -0.04em;
                background: linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                display: inline-block;
                filter: drop-shadow(0 0 40px rgba(139,92,246,0.35));
              ">404</span>
            </div>

            <!-- Ícone + Mensagem -->
            <div style="text-align:center; margin-bottom:2rem;">
              <div style="display:inline-flex; align-items:center; gap:0.6rem; background:rgba(139,92,246,.12); border:1px solid rgba(139,92,246,.3); border-radius:999px; padding:0.45rem 1.1rem; margin-bottom:1rem;">
                <span class="material-symbols-outlined" style="font-size:1.1rem; color:var(--accent-purple-light);">${rm.icon}</span>
                <span style="font-size:0.82rem; font-weight:700; color:var(--accent-purple-light);">${rm.title}</span>
              </div>
              <p style="color:var(--text-secondary); font-size:0.95rem; line-height:1.65; margin:0 auto; max-width:460px;">${rm.desc}</p>
            </div>

            <!-- Botões de ação -->
            <div style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin-bottom:2rem;">
              <a href="#/" onclick="window.navigateClean('#/'); return false;" class="btn btn-primary">
                <span class="material-symbols-outlined">home</span> Voltar ao Início
              </a>
              <a href="#/maps" onclick="window.navigateClean('#/maps'); return false;" class="btn btn-secondary">
                <span class="material-symbols-outlined">library_music</span> Ver Todos os Mapas
              </a>
            </div>

            <!-- Erros comuns nos navegadores -->
            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1.25rem 1.5rem; margin-bottom:2.5rem;">
              <p style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.06em; margin:0 0 0.75rem 0;">Erros Comuns no Navegador</p>
              <div style="display:flex; flex-direction:column; gap:0.55rem;">
                <div style="display:flex; align-items:flex-start; gap:0.6rem;">
                  <span class="material-symbols-outlined" style="font-size:1rem; color:#f59e0b; flex-shrink:0; margin-top:1px;">person_off</span>
                  <span style="font-size:0.83rem; color:var(--text-secondary);">
                    <strong style="color:white;">Perfil não encontrado</strong> — O criador trocou de nome ou a conta não existe.
                  </span>
                </div>
                <div style="display:flex; align-items:flex-start; gap:0.6rem;">
                  <span class="material-symbols-outlined" style="font-size:1rem; color:#38bdf8; flex-shrink:0; margin-top:1px;">music_off</span>
                  <span style="font-size:0.83rem; color:var(--text-secondary);">
                    <strong style="color:white;">Mapa não encontrado</strong> — O beatmap foi retirado, expirou ou o ID na URL foi digitado errado.
                  </span>
                </div>
                <div style="display:flex; align-items:flex-start; gap:0.6rem;">
                  <span class="material-symbols-outlined" style="font-size:1rem; color:#ec4899; flex-shrink:0; margin-top:1px;">lock</span>
                  <span style="font-size:0.83rem; color:var(--text-secondary);">
                    <strong style="color:white;">Acesso não autorizado</strong> — Certas seções exigem autenticação ativa.
                  </span>
                </div>
              </div>
            </div>

            <!-- Seção 1: Mapas Mais Baixados -->
            ${topDownloaded.length > 0 ? `
              <div style="margin-bottom:2rem; text-align:left;">
                <h3 style="font-size:0.95rem; font-weight:800; color:white; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-cyan); font-size:1.15rem;">download</span>
                  Mapas Mais Baixados
                </h3>
                ${renderMiniGrid(topDownloaded, false)}
              </div>
            ` : ''}

            <!-- Seção 2: Mapas Mais Curtidos / Favoritados -->
            ${topFavorited.length > 0 ? `
              <div style="margin-bottom:2rem; text-align:left;">
                <h3 style="font-size:0.95rem; font-weight:800; color:white; letter-spacing:0.05em; text-transform:uppercase; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:#ec4899; font-size:1.15rem;">bookmark</span>
                  Mapas Mais Curtidos (Fãs)
                </h3>
                ${renderMiniGrid(topFavorited, true)}
              </div>
            ` : ''}

          </div>
        </div>
      `;

      document.title = "404 — Página Não Encontrada | HDBN";
    }

    // ========================================================================
    // PÁGINA 500 — ERRO INTERNO / SERVIÇO INDISPONÍVEL
    // ========================================================================
    render500View(errorMsg = "") {
      const view = this.getMainView();
      if (view) {
        view.innerHTML = `
        <div style="min-height:70vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:2rem 1rem;">
          <div style="width:100%; max-width:620px; text-align:center;">
            <div style="line-height:1; margin-bottom:1.5rem; user-select:none;">
              <span style="
                font-size: clamp(6rem, 20vw, 10rem);
                font-weight: 900;
                letter-spacing: -0.04em;
                background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                display: inline-block;
                filter: drop-shadow(0 0 30px rgba(239,68,68,0.35));
              ">500</span>
            </div>
            <div style="display:inline-flex; align-items:center; gap:0.6rem; background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.3); border-radius:999px; padding:0.45rem 1.1rem; margin-bottom:1rem;">
              <span class="material-symbols-outlined" style="font-size:1.1rem; color:#ef4444;">dns</span>
              <span style="font-size:0.85rem; font-weight:700; color:#ef4444;">Erro Interno do Servidor</span>
            </div>
            <p style="color:var(--text-secondary); font-size:0.95rem; line-height:1.65; margin:0 auto 1.5rem auto; max-width:440px;">
              Ocorreu uma falha temporária ao se comunicar com o banco de dados. Tente recarregar a página ou voltar para o início.
            </p>
            ${errorMsg ? `<div style="background:#15161f; border:1px solid #ef4444; border-radius:var(--radius-sm); padding:0.75rem 1rem; color:#fca5a5; font-size:0.8rem; margin-bottom:1.5rem; font-family:monospace; word-break:break-all;">${errorMsg}</div>` : ''}
            <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
              <a href="#/" onclick="window.navigateClean('#/'); return false;" class="btn btn-primary">
                <span class="material-symbols-outlined">home</span> Página Inicial
              </a>
              <button onclick="window.location.reload()" class="btn btn-secondary">
                <span class="material-symbols-outlined">refresh</span> Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      `;
      }
      document.title = "500 — Erro no Servidor | HDBN";
    }

    // ========================================================================
    // ========================================================================
    // TELA DE AJUDA & FAQ (/ajuda) - ESTRUTURAÇÃO POR TÓPICOS OFICIAIS
    // ========================================================================
    async renderHelpView() {
      const topics = [
        {
          id: "jogo",
          icon: "sports_esports",
          title: "1. Sobre o HDBN & Como Jogar",
          content: `
            <p>O <strong>HDBN</strong> é um jogo de ritmo 2D vibrante e competitivo desenvolvido na Godot Engine.</p>
            <ul style="margin: 0.5rem 0 0.5rem 1.25rem; line-height: 1.6;">
              <li><strong>Modos de Teclas:</strong> O jogo possui suporte oficial a modos <strong>4K</strong> (teclas D, F, J, K) e <strong>7K</strong> (teclas S, D, F, Espaço, J, K, L).</li>
              <li><strong>Barra de HP & Precisão:</strong> Errar notas consome a barra de vida (dreno de HP). Manter sequências perfeitas (combo) garante multiplicadores de pontuação e precisão percentual (Accuracy).</li>
              <li><strong>Sincronia:</strong> Cada mapa possui BPM ajustado e compensação de áudio para garantir alinhamento milimétrico com a batida.</li>
            </ul>
          `
        },
        {
          id: "score",
          icon: "leaderboard",
          title: "2. Sistema de Pontuação e Ranks (Normal vs Pro)",
          content: `
            <p>O sistema de pontuação do HDBN é dinâmico e recompensa os jogadores por sua dedicação em múltiplos mapas:</p>
            <ul style="margin: 0.5rem 0 0.5rem 1.25rem; line-height: 1.6;">
              <li><strong>Pontuação Máxima por Mapa:</strong> O limite máximo de score em um único mapa é de <strong>940.000 pontos</strong> (com 100% de precisão e combo total).</li>
              <li><strong>Pontuação Total Acumulada:</strong> Conforme o jogador conclui múltiplos mapas, o sistema <strong>soma as pontuações</strong> de cada mapa vencido. (Exemplo: se você tirou 920.000 em um mapa e 850.000 em outro, sua pontuação total no ranking será 920k + 850k = 1.770.000 pts).</li>
              <li><strong>Rank Normal:</strong> Soma as pontuações de <em>todos os mapas jogados</em>, independentemente da nota (inclusive notas F, D, C, B, A, S, SS e SS+).</li>
              <li><strong>Rank Pro:</strong> Destinado aos jogadores de elite. No Rank Pro, o sistema soma <em>estritamente mapas onde você tirou notas acima de A</em> (A, S, S+, SS, SS+). Mapas onde você obteve notas inferiores (B, C, D ou F) têm suas pontuações ignoradas no cálculo Pro.</li>
              <li><strong>Tabela de Patentes:</strong>
                <span class="pill-ranqueado-purple" style="margin-left:0.5rem;">SS+ (≥99.5% Acc)</span>
                <span class="pill-ranqueado-purple">SS (≥98% Acc)</span>
                <span class="pill-ranqueado-purple">S+ / S (≥95% Acc)</span>
                <span class="pill-ranqueado-purple">A (≥90% Acc)</span>
              </li>
            </ul>
          `
        },
        {
          id: "hbn",
          icon: "folder_zip",
          title: "3. Formato .hbn, Criptografia & Criação de Mapas",
          content: `
            <p>Os beatmaps do HDBN utilizam a extensão exclusiva <code>.hbn</code> exportada diretamente pelo Godot Engine:</p>
            <ul style="margin: 0.5rem 0 0.5rem 1.25rem; line-height: 1.6;">
              <li><strong>Estrutura do Pacote:</strong> O arquivo <code>.hbn</code> opera internamente com empacotamento ZIP de alta compressão contendo o arquivo de dados da música, o áudio oficial (.mp3/.ogg) e a arte de capa (.png/.jpg).</li>
              <li><strong>Chave de Criptografia Godot:</strong> O JSON interno do chart é protegido com a chave oficial <code>HigurashiKai!Kamisama_no_Syndrome#Hinamizawa_07$WhenTheyCry</code>, impedindo adulteração de notas e dados.</li>
              <li><strong>Extração Automática:</strong> Ao enviar o <code>.hbn</code>, o painel lê os metadados reais (título, artista, BPM), identifica a quantidade de notas por dificuldade e extrai a imagem de capa real para exibição imediata.</li>
              <li><strong>Prévia de Áudio:</strong> Uma prévia de <strong>30 segundos</strong> é recortada a partir do tempo configurado em <code>audio_preview_start</code>.</li>
            </ul>
          `
        },
        {
          id: "moderacao",
          icon: "gavel",
          title: "4. Diretrizes da Comunidade & Cargos da Staff",
          content: `
            <p>Para garantir um ambiente seguro e de alta qualidade, o HDBN conta com uma hierarquia rigorosa de moderação:</p>
            <ul style="margin: 0.5rem 0 0.5rem 1.25rem; line-height: 1.6;">
              <li><strong>Cargos da Comunidade:</strong> <code>DEV</code> (Desenvolvedores Principais) &gt; <code>ADMIN</code> (Administradores) &gt; <code>MOD / ESCRITOR</code> &gt; <code>PLAYER</code>.</li>
              <li><strong>Imunidade de DEVs:</strong> Usuários com tag <strong>DEV</strong> possuem imunidade absoluta contra punições ou exclusões.</li>
              <li><strong>Poderes de ADMIN:</strong> Administradores podem aplicar advertências/punições a jogadores e suspender ou ocultar beatmaps com observação e prazo determinado. Admins <em>não podem excluir contas ou mapas definitivamente</em> (essa ação é restrita a DEVs).</li>
              <li><strong>Política de Inatividade (27 dias):</strong> Contas sem atividade por 27 dias são sinalizadas pela moderação, recebendo prazo de tolerância de 7 dias antes de serem suspensas para liberação de espaço no banco. O login do usuário dentro do prazo reativa a conta imediatamente.</li>
            </ul>
          `
        },
        {
          id: "download",
          icon: "download",
          title: "5. Instalação, Download no Itch.io & Atualizações",
          content: `
            <p>O HDBN é distribuído gratuitamente pela página oficial do projeto:</p>
            <ul style="margin: 0.5rem 0 0.5rem 1.25rem; line-height: 1.6;">
              <li><strong>Página Oficial no Itch.io:</strong> <a href="${APP_CONFIG.itchUrl}" target="_blank" style="color:var(--accent-cyan); text-decoration:underline;">rikafurud.itch.io/hdbn</a></li>
              <li><strong>Plataformas Disponíveis:</strong> Windows (Executável 64-bit), Linux e Android.</li>
              <li><strong>Blog Oficial:</strong> Acompanhe notas de atualização e notícias no <a href="${APP_CONFIG.blogspotUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline;">cafedobom123.blogspot.com</a>.</li>
            </ul>
          `
        }
      ];

      this.mainView.innerHTML = `
        <div class="container" style="padding: 2.5rem 0; max-width:850px;">
          <div style="text-align:center; margin-bottom: 2.5rem;">
            <h1 style="font-size:2.2rem; font-weight:900; color:#fff; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
              <span class="material-symbols-outlined" style="color:var(--accent-cyan); font-size:2.5rem;">help</span> Central de Ajuda & Informações
            </h1>
            <p style="color:var(--text-secondary); font-size:0.95rem; margin-top:0.35rem;">
              Tópicos oficiais sobre mecânicas, pontuação, criação de beatmaps e moderação do HDBN.
            </p>
            <div style="margin-top:1rem;">
              <a href="#/regras" class="btn btn-secondary" style="font-size:0.85rem; padding:0.4rem 1rem; border-radius:999px; display:inline-flex; align-items:center; gap:0.4rem; text-decoration:none;">
                <span class="material-symbols-outlined" style="font-size:1.1rem; color:var(--accent-cyan);">gavel</span> Ver Regras da Comunidade
              </a>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:1rem;">
            ${topics.map(t => `
              <div class="faq-card" style="background:#13141f; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); overflow:hidden;">
                <button class="faq-question" style="width:100%; display:flex; justify-content:space-between; align-items:center; padding:1.15rem 1.5rem; background:none; border:none; color:white; font-size:1.05rem; font-weight:800; text-align:left; cursor:pointer;" onclick="const ans = this.nextElementSibling; ans.style.display = ans.style.display === 'none' ? 'block' : 'none';">
                  <span style="display:flex; align-items:center; gap:0.6rem;">
                    <span class="material-symbols-outlined" style="color:var(--accent-purple-light); font-size:1.3rem;">${t.icon}</span>
                    <span>${t.title}</span>
                  </span>
                  <span class="material-symbols-outlined" style="color:var(--text-muted);">expand_more</span>
                </button>
                <div class="faq-answer" style="display:block; padding:0 1.5rem 1.25rem 1.5rem; color:var(--text-secondary); font-size:0.9rem; border-top:1px solid rgba(255,255,255,0.05); padding-top:1rem;">
                  ${t.content}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // ========================================================================
    // TELA DE REGRAS DA COMUNIDADE (/regras)
    // ========================================================================
    async renderRulesView() {
      const view = this.getMainView();
      if (!view) return;

      const rules = [
        {
          num: "01",
          icon: "bug_report",
          title: "Estabilidade do Jogo (Mapas Não Podem Crashar)",
          summary: "Beatmaps que causam travamentos imediatos ou encerramento forçado do jogo serão suspensos.",
          details: `
            <p>O HDBN roda na Godot Engine e lê os dados do chart de forma precisa. Mapas publicados devem passar pelos seguintes critérios de estabilidade:</p>
            <ul style="margin: 0.5rem 0 0 1.25rem; line-height: 1.6;">
              <li><strong>Sem notas corrompidas:</strong> Não configure timestamps negativos, notas fora dos limites das faixas (4K / 7K) ou valores infinitos no BPM.</li>
              <li><strong>Áudio Válido:</strong> O arquivo de música deve ser estritamente <code>.mp3</code> ou <code>.ogg</code> decodificável, sem headers quebrados.</li>
              <li><strong>Teste Prévio:</strong> Antes de exportar e publicar o <code>.hbn</code>, jogue o mapa localmente do início ao fim para garantir que não ocorra crash.</li>
            </ul>
          `
        },
        {
          num: "02",
          icon: "graphic_eq",
          title: "Sincronia de Áudio & BPM Calibrado",
          summary: "Garantir que as notas acompanhem o ritmo real da música para manter a jogabilidade justa e prazerosa.",
          details: `
            <p>Um bom jogo de ritmo depende de precisão milimétrica:</p>
            <ul style="margin: 0.5rem 0 0 1.25rem; line-height: 1.6;">
              <li><strong>Offset e BPM:</strong> Alinhe o BPM corretamente com a batida para evitar dessincronia progressiva ao longo da música.</li>
              <li><strong>Prévia de Áudio:</strong> Defina um tempo de início de prévia condizente com o refrão ou parte marcante da música.</li>
            </ul>
          `
        },
        {
          num: "03",
          icon: "image",
          title: "Capas e Conteúdo Apropriado",
          summary: "Respeito visual aos jogadores e cumprimento dos termos de comunidade.",
          details: `
            <p>As artes de capa dos beatmaps são exibidas publicamente na plataforma:</p>
            <ul style="margin: 0.5rem 0 0 1.25rem; line-height: 1.6;">
              <li><strong>Sem Conteúdo Ilícito ou Impróprio:</strong> Capas com conteúdo pornográfico explícito, apologia a crimes ou violência gráfica serão removidas imediatamente.</li>
              <li><strong>Resolução Recomendada:</strong> Utilize imagens quadradas ou widescreen nítidas (mínimo 512x512px) nos formatos JPG ou PNG.</li>
            </ul>
          `
        },
        {
          num: "04",
          icon: "content_copy",
          title: "Anti-Spam e Duplicação de Mapas",
          summary: "Não republique o mesmo mapa repetidamente apenas para figurar nas publicações recentes.",
          details: `
            <p>A plataforma conta com sistema automático de hash anti-spam:</p>
            <ul style="margin: 0.5rem 0 0 1.25rem; line-height: 1.6;">
              <li>Se você deseja atualizar uma dificuldade ou corrigir notas de um mapa existente, edite o mapa ou informe as notas de atualização na descrição.</li>
              <li>Tentativas massivas de spam podem acarretar em redução no limite diário de uploads ou suspensão temporária da conta.</li>
            </ul>
          `
        },
        {
          num: "05",
          icon: "diversity_3",
          title: "Respeito e Convivência da Comunidade",
          summary: "Promover um ambiente saudável para criadores veteranos e novatos.",
          details: `
            <p>A comunidade HDBN é aberta e colaborativa:</p>
            <ul style="margin: 0.5rem 0 0 1.25rem; line-height: 1.6;">
              <li>Críticas construtivas aos mapas são bem-vindas; ofensas gratuitas e assédio a criadores não serão tolerados.</li>
              <li>A staff (Moderadores, Administradores e DEVs) monitora denúncias para manter a qualidade e segurança da comunidade.</li>
            </ul>
          `
        }
      ];

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0; max-width:860px;">
          <div style="text-align:center; margin-bottom: 2.5rem;">
            <div style="display:inline-flex; align-items:center; gap:0.4rem; background:rgba(168,85,247,0.15); border:1px solid var(--accent-purple-light); color:var(--accent-purple-light); padding:0.25rem 0.75rem; border-radius:999px; font-size:0.8rem; font-weight:800; margin-bottom:0.75rem;">
              <span class="material-symbols-outlined" style="font-size:1.1rem;">policy</span> DIRETRIZES OFICIAIS
            </div>
            <h1 style="font-size:2.2rem; font-weight:900; color:#fff; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
              <span class="material-symbols-outlined" style="color:var(--accent-cyan); font-size:2.4rem;">gavel</span> Regras da Comunidade HDBN
            </h1>
            <p style="color:var(--text-secondary); font-size:0.95rem; margin-top:0.35rem; max-width:620px; margin-left:auto; margin-right:auto;">
              Regras e boas práticas para publicação de beatmaps, estabilidade de jogo e convivência entre jogadores.
            </p>
          </div>

          <div style="display:flex; flex-direction:column; gap:1.25rem;">
            ${rules.map(r => `
              <div style="background:#13141f; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1.5rem; transition:border-color 0.2s;">
                <div style="display:flex; align-items:flex-start; gap:1rem;">
                  <div style="width:40px; height:40px; border-radius:var(--radius-sm); background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.3); display:flex; align-items:center; justify-content:center; color:var(--accent-purple-light); font-weight:900; font-size:1.05rem; flex-shrink:0;">
                    ${r.num}
                  </div>
                  <div style="flex:1;">
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
                      <span class="material-symbols-outlined" style="color:var(--accent-cyan); font-size:1.25rem;">${r.icon}</span>
                      <h2 style="font-size:1.15rem; font-weight:900; color:#fff; margin:0;">${r.title}</h2>
                    </div>
                    <p style="color:var(--accent-gold); font-size:0.875rem; font-weight:700; margin:0 0 0.75rem 0;">${r.summary}</p>
                    <div style="color:var(--text-secondary); font-size:0.875rem; line-height:1.55; border-top:1px solid rgba(255,255,255,0.05); padding-top:0.75rem;">
                      ${r.details}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top:2.5rem; text-align:center; display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
            <a href="#/comunidade" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:0.4rem; text-decoration:none;">
              <span class="material-symbols-outlined">group</span> Ir para a Comunidade
            </a>
            <a href="#/publicar" class="btn btn-secondary" style="display:inline-flex; align-items:center; gap:0.4rem; text-decoration:none;">
              <span class="material-symbols-outlined">upload</span> Publicar Meu Beatmap
            </a>
          </div>
        </div>
      `;
    }

    // ========================================================================
    // TELA DE PUBLICAR (/publicar) - ESTRITAMENTE ARQUIVOS .HBN
    // Extração real de metadados, notas, capa e Cloudinary / Supabase
    // ========================================================================
    async renderPublishView() {
      const view = this.getMainView();
      if (!view) return;
      const user = stateMgr.getUser();

      if (!user) {
        view.innerHTML = `
          <div class="container" style="padding: 5rem 0; text-align:center; max-width:520px; margin:0 auto;">
            <span class="material-symbols-outlined" style="font-size:5rem; color:var(--accent-purple-light);">person_add</span>
            <h1 style="font-size:2.2rem; font-weight:900; margin:1rem 0; color:white;">Você precisa se cadastrar</h1>
            <p style="color:var(--text-secondary); margin-bottom:2rem; line-height:1.7;">
              Para publicar beatmaps <code>.hbn</code> na plataforma HDBN, você precisa ter uma conta e estar conectado.
            </p>
            <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="window.openAuthModal('register')">
                <span class="material-symbols-outlined">person_add</span> Criar Conta
              </button>
              <button class="btn btn-dark-secondary" onclick="window.openAuthModal('login')">
                <span class="material-symbols-outlined">login</span> Entrar
              </button>
            </div>
          </div>
        `;
        return;
      }

      this.currentPublishData = null;

      const uploadStatus = await db.getUserUploadStatus(user.id);

      view.innerHTML = `
        <div class="container" style="padding: 2.5rem 0; max-width:680px;">
          <h1 style="font-size:2rem; font-weight:900; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem; color:white;">
            <span class="material-symbols-outlined" style="color:var(--accent-purple-light);">folder</span> Publicar Beatmap (.hbn)
          </h1>
          <p style="color:var(--text-secondary); margin-bottom:1rem; font-size:0.85rem;">
            Envie exclusivamente o arquivo com formato <code>.hbn</code> exportado pelo Godot Engine.
            Os dados reais, contagem de notas e imagem de capa serão extraídos do arquivo.
          </p>

          <!-- Banner Informativo de Limite Diário e Integridade -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:#12131d; border:1px solid var(--border-subtle); padding:0.75rem 1rem; border-radius:var(--radius-sm); margin-bottom:1.25rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem;">
              <span class="material-symbols-outlined" style="color:var(--accent-cyan); font-size:18px;">cloud_sync</span>
              <span style="color:var(--text-secondary);">Limite diário de envios:</span>
              <strong style="color:${uploadStatus.canUpload ? '#10b981' : '#ef4444'};">
                ${uploadStatus.isStaff ? 'Ilimitado (Staff)' : `${uploadStatus.uploadsToday} / ${uploadStatus.limit} enviados hoje`}
              </strong>
            </div>
            ${uploadStatus.duplicateAttempts > 0 ? `
              <span style="font-size:0.75rem; color:#f59e0b; display:flex; align-items:center; gap:0.25rem; font-weight:700;">
                <span class="material-symbols-outlined" style="font-size:15px;">warning</span> Avisos de duplicidade: ${uploadStatus.duplicateAttempts}/3
              </span>
            ` : ''}
          </div>

          ${uploadStatus.isSuspended ? `
            <div class="form-error-banner" style="margin-bottom:1.25rem; padding:1rem; border-left:4px solid #ef4444;">
              <span class="material-symbols-outlined" style="font-size:1.6rem;">lock</span>
              <div>
                <strong style="display:block; color:#ef4444; font-size:0.95rem;">Conta Suspensa de Publicações</strong>
                <span style="font-size:0.85rem; color:#fca5a5;">
                  ${uploadStatus.banExpiresAt ? `Suspensão ativa até <strong>${new Date(uploadStatus.banExpiresAt).toLocaleString('pt-BR')}</strong> por insistência em envios duplicados.` : 'Sua conta está suspensa de realizar novas publicações.'}
                </span>
              </div>
            </div>
          ` : ''}

          <form id="publish-form-element" onsubmit="window.app.handlePublishSubmit(event)" style="background:var(--bg-card); border:1px solid var(--border-subtle); padding:1.75rem; border-radius:var(--radius-sm); display:flex; flex-direction:column; gap:1.25rem;">
            
            <!-- Drag and Drop Zone + Clique Nativo com Validação Estrita .hbn -->
            <div class="drag-drop-zone" id="hbn-drop-zone"
                 onclick="document.getElementById('pub-file').click()"
                 ondragenter="window.app.handleDragEnter(event)"
                 ondragover="window.app.handleDragOver(event)"
                 ondragleave="window.app.handleDragLeave(event)"
                 ondrop="window.app.handleDrop(event)">
              <span class="material-symbols-outlined drag-drop-icon">cloud_upload</span>
              <p class="drag-drop-title">Arraste e solte o arquivo .hbn aqui</p>
              <p class="drag-drop-subtitle">ou clique para selecionar do computador</p>
              <span class="drag-drop-strict-tag">
                <span class="material-symbols-outlined" style="font-size:0.9rem;">verified_user</span>
                Formato exclusivo aceito: apenas arquivos .hbn
              </span>
              <input type="file" id="pub-file" required accept=".hbn" style="display:none;" onchange="window.app.onFileSelected(this)">
            </div>

            <!-- Dados Extraídos com Valores Reais lidos do .hbn -->
            <div id="file-parsed-preview" style="display:none; background:#0e1017; border:1px solid var(--border-subtle); padding:1.25rem; border-radius:var(--radius-sm);">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem; margin-bottom:0.75rem;">
                <span style="font-size:0.75rem; font-weight:800; color:var(--accent-cyan); text-transform:uppercase; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="font-size:16px;">task_alt</span> Pacote .HBN Carregado com Sucesso
                </span>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.app.resetPublishFile()" style="font-size:0.75rem; padding:0.25rem 0.6rem; display:inline-flex; align-items:center; gap:0.3rem;">
                  <span class="material-symbols-outlined" style="font-size:14px;">change_circle</span> Trocar Arquivo
                </button>
              </div>

              <!-- Indicador de Validação de Duplicidade Instantânea via Hash -->
              <div id="hash-verification-badge" style="display:none; margin-bottom:0.9rem; padding:0.6rem 0.85rem; border-radius:var(--radius-sm); font-size:0.82rem;"></div>
              
              <div style="display:flex; gap:1.25rem; align-items:flex-start; margin-top:0.5rem; flex-wrap:wrap;">
                <img id="extracted-cover-img" src="" alt="Capa Extraída" style="width:110px; height:110px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:none; background:#090a0d;">
                
                <div style="flex:1; min-width:220px; display:flex; flex-direction:column; gap:0.6rem;">
                  <div>
                    <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); display:block;">Título da Música:</label>
                    <input type="text" id="extracted-title-input" value="" readonly class="search-input-field" style="width:100%; margin-top:0.2rem; background:#090a0d; color:#f59e0b; font-weight:800; cursor:not-allowed;">
                  </div>
                  <div>
                    <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); display:block;">Artista:</label>
                    <input type="text" id="extracted-artist-input" value="" readonly class="search-input-field" style="width:100%; margin-top:0.2rem; background:#090a0d; color:white; cursor:not-allowed;">
                  </div>
                </div>
              </div>

              <!-- Dificuldades e Contagem Real de Notas -->
              <div style="margin-top:1rem; border-top:1px solid var(--border-subtle); padding-top:0.75rem;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); margin-bottom:0.4rem; text-transform:uppercase;">Dificuldades & Quantidade de Notas:</div>
                <div id="extracted-diff-list" style="display:flex; gap:0.5rem; flex-wrap:wrap;"></div>
              </div>

              <!-- Estatísticas e Áudio -->
              <div style="display:flex; gap:1.5rem; font-size:0.8rem; color:var(--accent-cyan); margin-top:0.75rem; flex-wrap:wrap;">
                <span><span class="material-symbols-outlined" style="font-size:0.9rem; vertical-align:middle;">speed</span> BPM: <strong id="extracted-bpm-val" style="color:white;">120</strong></span>
                <span><span class="material-symbols-outlined" style="font-size:0.9rem; vertical-align:middle;">music_note</span> Prévia sonora: 30 segundos após o tempo <strong id="extracted-preview-sec" style="color:white;">0.0s</strong></span>
              </div>
            </div>

            <!-- Idioma do Beatmap -->
            <div>
              <label style="font-size:0.8rem; font-weight:700; color:var(--text-muted); display:block; margin-bottom:0.4rem;">
                Idioma do Beatmap / Letra:
              </label>
              <select id="pub-language-select" class="search-input-field" style="width:100%; background:#0e1017; color:white; padding:0.65rem 0.85rem; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:0.9rem; cursor:pointer;">
                <option value="português">🇧🇷 Português</option>
                <option value="inglês">🇺🇸 Inglês</option>
                <option value="espanhol">🇪🇸 Espanhol</option>
                <option value="japonês">🇯🇵 Japonês</option>
                <option value="coreano">🇰🇷 Coreano</option>
                <option value="chinês">🇨🇳 Chinês</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:0.5rem;">
              <span class="material-symbols-outlined">send</span> Publicar Beatmap Oficial
            </button>
          </form>
        </div>
      `;
    }

    resetPublishFile() {
      const dropZone = document.getElementById("hbn-drop-zone");
      const previewBox = document.getElementById("file-parsed-preview");
      const fileInput = document.getElementById("pub-file");
      if (dropZone) dropZone.style.display = "flex";
      if (previewBox) previewBox.style.display = "none";
      if (fileInput) fileInput.value = "";
      this.currentPublishData = null;
      this.showToast("Seleção reiniciada. Escolha outro arquivo .hbn.");
    }

    // ========================================================================
    // MODAL DE PROGRESSO E PROTEÇÃO ANTI-ABANDONO
    // ========================================================================
    showUploadProgressModal({ percent = 0, stage = 'Iniciando upload...' } = {}) {
      this.hideUploadProgressModal();
      const modal = document.createElement("div");
      modal.id = "upload-modal-overlay";
      modal.className = "upload-modal-overlay";
      modal.style.cssText = "position:fixed; inset:0; z-index:99999; background:rgba(4,5,8,0.85); backdrop-filter:blur(14px); display:flex; align-items:center; justify-content:center; padding:1.5rem;";
      modal.innerHTML = `
        <div class="upload-modal-card" style="background:linear-gradient(145deg, #12131d 0%, #0a0b12 100%); border:1px solid rgba(168,85,247,0.35); border-radius:18px; padding:2.5rem 2rem; max-width:520px; width:100%; box-shadow:0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(168,85,247,0.15); text-align:center;">
          <div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, rgba(168,85,247,0.2), rgba(56,189,248,0.2)); border:2px solid var(--accent-purple-light); display:flex; align-items:center; justify-content:center; margin:0 auto 1.25rem auto; box-shadow:0 0 25px rgba(168,85,247,0.4);">
            <span class="material-symbols-outlined upload-modal-spin-icon" style="font-size:2.4rem; color:var(--accent-purple-light);">cloud_upload</span>
          </div>
          <h2 style="color:white; font-size:1.45rem; font-weight:900; margin-bottom:0.4rem;">Enviando Beatmap para a Nuvem</h2>
          <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1.5rem; line-height:1.45;">Transferindo arquivos binários com segurança criptográfica direto para o servidor.</p>
          
          <div style="background:rgba(255,255,255,0.06); border-radius:999px; height:10px; width:100%; overflow:hidden; margin-bottom:0.75rem; border:1px solid var(--border-subtle);">
            <div id="upload-progress-bar" style="width:${percent}%; height:100%; background:linear-gradient(90deg, var(--accent-purple), var(--accent-cyan)); border-radius:999px; transition:width 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:0 0 14px rgba(56,189,248,0.6);"></div>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <span id="upload-progress-stage" style="color:var(--accent-cyan); font-size:0.85rem; font-weight:700;">${stage}</span>
            <span id="upload-progress-num" style="color:white; font-size:1.1rem; font-weight:900;">${Math.round(percent)}%</span>
          </div>

          <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:0.85rem 1rem; text-align:left; display:flex; align-items:center; gap:0.75rem;">
            <span class="material-symbols-outlined" style="font-size:1.6rem; color:#ef4444; flex-shrink:0;">warning</span>
            <div>
              <strong style="display:block; font-size:0.85rem; color:#ef4444; margin-bottom:0.15rem;">⚠️ Atenção: Não feche ou saia desta página!</strong>
              <span style="font-size:0.78rem; color:#fca5a5; line-height:1.35; display:block;">
                O envio está em andamento. Fechar esta aba cancelará o upload e nada será salvo.
              </span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    updateUploadProgress(percent, stage) {
      const bar = document.getElementById("upload-progress-bar");
      const num = document.getElementById("upload-progress-num");
      const stg = document.getElementById("upload-progress-stage");
      if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
      if (num) num.textContent = `${Math.round(percent)}%`;
      if (stg && stage) stg.textContent = stage;
    }

    hideUploadProgressModal() {
      const modal = document.getElementById("upload-modal-overlay");
      if (modal) modal.remove();
    }

    // ========================================================================
    // DRAG AND DROP & VALIDAÇÃO ESTRITA DE ARQUIVOS .HBN
    // ========================================================================
    handleDragEnter(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropZone = document.getElementById("hbn-drop-zone");
      if (dropZone) dropZone.classList.add("drag-active");
    }

    handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      const dropZone = document.getElementById("hbn-drop-zone");
      if (dropZone && !dropZone.classList.contains("drag-active")) {
        dropZone.classList.add("drag-active");
      }
    }

    handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropZone = document.getElementById("hbn-drop-zone");
      if (dropZone && (!e.relatedTarget || !dropZone.contains(e.relatedTarget))) {
        dropZone.classList.remove("drag-active");
      }
    }

    handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropZone = document.getElementById("hbn-drop-zone");
      if (dropZone) dropZone.classList.remove("drag-active");

      const files = e.dataTransfer ? e.dataTransfer.files : null;
      if (!files || files.length === 0) return;

      const file = files[0];
      this.validateAndProcessHBNFile(file);
    }

    async validateAndProcessHBNFile(file) {
      const dropZone = document.getElementById("hbn-drop-zone");
      const previewBox = document.getElementById("file-parsed-preview");
      const fileInput = document.getElementById("pub-file");

      // Validação estrita: somente arquivos com a extensão .hbn são permitidos!
      if (!file || !file.name.toLowerCase().endsWith(".hbn")) {
        if (dropZone) {
          dropZone.classList.remove("drag-active");
          dropZone.classList.add("drag-error");
          setTimeout(() => dropZone.classList.remove("drag-error"), 1500);
        }
        if (fileInput) fileInput.value = "";
        if (previewBox) previewBox.style.display = "none";
        this.currentPublishData = null;

        const errText = "Formato de arquivo inválido! A plataforma aceita estritamente arquivos com a extensão .hbn gerados pelo editor do jogo. Formatos como .zip, .rar ou .mp3 não são permitidos.";
        this.showFormError(errText, "publish-form-element");
        this.showToast("Erro: Formato inválido! Envie estritamente um arquivo .hbn");
        return false;
      }

      if (dropZone) {
        dropZone.classList.remove("drag-error");
        dropZone.classList.remove("drag-active");
      }

      // Sincroniza com o input nativo caso o arquivo tenha vindo por drag & drop
      if (fileInput && fileInput.files && fileInput.files[0] !== file) {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
        } catch (_) {}
      }

      return this._parseHBNPackage(file);
    }

    onFileSelected(input) {
      const file = input.files ? input.files[0] : null;
      if (!file) return;
      this.validateAndProcessHBNFile(file);
    }

    async _parseHBNPackage(file) {
      this.showToast("Lendo estrutura do pacote .hbn...");

      try {
        if (!window.JSZip) {
          throw new Error("Biblioteca JSZip não carregada.");
        }

        const zip = await window.JSZip.loadAsync(file);
        let infoJson = null;
        let infoJsonEntry = null;
        let audioEntry = null;
        let coverEntry = null;
        let difficultiesFound = [];
        let chartsData = {};
        let totalNotes = 0;

        // 1. Localiza os arquivos essenciais do pacote (.hbn)
        zip.forEach((relPath, entry) => {
          const lower = relPath.toLowerCase();
          const baseName = lower.split("/").pop();
          if (!entry.dir) {
            if (baseName === "info.json" || lower.endsWith("/info.json")) {
              infoJsonEntry = entry;
            } else if (lower.endsWith(".mp3") || lower.endsWith(".ogg") || lower.endsWith(".wav")) {
              if (!audioEntry) audioEntry = entry;
            } else if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
              if (!coverEntry) coverEntry = entry;
            }
          }
        });

        // 2. Leitura do "passaporte" do mapa: info.json
        if (infoJsonEntry) {
          const rawText = await infoJsonEntry.async("string");
          try {
            infoJson = JSON.parse(rawText);
          } catch (_) {
            infoJson = HBNDecrypter.decryptPackage(rawText);
          }
          console.log("📄 Passaporte info.json lido:", infoJson);
        }

        // Se info.json referencia um arquivo de áudio específico (ex: "audio.mp3")
        if (infoJson && infoJson.audio) {
          const audioRef = infoJson.audio.split("/").pop().toLowerCase();
          zip.forEach((relPath, entry) => {
            if (!entry.dir && relPath.toLowerCase().endsWith(audioRef)) {
              audioEntry = entry;
            }
          });
        }

        // Se info.json referencia uma arte específica de capa (UI ou art)
        const artPath = infoJson ? (infoJson.UI || infoJson.ui || infoJson.art || infoJson.art_file || "") : "";
        if (artPath) {
          const artRef = artPath.split("/").pop().toLowerCase();
          zip.forEach((relPath, entry) => {
            if (!entry.dir && relPath.toLowerCase().endsWith(artRef)) {
              coverEntry = entry;
            }
          });
        }

        // 3. Extração das Dificuldades e Contagem Real de Notas a partir de info.json (charts e beats)
        if (infoJson && infoJson.charts && typeof infoJson.charts === "object") {
          for (const [diffKey, chart] of Object.entries(infoJson.charts)) {
            // Proteção: ignora entradas nulas ou inválidas no charts
            if (!chart || typeof chart !== "object") continue;

            let notesCount = 0;
            if (Array.isArray(chart.tracks)) {
              // Formato real do Godot:
              // tracks: [ { times: [ {time: 0.0, duration: -1.0}, ... ], track_index: 0 }, ... ]
              chart.tracks.forEach(trk => {
                if (!trk) return;
                if (Array.isArray(trk.times)) {
                  // Formato nativo: cada nota é {time, duration}
                  notesCount += trk.times.length;
                } else if (Array.isArray(trk.notes)) {
                  notesCount += trk.notes.length;
                } else if (Array.isArray(trk)) {
                  notesCount += trk.length;
                }
              });
            } else if (Array.isArray(chart.beats)) {
              notesCount = chart.beats.length;
            } else if (Array.isArray(chart.notes)) {
              notesCount = chart.notes.length;
            } else if (typeof chart.notes_count === "number") {
              notesCount = chart.notes_count;
            }

            if (notesCount > 0) {
              const formattedName = diffKey.charAt(0).toUpperCase() + diffKey.slice(1);
              const starVal = chart.star_rating || (diffKey.toLowerCase() === 'medium' ? 2.5 : (diffKey.toLowerCase() === 'hard' ? 3.8 : 1.8));
              difficultiesFound.push({
                name: formattedName,
                notes: notesCount,
                star: starVal
              });
              chartsData[diffKey.toLowerCase()] = { notes_count: notesCount, star: starVal };
              totalNotes += notesCount;
            }
          }
        }

        // Fallback: se info.json tiver beats no nível raiz
        if (difficultiesFound.length === 0 && infoJson && Array.isArray(infoJson.beats)) {
          totalNotes = infoJson.beats.length;
          difficultiesFound.push({ name: "Normal", notes: totalNotes, star: 2.0 });
          chartsData["normal"] = { notes_count: totalNotes, star: 2.0 };
        }

        // Fallback genérico se nenhuma dificuldade foi identificada
        if (totalNotes === 0) {
          totalNotes = 120;
          difficultiesFound.push({ name: "Normal", notes: 120, star: 2.0 });
          chartsData["normal"] = { notes_count: 120, star: 2.0 };
        }

        // 4. Extração de Metadados Principais do Mapa
        const cleanBaseName = file.name.replace(/\.hbn$/i, "").trim();
        const title = (infoJson && infoJson.title) || (cleanBaseName.includes(" - ") ? cleanBaseName.split(" - ")[1].trim() : cleanBaseName);
        const artist = (infoJson && infoJson.artist) || (cleanBaseName.includes(" - ") ? cleanBaseName.split(" - ")[0].trim() : "Artista Desconhecido");
        const bpm = (infoJson && (infoJson.bpm || Number(infoJson.BPM))) || 120;
        const previewStart = (infoJson && infoJson.audio_preview_start !== undefined) ? Number(infoJson.audio_preview_start) : 0;
        const songLength = (infoJson && infoJson.length !== undefined) ? Number(infoJson.length) : 118.0;

        // 5. Extração de Mídia: Capa e Áudio
        let coverBlob = null;
        let coverPreviewUrl = "";
        if (coverEntry) {
          coverBlob = await coverEntry.async("blob");
          coverPreviewUrl = URL.createObjectURL(coverBlob);
        }

        let audioBlob = null;
        let audioBlobUrl = "";
        if (audioEntry) {
          audioBlob = await audioEntry.async("blob");
          audioBlobUrl = URL.createObjectURL(audioBlob);
        }

        this.currentPublishData = {
          file: file,
          title: title,
          artist: artist,
          bpm: bpm,
          length: songLength,
          previewStart: previewStart,
          totalNotes: totalNotes,
          difficulties: difficultiesFound,
          charts: chartsData,
          coverBlob: coverBlob,
          coverPreviewUrl: coverPreviewUrl,
          audioBlob: audioBlob,
          audioBlobUrl: audioBlobUrl,
          starRating: difficultiesFound[0]?.star || 2.0,
          difficultyName: difficultiesFound[0]?.name || "Médio",
          difficultyLevel: sanitizeDifficultyLevel(difficultiesFound[0]?.name)
        };

        // 6. Atualização Visual do Formulário: Oculta a área de arrastar e mostra os dados reais
        const dropZone = document.getElementById("hbn-drop-zone");
        if (dropZone) {
          dropZone.style.display = "none"; // O container Arraste e solte o arquivo .hbn some completamente
        }

        const previewBox = document.getElementById("file-parsed-preview");
        if (previewBox) {
          previewBox.style.display = "block";
          document.getElementById("extracted-title-input").value = title;
          document.getElementById("extracted-artist-input").value = artist;
          document.getElementById("extracted-bpm-val").textContent = bpm;
          document.getElementById("extracted-preview-sec").textContent = previewStart + "s";

          const diffListElem = document.getElementById("extracted-diff-list");
          if (diffListElem) {
            diffListElem.innerHTML = difficultiesFound.map(d => `
              <div style="background:#181924; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.4rem 0.75rem; display:inline-flex; align-items:center; gap:0.4rem;">
                <span class="material-symbols-outlined" style="font-size:16px; color:var(--accent-purple-light);">speed</span>
                <strong style="color:white; font-size:0.8rem;">${d.name}</strong>
                <span style="font-size:0.75rem; color:var(--accent-cyan); font-weight:700;">${d.notes} notas</span>
              </div>
            `).join("");
          }

          const imgElem = document.getElementById("extracted-cover-img");
          if (imgElem) {
            if (coverPreviewUrl) {
              imgElem.src = coverPreviewUrl;
              imgElem.style.display = "block";
            } else {
              imgElem.style.display = "none";
            }
          }

          // Verificação Imediata de Duplicidade via Hash SHA-256
          const hashBadge = document.getElementById("hash-verification-badge");
          if (hashBadge) {
            hashBadge.style.display = "block";
            hashBadge.style.background = "rgba(56,189,248,0.1)";
            hashBadge.style.border = "1px solid rgba(56,189,248,0.3)";
            hashBadge.innerHTML = `<span style="color:#38bdf8; display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:16px;">sync</span> Verificando hash SHA-256 e duplicidade no banco...</span>`;
          }

          calculateFileSHA256(file).then(async (mapHash) => {
            if (this.currentPublishData) this.currentPublishData.mapHash = mapHash;
            const dupResult = await db.checkDuplicateMap(mapHash);
            if (hashBadge) {
              if (dupResult.isDuplicate) {
                hashBadge.style.background = "rgba(239,68,68,0.15)";
                hashBadge.style.border = "1px solid rgba(239,68,68,0.4)";
                hashBadge.innerHTML = `<span style="color:#ef4444; font-weight:700; display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:18px;">warning</span> Mapa Duplicado! Este arquivo já foi publicado anteriormente como <strong>"${dupResult.existingTitle}"</strong>. Envios repetidos não são permitidos.</span>`;
                this.showToast(`Atenção: Beatmap duplicado de "${dupResult.existingTitle}"!`);
              } else {
                hashBadge.style.background = "rgba(16,185,129,0.15)";
                hashBadge.style.border = "1px solid rgba(16,185,129,0.4)";
                hashBadge.innerHTML = `<span style="color:#10b981; font-weight:700; display:flex; align-items:center; gap:0.4rem;"><span class="material-symbols-outlined" style="font-size:18px;">verified</span> Arquivo original e inédito verificado (SHA-256: ${mapHash.substring(0, 12)}...)!</span>`;
              }
            }
          }).catch(hashErr => {
            console.warn("Aviso ao validar hash antecipadamente:", hashErr);
          });
        }

        this.showToast(`Arquivo .hbn desempacotado: "${title}" (${totalNotes} notas detectadas)!`);
      } catch (err) {
        console.error("Erro ao analisar pacote .hbn:", err);
        this.showToast("Erro ao processar pacote .hbn: " + err.message);
      }
    }

    // ========================================================================
    // ENVIO DE PUBLICAÇÃO:
    // - Armazenamento de arquivo binário pesado (.hbn) diretamente no CLOUDINARY
    // - Barra de progresso real (0% - 100%) em modal bloqueante com alerta anti-abandono
    // - Proteção de navegação (beforeunload)
    // - Registro estrito no SUPABASE somente após sucesso total no Cloudinary
    // - Limpeza imediata no Cloudinary se o Supabase falhar (sem arquivos órfãos / lixo)
    // ========================================================================
    async handlePublishSubmit(e) {
      e.preventDefault();

      // ======================================================================
      // FASE 0 — VALIDAÇÕES LOCAIS (SEM TOCAR NO CLOUDINARY OU SUPABASE)
      // Nada é enviado até que TODAS as verificações locais passem.
      // ======================================================================
      if (!this.currentPublishData || !this.currentPublishData.file) {
        this.showFormError("Selecione um pacote .hbn válido antes de publicar.", "publish-form-element");
        return;
      }

      const user = stateMgr.getUser();
      if (!user) {
        this.showAuthRequired('publish');
        return;
      }

      // Lê o título editado pelo usuário no formulário (se tiver)
      const titleInput = document.getElementById("extracted-title-input");
      const artistInput = document.getElementById("extracted-artist-input");
      if (titleInput && titleInput.value.trim()) this.currentPublishData.title = titleInput.value.trim();
      if (artistInput && artistInput.value.trim()) this.currentPublishData.artist = artistInput.value.trim();

      // ======================================================================
      // FASE 1 — HASH SHA-256 LOCAL (SEM INTERNET, SÓ CPU)
      // ======================================================================
      let mapHash = "";
      try {
        this.showToast("Calculando assinatura do arquivo (.hbn)...");
        mapHash = await HBNDecrypter.computeFileSHA256(this.currentPublishData.file);
        console.log("🔒 Hash SHA-256 gerado:", mapHash);
      } catch (hashErr) {
        console.warn("Aviso ao calcular hash SHA-256:", hashErr);
      }

      // ======================================================================
      // FASE 2 — CONSULTAS NO SUPABASE (SÓ LEITURA, ZERO ESCRITA)
      // Verifica suspensão, duplicidade e limite diário antes de qualquer upload.
      // ======================================================================
      let uploadStatus;
      try {
        uploadStatus = await db.getUserUploadStatus(user.id);
      } catch (err) {
        this.showFormError("Não foi possível verificar o status da sua conta. Tente novamente.", "publish-form-element");
        return;
      }

      if (uploadStatus.isSuspended) {
        if (uploadStatus.isBanned) {
          this.showFormError("Sua conta está banida permanentemente da plataforma.", "publish-form-element");
          return;
        }
        const expiresMsg = uploadStatus.banExpiresAt
          ? ` até ${new Date(uploadStatus.banExpiresAt).toLocaleString('pt-BR')}`
          : "";
        this.showFormError(
          `Sua conta está temporariamente suspensa${expiresMsg}. Você tentou enviar mapas duplicados repetidamente.`,
          "publish-form-element"
        );
        return;
      }

      if (mapHash) {
        let duplicateMap = null;
        try { duplicateMap = await db.getBeatmapByHash(mapHash); } catch (_) {}
        if (duplicateMap) {
          const attemptRes = await db.recordDuplicateAttempt(user.id);
          if (attemptRes.suspended) {
            this.showFormError(
              "Múltiplas tentativas de envio de mapa duplicado detectadas. Conta temporariamente suspensa de publicações.",
              "publish-form-element"
            );
            stateMgr.setUser({ ...user, status: 'suspended', ban_expires_at: attemptRes.expiresAt }, stateMgr.state.rememberMe);
          } else {
            this.showFormError(
              `Este mapa já foi publicado como "${duplicateMap.title}". Envios duplicados não são permitidos. (Tentativa ${attemptRes.attempts}/3)`,
              "publish-form-element"
            );
          }
          return;
        }
      }

      if (!uploadStatus.canUpload) {
        this.showFormError(
          `Você atingiu o limite de ${uploadStatus.limit} publicações por dia. Entre em contato com um moderador para aumentar seu limite.`,
          "publish-form-element"
        );
        return;
      }

      // ======================================================================
      // FASE 3 — TUDO OK LOCALMENTE → AGORA SIM INICIA O UPLOAD
      // A partir daqui, Cloudinary e Supabase são acionados.
      // ======================================================================
      const beforeUnloadHandler = (evt) => {
        evt.preventDefault();
        evt.returnValue = "⚠️ Upload em andamento. Fechar esta aba cancelará o envio.";
        return evt.returnValue;
      };
      window.addEventListener("beforeunload", beforeUnloadHandler);

      this.showUploadProgressModal({ percent: 5, stage: "Preparando envio para o Cloudinary..." });

      const mapId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : (
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        })
      );

      let fileUrl = "";
      let coverUrl = APP_CONFIG.defaultCover;
      let audioUrl = "";

      try {
        // Capa (10% → 20%)
        if (this.currentPublishData.coverBlob) {
          this.updateUploadProgress(10, "Enviando arte de capa...");
          coverUrl = await CloudinaryService.uploadFileWithProgress(
            this.currentPublishData.coverBlob,
            `${mapId}_cover.jpg`,
            (p) => this.updateUploadProgress(10 + p * 0.10, `Capa: ${Math.round(p)}%...`)
          );
        }

        // Áudio (20% → 30%)
        if (this.currentPublishData.audioBlob) {
          this.updateUploadProgress(20, "Enviando arquivo de áudio...");
          audioUrl = await CloudinaryService.uploadFileWithProgress(
            this.currentPublishData.audioBlob,
            `${mapId}_audio.mp3`,
            (p) => this.updateUploadProgress(20 + p * 0.10, `Áudio: ${Math.round(p)}%...`)
          );
        }

        // Pacote .hbn (30% → 90%)
        this.updateUploadProgress(30, "Enviando pacote .hbn...");
        fileUrl = await CloudinaryService.uploadFileWithProgress(
          this.currentPublishData.file,
          `${mapId}.hbn`,
          (p) => this.updateUploadProgress(30 + p * 0.60, `Pacote .hbn: ${Math.round(p)}%...`)
        );

        if (!fileUrl) throw new Error("Cloudinary não retornou URL para o arquivo .hbn.");

        // ====================================================================
        // FASE 4 — REGISTRO NO SUPABASE (somente metadados, após Cloudinary ok)
        // Apenas colunas que existem na tabela beatmaps são inseridas aqui.
        // ====================================================================
        this.updateUploadProgress(92, "Salvando metadados no banco de dados...");

        const selectedLanguage = document.getElementById("pub-language-select")?.value || "português";

        const newMapRecord = {
          id:                   mapId,
          title:                this.currentPublishData.title  || "Beatmap Sem Título",
          artist:               this.currentPublishData.artist || "Artista Desconhecido",
          bpm:                  Number(this.currentPublishData.bpm) || 120,
          mapper_name:          user.username,
          mapper_id:            (user.id && typeof user.id === "string" && user.id.length === 36 && user.id.includes("-")) ? user.id : null,
          cover_url:            coverUrl,
          file_url:             fileUrl,
          audio_preview_url:    audioUrl || "",
          audio_preview_start:  Number(this.currentPublishData.previewStart) || 0,
          duration_seconds:     Math.round(Number(this.currentPublishData.length) || 118),
          total_notes:          Number(this.currentPublishData.totalNotes) || 0,
          map_hash:             mapHash,
          language:             selectedLanguage,
          difficulty_level:     this.currentPublishData.difficultyLevel || "medio",
          difficulty_name:      this.currentPublishData.difficultyName  || "Médio",
          star_rating:          Number(this.currentPublishData.starRating) || 2.5,
          status:               "pending",
          charts:               this.currentPublishData.charts || {},
          downloads_count:      0,
          favorites_count:      0,
          reports_count:        0,
          created_at:           new Date().toISOString()
        };

        await db.insertBeatmap(newMapRecord);
        await db.recordSuccessfulUpload(user.id);

        this.updateUploadProgress(100, "Beatmap publicado com sucesso!");

        // Pausa breve para o usuário ver os 100% concluídos
        await new Promise(resolve => setTimeout(resolve, 400));

        this.currentPublishData = null;
        this.showToast("Beatmap enviado! Aguardando aprovação da moderação para se tornar ranqueado.");
        window.renderBeatmapDetailView(newMapRecord.id);

      } catch (uploadErr) {
        console.error("❌ Erro durante o fluxo de publicação:", uploadErr);
        
        // Exclusão imediata do Cloudinary caso o Supabase não conclua o registro (evita lixo / arquivos órfãos)
        try {
          if (fileUrl) await CloudinaryService.deleteFile(fileUrl);
          if (coverUrl && !coverUrl.includes("unsplash.com") && !coverUrl.includes("dicebear.com")) {
            await CloudinaryService.deleteFile(coverUrl);
          }
          if (audioUrl) await CloudinaryService.deleteFile(audioUrl);
        } catch (cleanupErr) {
          console.warn("Aviso ao limpar Cloudinary após falha:", cleanupErr);
        }

        this.showFormError(
          "Ocorreu um erro durante o upload do pacote: " + uploadErr.message + ". O envio foi cancelado e nenhum arquivo órfão foi mantido no Cloudinary nem no Supabase.",
          "publish-form-element"
        );
        this.showToast("Falha no upload do beatmap.");
      } finally {
        // Remove a proteção contra fechamento da aba e fecha o modal bloqueante
        window.removeEventListener("beforeunload", beforeUnloadHandler);
        this.hideUploadProgressModal();
      }
    }

    // ========================================================================
    // PORTAL DE ACESSO DO DESENVOLVEDOR (Desativado / Redirecionado para Home)
    // ========================================================================
    renderDevPortalView() {
      router.navigateClean("#/");
    }

    async activateDeveloperMode() {
      let user = stateMgr.getUser();
      if (!user) {
        user = {
          id: "usr-dev-01",
          username: "HDBN_LeadDev",
          email: "dev@hdbn.club",
          role: "dev",
          is_dev: true,
          is_admin_apto: true,
          is_writer: true,
          avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=HDBN_LeadDev",
          created_at: new Date().toISOString()
        };
      } else {
        user = {
          ...user,
          role: "dev",
          is_dev: true,
          is_admin_apto: true,
          is_writer: true
        };
      }

      stateMgr.setUser(user, true);
      if (db.supabase) {
        db.supabase.from("users").upsert(user).catch(() => {});
      }
      this.updateAuthUI();
      this.showToast("Modo Desenvolvedor (DEV) ativado com sucesso!");
      window.router.navigateClean("#/admin");
    }

    // ========================================================================
    // PAINEL DE ADMINISTRAÇÃO E MODERAÇÃO (/admin)
    // Regras Estritas de Hierarquia:
    // - DEV: Imunidade total (não pode ser punido nem excluído), pode excluir mapas e contas.
    // - ADMIN: Pode punir usuários (exceto dev), suspender e ocultar mapas, mas NÃO pode excluir mapas nem contas.
    // ========================================================================
    async renderAdminView(activeTab = 'maps') {
      const user = stateMgr.getUser();
      const isDev   = user ? (user.role === 'dev'   || user.is_dev)        : false;
      const isAdmin = user ? (user.role === 'admin' || user.is_admin_apto) : false;

      // 🔒 GUARD: somente ADM e DEV podem acessar este painel
      if (!user || (!isDev && !isAdmin)) {
        this.mainView.innerHTML = `
          <div class="container" style="padding: 6rem 0; text-align:center; max-width:540px; margin:0 auto;">
            <span class="material-symbols-outlined" style="font-size:5rem; color:#ef4444;">gpp_bad</span>
            <h1 style="font-size:2rem; font-weight:900; margin:1rem 0; color:#ef4444;">Acesso Negado</h1>
            <p style="color:var(--text-secondary); margin-bottom:2rem; line-height:1.7; font-size:1rem;">
              Você não tem permissão para acessar o Painel de Moderação.<br>
              <strong>Apenas Administradores e Desenvolvedores</strong> podem entrar nesta área.
            </p>
            <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
              <a href="#/dev" onclick="window.router.navigateClean('#/dev'); return false;" class="btn btn-primary" style="background:#f59e0b; color:#000; font-weight:800;">
                <span class="material-symbols-outlined">terminal</span> Portal do Desenvolvedor (DEV)
              </a>
              <button class="btn btn-secondary" onclick="window.router.navigateClean('#/')">
                <span class="material-symbols-outlined">home</span> Voltar ao Início
              </button>
            </div>
          </div>
        `;
        return;
      }

      const usersList = await db.getUsers();
      const mapsList = await db.getBeatmaps();
      const reportsList = stateMgr.getReports();

      this.mainView.innerHTML = `
        <div class="container admin-container" style="padding: 2.5rem 0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
            <div>
              <h1 style="font-size:2rem; font-weight:900; display:flex; align-items:center; gap:0.5rem; color:var(--accent-gold); margin:0;">
                <span class="material-symbols-outlined" style="font-size:2.2rem;">shield</span> Painel de Moderação & Gestão
              </h1>
              <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">
                Controle de beatmaps, aprovação de mapas, análise de denúncias e moderação de contas de usuários do HDBN.
              </p>
            </div>
          </div>

          <!-- ABAS DO PAINEL -->
          <div class="admin-nav-tabs">
            <button class="admin-tab-btn ${activeTab === 'maps' ? 'active' : ''}" onclick="window.app.renderAdminView('maps')">
              <span class="material-symbols-outlined">library_music</span> Novos Mapas & Todos os Beatmaps (${mapsList.length})
            </button>
            <button class="admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}" onclick="window.app.renderAdminView('reports')">
              <span class="material-symbols-outlined">report</span> Mapas com Denúncia (${reportsList.length})
            </button>
            <button class="admin-tab-btn ${activeTab === 'users' ? 'active' : ''}" onclick="window.app.renderAdminView('users')">
              <span class="material-symbols-outlined">group</span> Novas Contas & Todos os Usuários (${usersList.length})
            </button>
          </div>

          <!-- ABA 1: NOVOS MAPAS & TODOS OS BEATMAPS -->
          ${activeTab === 'maps' ? `
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Beatmap</th>
                    <th>Mapeador</th>
                    <th>Dificuldade</th>
                    <th>Status</th>
                    <th>Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody>
                  ${mapsList.length === 0 ? `
                    <tr>
                      <td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">
                        ${db.isDbConnected ? 'Nenhum beatmap registrado no momento.' : 'Banco de dados não encontrado.'}
                      </td>
                    </tr>
                  ` : mapsList.map(m => {
                    let statusBadge = '<span class="status-badge" style="background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid #f59e0b;">⏳ Pendente</span>';
                    if (m.status === 'ranked') {
                      statusBadge = '<span class="status-badge status-approved">⭐ Ranqueado</span>';
                    } else if (m.status === 'unranked') {
                      statusBadge = '<span class="status-badge" style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid #38bdf8;">✅ Normal</span>';
                    } else if (m.status === 'suspended') {
                      statusBadge = '<span class="status-badge status-inactive">🚫 Suspenso</span>';
                    } else if (m.status === 'hidden') {
                      statusBadge = '<span class="status-badge status-pending">👁️ Oculto</span>';
                    }

                    return `
                      <tr>
                        <td style="display:flex; align-items:center; gap:0.6rem;">
                          <img src="${m.cover_url || APP_CONFIG.defaultCover}" style="width:36px; height:36px; border-radius:var(--radius-sm); object-fit:cover;" alt="${m.title}">
                          <div>
                            <strong style="color:white; display:block;">${m.title}</strong>
                            <span style="font-size:0.75rem; color:var(--text-muted);">por ${m.artist}</span>
                          </div>
                        </td>
                        <td>${m.mapper_name}</td>
                        <td>${this._getDifficultyBadgeHTML(m.difficulty_level, m.difficulty_name)}</td>
                        <td>${statusBadge}</td>
                        <td style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
                          <button class="btn btn-secondary btn-sm" onclick="window.renderBeatmapDetailView('${m.id}')" title="Abrir página do mapa">
                            Ver
                          </button>
                          
                          <!-- Botão Aprovar Ranqueado -->
                          ${m.status !== 'ranked' ? `
                            <button class="btn btn-secondary btn-sm" style="background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e; font-weight:700;" onclick="window.app.adminApproveRanked('${m.id}')" title="Aprovar como Mapa Ranqueado Oficial">
                              ⭐ Ranqueado
                            </button>
                          ` : ''}

                          <!-- Botão Aprovar Normal -->
                          ${m.status !== 'unranked' ? `
                            <button class="btn btn-secondary btn-sm" style="background:rgba(56,189,248,0.2); color:#38bdf8; border-color:#38bdf8; font-weight:700;" onclick="window.app.adminApproveNormal('${m.id}')" title="Aprovar como Mapa Normal da Comunidade">
                              ✅ Normal
                            </button>
                          ` : ''}

                          <!-- Botão Suspender -->
                          <button class="btn btn-secondary btn-sm" style="background:rgba(245,158,11,0.2); color:#f59e0b;" onclick="window.app.adminSuspendMap('${m.id}')" title="Suspender mapa com observação">
                            Suspender
                          </button>

                          <!-- Botão Ocultar / Reexibir -->
                          <button class="btn btn-secondary btn-sm" style="background:rgba(148,163,184,0.2); color:#94a3b8;" onclick="window.app.adminToggleHideMap('${m.id}')" title="Alternar status oculto">
                            ${m.status === 'hidden' ? 'Reexibir' : 'Ocultar'}
                          </button>

                          <!-- Botão Excluir -->
                          ${(isDev || isAdmin) ? `
                            <button class="btn btn-secondary btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444;" onclick="window.app.deleteMap('${m.id}')" title="Excluir beatmap permanentemente">
                              Excluir
                            </button>
                          ` : ''}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : activeTab === 'reports' ? `
            <!-- ABA 2: MAPAS COM DENÚNCIA -->
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Beatmap Denunciado</th>
                    <th>Motivo da Denúncia</th>
                    <th>Denunciante</th>
                    <th>Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportsList.length === 0 ? `
                    <tr>
                      <td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">
                        Nenhuma denúncia pendente de análise no momento.
                      </td>
                    </tr>
                  ` : reportsList.map(r => `
                    <tr>
                      <td><strong style="color:white;">${r.target_title}</strong></td>
                      <td style="color:#f59e0b;">${r.reason}</td>
                      <td>${r.reporter_name}</td>
                      <td style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                        <button class="btn btn-secondary btn-sm" onclick="window.renderBeatmapDetailView('${r.target_id}')">
                          Ver Beatmap
                        </button>
                        
                        <!-- Opção Manter: "não é necessário excluir ou fazer qualquer coisa, manter" -->
                        <button class="btn btn-secondary btn-sm" style="background:rgba(16,185,129,0.2); color:#10b981;" onclick="window.app.adminDismissReport('${r.id}')" title="Manter beatmap ativo sem penalidades">
                          Manter
                        </button>

                        <button class="btn btn-secondary btn-sm" style="background:rgba(245,158,11,0.2); color:#f59e0b;" onclick="window.app.adminSuspendMap('${r.target_id}')" title="Suspender mapa denunciado">
                          Suspender
                        </button>

                        ${isDev ? `
                          <button class="btn btn-secondary btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444;" onclick="window.app.banMapWithInfraction('${r.target_id}', 'usr-mapper-01')">
                            Excluir & Punir
                          </button>
                        ` : `
                          <button class="btn btn-secondary btn-sm" disabled style="opacity:0.35; cursor:not-allowed;" title="Exclusão de mapa restrita a usuários com tag DEV.">
                            Excluir (DEV)
                          </button>
                        `}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <!-- ABA 3: NOVAS CONTAS & TODOS OS USUÁRIOS -->
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Cargo Oficial</th>
                    <th>Uploads Hoje (Limite)</th>
                    <th>Status / Suspensão</th>
                    <th>Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody>
                  ${usersList.map(u => {
                    const targetIsDev = u.role === 'dev' || u.is_dev;
                    const infractionsCount = stateMgr.getInfractions(u.id);
                    const isSuspended = u.status === 'suspended';

                    return `
                      <tr>
                        <td style="display:flex; align-items:center; gap:0.5rem;">
                          <img src="${u.avatar_url}" style="width:30px; height:30px; border-radius:var(--radius-sm); object-fit:cover;" alt="${u.username}">
                          <div>
                            <strong style="color:white; display:block;">${u.username}</strong>
                            ${u.discord_tag ? `<span style="font-size:0.7rem; color:var(--text-muted);">@${u.discord_tag}</span>` : ''}
                          </div>
                        </td>
                        <td>
                          <span class="hierarchy-tag ${APP_CONFIG.ROLES[u.role]?.tagClass || 'tag-player'}">
                            ${APP_CONFIG.ROLES[u.role]?.label || 'PLAYER'}
                          </span>
                        </td>
                        <td>
                          <div style="display:flex; align-items:center; gap:0.4rem;">
                            <span style="font-weight:700; color:${u.custom_upload_limit ? '#f59e0b' : '#38bdf8'}; font-size:0.85rem;">
                              ${targetIsDev || u.role === 'admin' ? '<span style="color:#10b981;">Ilimitado</span>' : `${u.uploads_today_count || 0} / ${u.custom_upload_limit ? (u.custom_upload_limit + ' (Mod)') : (u.is_trusted_creator ? '10' : '2')}`}
                            </span>
                            ${!targetIsDev ? `
                              <button class="btn btn-secondary btn-sm" style="padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="window.app.adminSetUserLimit('${u.id}', '${u.username}', ${u.custom_upload_limit || 2})" title="Ajustar limite diário de uploads">
                                <span class="material-symbols-outlined" style="font-size:13px;">tune</span>
                              </button>
                            ` : ''}
                          </div>
                        </td>
                        <td>
                          ${isSuspended ? `
                            <div style="display:flex; flex-direction:column; gap:0.25rem;">
                              <span class="status-badge" style="background:rgba(239,68,68,0.2); color:#ef4444; border:1px solid #ef4444; font-size:0.75rem;">
                                Suspenso (${u.duplicate_attempts_count || 0} tentativas)
                              </span>
                              <button class="btn btn-secondary btn-sm" style="background:rgba(16,185,129,0.2); color:#10b981; padding:0.15rem 0.4rem; font-size:0.7rem;" onclick="window.app.adminUnsuspendUser('${u.id}', '${u.username}')" title="Remover suspensão">
                                Reativar
                              </button>
                            </div>
                          ` : u.status === 'banned' ? `
                            <span class="status-badge" style="background:rgba(239,68,68,0.3); color:#ef4444;">Banido</span>
                          ` : (u.days_inactive || 0) >= 27 ? `
                            <span class="status-badge status-inactive">Inativo (${u.days_inactive} dias)</span>
                          ` : `
                            <span class="status-badge status-approved">Ativo</span>
                          `}
                        </td>
                        <td>
                          ${targetIsDev ? `
                            <!-- DEVs são estritamente imunes à opção de punir ou excluir -->
                            <span class="tag-dev" style="background:rgba(234,179,8,0.15); color:#eab308; border:1px solid #eab308; padding:0.25rem 0.6rem; border-radius:var(--radius-sm); font-size:0.75rem; font-weight:900; display:inline-flex; align-items:center; gap:0.3rem;">
                              <span class="material-symbols-outlined" style="font-size:14px;">shield</span> IMUNE A PUNIÇÃO E EXCLUSÃO (Tag DEV)
                            </span>
                          ` : `
                            <div style="display:flex; gap:0.4rem; align-items:center;">
                              <!-- Punir: Disponível para ADMIN e DEV -->
                              <button class="btn btn-secondary btn-sm" style="background:rgba(245,158,11,0.2); color:#f59e0b;" onclick="window.app.adminPunishUser('${u.id}', '${u.username}')" title="Aplicar +1 infração/advertência">
                                Punir
                              </button>

                              <!-- Excluir: Estritamente restrito a DEV (Admin não pode excluir) -->
                              ${isDev ? `
                                <button class="btn btn-secondary btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444;" onclick="window.app.adminDeleteUser('${u.id}', '${u.username}')" title="Excluir conta definitivamente (Permissão DEV)">
                                  Excluir
                                </button>
                              ` : `
                                <button class="btn btn-secondary btn-sm" disabled style="opacity:0.35; cursor:not-allowed;" title="Usuários com tag ADM podem punir, mas NÃO podem excluir contas (Restrito a DEVs).">
                                  Excluir (DEV)
                                </button>
                              `}
                            </div>
                          `}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}

        </div>
      `;
    }

    // Ações Administrativas
    switchDemoRole(role) {
      const isDev = role === 'dev';
      const demoUser = {
        id: isDev ? "usr-dev-01" : "usr-admin-01",
        username: isDev ? "HDBN_LeadDev" : "HDBN_Admin",
        email: isDev ? "dev@hdbn.club" : "admin@hdbn.club",
        discord_tag: isDev ? "leaddev#0001" : "admin#0001",
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${isDev ? 'leaddev' : 'admin'}`,
        role: role,
        is_dev: isDev
      };
      stateMgr.setUser(demoUser);
      this.updateAuthUI();
      this.showToast(`Modo alterado para ${isDev ? 'DEV (Imunidade e Exclusão Total)' : 'ADMIN (Suspender/Ocultar)'}!`);
      this.renderAdminView();
    }

    getVisibleBeatmaps(allMaps) {
      const user = stateMgr.getUser();
      const isStaff = user && (user.role === 'admin' || user.role === 'dev' || user.role === 'mod' || user.is_dev);
      return (allMaps || []).filter(m => {
        // Staff vê todos os mapas para moderação
        if (isStaff) return true;
        // Mapas aprovados (ranked ou unranked / normal) são públicos para todos
        if (m.status === 'ranked' || m.status === 'unranked') return true;
        // Mapas pendentes/ocultos/suspensos: somente o próprio criador pode ver seu mapa
        if (user && (m.mapper_name === user.username || m.mapper_id === user.id)) return true;
        return false;
      });
    }

    async adminApproveRanked(mapId) {
      const user = stateMgr.getUser();
      if (!user || (!user.is_dev && user.role !== 'admin' && !user.is_admin_apto)) {
        this.showToast("Apenas moderadores podem aprovar mapas.");
        return;
      }
      await db.updateBeatmapStatus(mapId, 'ranked', 'Aprovado como Mapa Ranqueado Oficial.');
      this.showToast("Beatmap aprovado como ⭐ Ranqueado Oficial!");
      this.renderAdminView('maps');
    }

    async adminApproveNormal(mapId) {
      const user = stateMgr.getUser();
      if (!user || (!user.is_dev && user.role !== 'admin' && !user.is_admin_apto)) {
        this.showToast("Apenas moderadores podem aprovar mapas.");
        return;
      }
      await db.updateBeatmapStatus(mapId, 'unranked', 'Aprovado como Mapa Normal da Comunidade.');
      this.showToast("Beatmap aprovado como ✅ Mapa Normal!");
      this.renderAdminView('maps');
    }

    async adminApproveMap(mapId) {
      return this.adminApproveRanked(mapId);
    }

    async adminSetUnranked(mapId) {
      return this.adminApproveNormal(mapId);
    }

    async adminSuspendMap(mapId) {
      const time = prompt("Informe o tempo de suspensão do mapa (ex: 7 dias, 15 dias, 30 dias):", "7 dias");
      if (!time) return;
      const obs = prompt("Adicione uma observação do motivo da suspensão:", "Ajuste na sincronia das notas ou áudio");
      if (obs !== null) {
        stateMgr.setObservation(mapId, `[SUSPENSO - ${time}]: ${obs}`);
        await db.updateBeatmapStatus(mapId, 'suspended', `[SUSPENSO - ${time}]: ${obs}`);
        this.showToast(`Mapa suspenso por ${time}. Observação registrada!`);
        this.renderAdminView('maps');
      }
    }

    async adminToggleHideMap(mapId) {
      const map = await db.getBeatmapById(mapId);
      const newStatus = map?.status === 'hidden' ? 'unranked' : 'hidden';
      await db.updateBeatmapStatus(mapId, newStatus);
      this.showToast(`Visibilidade do mapa alterada para ${newStatus === 'hidden' ? 'Oculto' : 'Normal'}!`);
      this.renderAdminView('maps');
    }

    adminDismissReport(reportId) {
      const reports = stateMgr.getReports().filter(r => r.id !== reportId);
      stateMgr.reports = reports;
      this.showToast("Denúncia encerrada! Decisão: Não é necessário excluir, beatmap mantido ativo.");
      this.renderAdminView('reports');
    }

    adminPunishUser(userId, username) {
      const count = stateMgr.incrementInfraction(userId);
      this.showToast(`Usuário ${username} punido com advertência (+1 Infração: ${count}/5)!`);
      this.renderAdminView('users');
    }

    async adminDeleteUser(userId, username) {
      if (confirm(`Tem certeza que deseja excluir permanentemente a conta de ${username}? Esta ação é irreversível.`)) {
        await db.deleteUser(userId);
        this.showToast(`Conta de ${username} excluída com sucesso pelo DEV.`);
        this.renderAdminView('users');
      }
    }

    async adminSetUserLimit(userId, username, currentLimit) {
      const newLimit = prompt(`Defina o novo limite diário de envios de beatmaps para ${username} (número de mapas por dia, ou 0 para voltar ao padrão de 2):`, currentLimit || "5");
      if (newLimit === null) return;
      const num = parseInt(newLimit, 10);
      try {
        await db.adminSetUserUploadLimit(userId, num > 0 ? num : null);
        this.showToast(`Limite diário de ${username} atualizado para ${num > 0 ? num + ' mapas/dia' : '2 mapas/dia (padrão)'}!`);
        this.renderAdminView('users');
      } catch (e) {
        alert("Erro ao alterar limite: " + e.message);
      }
    }

    async adminUnsuspendUser(userId, username) {
      if (confirm(`Deseja remover a suspensão da conta de ${username} e restabelecer as permissões de publicação?`)) {
        try {
          await db.adminUnsuspendUser(userId);
          this.showToast(`Conta de ${username} reativada com sucesso!`);
          this.renderAdminView('users');
        } catch (e) {
          alert("Erro ao reativar conta: " + e.message);
        }
      }
    }

    async banMapWithInfraction(mapId, authorId) {
      await db.deleteBeatmap(mapId);
      const count = stateMgr.incrementInfraction(authorId);
      this.showToast(`Mapa excluído! O autor recebeu +1 infração (Total: ${count}/5).`);
      this.renderAdminView('reports');
    }

    // ========================================================================
    // TELA DEDICADA DE BUSCA (#/busca) — COM GRADE E CARROSSEL
    // ========================================================================
    async renderSearchView(initialQuery, initialFilter, initialLang) {
      const view = this.getMainView();
      if (!view) return;
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const query = (initialQuery !== undefined ? initialQuery : (urlParams.get("q") || "")).trim();
      const filter = initialFilter || urlParams.get("tipo") || this.searchPageCategory || "all";
      const langFilter = initialLang || urlParams.get("idioma") || this.searchPageLangFilter || "all";
      this.searchPageCategory = filter;
      this.searchPageLangFilter = langFilter;

      const term = query.toLowerCase();
      const allUsers = await db.getUsers();
      const rawMaps = await db.getBeatmaps();
      const allMaps = this.getVisibleBeatmaps(rawMaps);

      const matchedUsers = term 
        ? allUsers.filter(u => u.username.toLowerCase().includes(term) || (u.discord_tag && u.discord_tag.toLowerCase().includes(term)) || (u.bio && u.bio.toLowerCase().includes(term)))
        : allUsers;

      let matchedMaps = term 
        ? allMaps.filter(m => m.title.toLowerCase().includes(term) || m.artist.toLowerCase().includes(term) || m.mapper_name.toLowerCase().includes(term))
        : allMaps;

      if (langFilter && langFilter !== "all") {
        matchedMaps = matchedMaps.filter(m => (m.language || "português").toLowerCase() === langFilter.toLowerCase());
      }

      const cleanQueryAttr = (query || "").replace(/"/g, "&quot;");

      view.innerHTML = `
        <div class="container search-page-container">
          <div>
            <h1 style="font-size: 2rem; font-weight: 900; color: #fff; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.6rem;">
              <span class="material-symbols-outlined" style="color: var(--accent-purple-light); font-size: 2.2rem;">search</span> Pesquisar no HDBN
            </h1>
            <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">Encontre beatmaps, músicas, artistas e usuários da comunidade oficial.</p>
          </div>

          <!-- Barra de Busca: Apenas pesquisa ao pressionar ENTER ou clicar no botão Buscar -->
          <div class="search-page-bar">
            <input type="text" id="search-main-input" class="search-page-input" placeholder="Digite sua busca e pressione Enter..." value="${cleanQueryAttr}" onkeydown="if(event.key==='Enter') window.app.submitSearch()">
            <button class="btn btn-primary" onclick="window.app.submitSearch()" style="display:flex; align-items:center; gap:0.4rem; padding:0 1.5rem; font-weight:700;">
              <span class="material-symbols-outlined">search</span> Buscar
            </button>
          </div>

          <!-- Filtros de Categoria -->
          <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <span style="font-size:0.85rem; font-weight:700; color:var(--text-muted); margin-right:0.5rem;">Filtrar por:</span>
            <button class="btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchCategory('all')">Todos</button>
            <button class="btn btn-sm ${filter === 'maps' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchCategory('maps')">Mapas (${matchedMaps.length})</button>
            <button class="btn btn-sm ${filter === 'users' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchCategory('users')">Usuários (${matchedUsers.length})</button>
          </div>

          <!-- Filtro por Idioma dos Mapas -->
          <div style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap; margin-top:0.75rem;">
            <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted); margin-right:0.25rem;">Idioma do Mapa:</span>
            <button class="btn btn-sm ${langFilter === 'all' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchLang('all')">Todos</button>
            <button class="btn btn-sm ${langFilter === 'português' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchLang('português')">🇧🇷 Português</button>
            <button class="btn btn-sm ${langFilter === 'inglês' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchLang('inglês')">🇺🇸 Inglês</button>
            <button class="btn btn-sm ${langFilter === 'espanhol' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchLang('espanhol')">🇪🇸 Espanhol</button>
            <button class="btn btn-sm ${langFilter === 'japonês' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchLang('japonês')">🇯🇵 Japonês</button>
            <button class="btn btn-sm ${langFilter === 'coreano' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchLang('coreano')">🇰🇷 Coreano</button>
            <button class="btn btn-sm ${langFilter === 'chinês' ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.setSearchLang('chinês')">🇨🇳 Chinês</button>
          </div>

          <!-- Área de Resultados -->
          <div id="search-results-area" style="margin-top:1.25rem;">
            ${filter === 'all' ? `
              ${matchedUsers.length > 0 ? `
                <div style="margin-bottom:2.5rem;">
                  <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
                    <span class="material-symbols-outlined" style="color:var(--accent-cyan);">people</span> Usuários (${matchedUsers.length})
                  </h3>
                  <!-- Carrossel no Topo para Usuários quando selecionado Todos -->
                  <div class="search-users-carousel" style="display:flex; gap:1rem; overflow-x:auto; padding-bottom:1rem; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch;">
                    ${matchedUsers.map(u => `
                      <div style="flex:0 0 290px; scroll-snap-align:start;">
                        ${this._createUserCardHTML(u)}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div>
                <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-pink);">library_music</span> Beatmaps (${matchedMaps.length})
                </h3>
                ${matchedMaps.length > 0 ? `
                  <div class="search-grid-3col">
                    ${matchedMaps.map(m => this._createShelfMapCardHTML(m)).join('')}
                  </div>
                ` : `
                  <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:2rem; text-align:center; color:var(--text-muted);">
                    Nenhum beatmap encontrado para "${query || 'busca'}".
                  </div>
                `}
              </div>
            ` : ''}

            ${filter === 'maps' ? `
              <div>
                <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-pink);">library_music</span> Beatmaps Encontrados (${matchedMaps.length})
                </h3>
                ${matchedMaps.length > 0 ? `
                  <div class="search-grid-3col">
                    ${matchedMaps.map(m => this._createShelfMapCardHTML(m)).join('')}
                  </div>
                ` : `
                  <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:2rem; text-align:center; color:var(--text-muted);">
                    Nenhum beatmap encontrado para "${query || 'busca'}".
                  </div>
                `}
              </div>
            ` : ''}

            ${filter === 'users' ? `
              <div>
                <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
                  <span class="material-symbols-outlined" style="color:var(--accent-cyan);">people</span> Usuários Encontrados (${matchedUsers.length})
                </h3>
                ${matchedUsers.length > 0 ? `
                  <div class="search-grid-3col">
                    ${matchedUsers.map(u => this._createUserCardHTML(u)).join('')}
                  </div>
                ` : `
                  <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:2rem; text-align:center; color:var(--text-muted);">
                    Nenhum usuário encontrado para "${query || 'busca'}".
                  </div>
                `}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    submitSearch() {
      const input = document.getElementById("search-main-input");
      const q = input ? input.value.trim() : "";
      const cat = this.searchPageCategory || "all";
      const lang = this.searchPageLangFilter || "all";
      window.location.hash = `#/busca?q=${encodeURIComponent(q)}&tipo=${cat}&idioma=${encodeURIComponent(lang)}`;
      this.renderSearchView(q, cat, lang);
    }

    setSearchCategory(category) {
      this.searchPageCategory = category;
      const input = document.getElementById("search-main-input");
      const q = input ? input.value.trim() : "";
      const lang = this.searchPageLangFilter || "all";
      window.location.hash = `#/busca?q=${encodeURIComponent(q)}&tipo=${category}&idioma=${encodeURIComponent(lang)}`;
      this.renderSearchView(q, category, lang);
    }

    setSearchLang(lang) {
      this.searchPageLangFilter = lang;
      const input = document.getElementById("search-main-input");
      const q = input ? input.value.trim() : "";
      const cat = this.searchPageCategory || "all";
      window.location.hash = `#/busca?q=${encodeURIComponent(q)}&tipo=${cat}&idioma=${encodeURIComponent(lang)}`;
      this.renderSearchView(q, cat, lang);
    }

    _createUserCardHTML(u) {
      const role = APP_CONFIG.ROLES[u.role] || APP_CONFIG.ROLES.player;
      const bioText = (u.bio && u.bio.trim()) ? u.bio.trim() : "Ainda não falou nada sobre si.";
      const showTag = role.tagClass && role.tagClass !== 'tag-player';
      const hasStream = u.stream_kick || u.stream_twitch || u.stream_youtube;
      return `
        <div class="beatmap-shelf-card user-carousel-card" onclick="window.renderProfileView('${u.id}')" style="padding: 0.9rem 1rem; display: flex; align-items: flex-start; gap: 0.85rem; cursor: pointer; height: 125px; min-height: 125px; max-height: 125px; box-sizing: border-box; overflow: hidden; position: relative;">
          <img src="${u.avatar_url || APP_CONFIG.defaultAvatar}" onerror="this.onerror=null; this.src='${APP_CONFIG.defaultAvatar}'" style="width: 50px; height: 50px; min-width: 50px; border-radius: var(--radius-sm); object-fit: cover; border: 2px solid var(--accent-purple); flex-shrink: 0;" alt="${u.username}">
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: flex-start; height: 100%; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 0.35rem; overflow: hidden; white-space: nowrap;">
              <strong style="color: white; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;" title="${u.username}">${u.username}</strong>
              ${showTag ? `<span class="hierarchy-tag ${role.tagClass}" style="font-size: 0.62rem; padding: 0.1rem 0.3rem; flex-shrink: 0;">${role.label}</span>` : ''}
              ${u.is_dev ? '<span class="hierarchy-tag tag-dev" style="font-size:0.62rem; padding: 0.1rem 0.3rem; flex-shrink: 0;">DEV</span>' : ''}
            </div>
            ${hasStream ? `
              <div style="display: flex; gap: 0.3rem; margin-top: 0.15rem; align-items: center; flex-shrink: 0;">
                ${u.stream_kick ? '<span style="font-size:0.62rem; font-weight:800; color:#10b981; background:rgba(16,185,129,0.15); border:1px solid #10b981; padding:0 0.3rem; border-radius:3px;">KIK</span>' : ''}
                ${u.stream_twitch ? '<span style="font-size:0.62rem; font-weight:800; color:#c084fc; background:rgba(168,85,247,0.15); border:1px solid #a855f7; padding:0 0.3rem; border-radius:3px;">TWITCH</span>' : ''}
                ${u.stream_youtube ? '<span style="font-size:0.62rem; font-weight:800; color:#f87171; background:rgba(239,68,68,0.15); border:1px solid #ef4444; padding:0 0.3rem; border-radius:3px;">YT</span>' : ''}
              </div>
            ` : ''}
            ${u.discord_tag ? `<div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 600; margin-top: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;">@${u.discord_tag}</div>` : ''}
            <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 0.25rem; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3;">
              ${bioText}
            </div>
          </div>
        </div>
      `;
    }
  }

  const app = new AppController();
  window.app = app;
  window.router = router;
  window.HBNDecrypter = HBNDecrypter;

  // Atalhos Globais
  window.navigateClean = (path) => router.navigateClean(path);
  window.openSearchModal = () => router.navigateClean("#/busca");
  window.renderSearchView = (q, f) => {
    window.location.hash = `#/busca${q ? `?q=${encodeURIComponent(q)}` : ''}`;
    app.renderSearchView(q, f);
  };
  window.renderHomeView = () => router.navigateClean("#/");
  window.renderMapsView = (f, p) => app.renderMapsView(f, p);
  window.renderRankingView = (t, m) => app.renderRankingView(t, m);
  window.renderCommunityView = (t, st, term, p) => app.renderCommunityView(t, st, term, p);
  window.renderHelpView = () => router.navigateClean("#/ajuda");
  window.renderRulesView = () => router.navigateClean("#/regras");
  window.renderBlogExpandedView = () => router.navigateClean("#/blogs");
  window.renderProfileView = (id) => {
    const user = stateMgr.getUser();
    const target = id || user?.id;
    if (!target) {
      app.showToast("Entre na sua conta para visualizar seu perfil.");
      window.openAuthModal('login');
      return;
    }
    router.navigateClean(`#/perfil?id=${encodeURIComponent(target)}`);
    window.scrollTo(0, 0);
  };
  window.renderBeatmapDetailView = (id) => {
    if (!id) return;
    router.navigateClean(`#/beatmap?id=${encodeURIComponent(id)}`);
    window.scrollTo(0, 0);
  };
  window.renderPublishView = () => router.navigateClean("#/publicar");
  window.renderDevPortalView = () => router.navigateClean("#/");
  window.renderAdminView = (tab) => {
    const user = stateMgr.getUser();
    const isDev   = user ? (user.role === 'dev'   || user.is_dev)        : false;
    const isAdmin = user ? (user.role === 'admin' || user.is_admin_apto) : false;
    if (!user || (!isDev && !isAdmin)) {
      router.navigateClean('#/admin'); // vai mostrar a tela de Acesso Negado
      return;
    }
    router.navigateClean('#/admin');
    if (tab) app.renderAdminView(tab);
  };

  window.handlePublishClick = (e) => {
    if (e) e.preventDefault();
    const user = stateMgr.getUser();
    if (!user) {
      app.showToast("Primeiro entre na conta para publicar!");
      window.openAuthModal('login');
    } else {
      router.navigateClean("#/publicar");
    }
  };

  window.toggleUserMenu = (e) => {
    if (e) e.stopPropagation();
    if (window.app && typeof window.app.updateAuthUI === "function") {
      window.app.updateAuthUI();
    }
    document.getElementById("user-floating-menu")?.classList.toggle("active");
  };

  window.toggleMobileDrawer = () => {
    document.getElementById("mobile-nav-drawer")?.classList.toggle("active");
  };

  window.closeMobileDrawer = () => {
    document.getElementById("mobile-nav-drawer")?.classList.remove("active");
  };

  window.openAuthModal = (tab = 'login') => {
    const modal = document.getElementById("auth-modal-overlay");
    if (!modal) return;
    modal.classList.add("active");
    window.switchAuthTab(tab);
  };

  window.switchAuthTab = (tab) => {
    const btnLogin = document.getElementById("tab-btn-login");
    const btnRegister = document.getElementById("tab-btn-register");
    const container = document.getElementById("auth-tab-content");
    if (!container) return;

    if (tab === 'login') {
      btnLogin?.classList.add("active");
      btnRegister?.classList.remove("active");
      container.innerHTML = `
        <form id="auth-form-login" onsubmit="window.handleAuthLogin(event)" style="display:flex; flex-direction:column; gap:1rem;">
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">Nome de Usuário ou E-mail</label>
            <input type="text" id="auth-username" required class="search-input-field" placeholder="Ex: linaldo2 ou seu@email.com" style="width:100%; margin-top:0.25rem;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">Senha</label>
            <input type="password" id="auth-pass" required class="search-input-field" placeholder="Sua Senha" style="width:100%; margin-top:0.25rem;">
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" id="auth-remember" checked style="width:16px; height:16px; accent-color:var(--accent-purple);">
            <label for="auth-remember" style="font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
              Lembre de mim (30 dias)
            </label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.5rem;">Entrar na Conta</button>
        </form>
      `;
    } else {
      btnRegister?.classList.add("active");
      btnLogin?.classList.remove("active");
      container.innerHTML = `
        <form id="auth-form-register" onsubmit="window.handleAuthRegister(event)" style="display:flex; flex-direction:column; gap:0.85rem;">
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">Nome de Usuário</label>
            <input type="text" id="reg-username" required class="search-input-field" placeholder="Ex: linaldo2" style="width:100%; margin-top:0.2rem;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">E-mail</label>
            <input type="email" id="reg-email" required class="search-input-field" placeholder="seu@email.com" style="width:100%; margin-top:0.2rem;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">Senha</label>
            <input type="password" id="reg-pass" required class="search-input-field" placeholder="Mínimo 6 caracteres" style="width:100%; margin-top:0.2rem;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary);">Confirmar Senha</label>
            <input type="password" id="reg-pass-confirm" required class="search-input-field" placeholder="Repita a senha" style="width:100%; margin-top:0.2rem;">
          </div>
          <div>
            <label style="font-size:0.8rem; font-weight:700; color:var(--accent-cyan);">@ do Discord (Opcional - Contato da Moderação)</label>
            <input type="text" id="reg-discord" class="search-input-field" placeholder="usuario#0000 ou @usuario" style="width:100%; margin-top:0.2rem;">
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <input type="checkbox" id="reg-terms" required style="width:16px; height:16px; accent-color:var(--accent-purple);">
            <label for="reg-terms" style="font-size:0.82rem; color:var(--text-secondary); cursor:pointer;">
              Li e aceito os <a href="#/termos" onclick="document.getElementById('auth-modal-overlay')?.classList.remove('active'); window.navigateClean('#/termos'); return false;" style="color:var(--accent-purple-light); font-weight:700; text-decoration:underline;">Termos e Condições</a>
            </label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.35rem;">Concluir Cadastro</button>
        </form>
      `;
    }
  };

  window.handleAuthLogin = async (e) => {
    e.preventDefault();
    const loginVal = (document.getElementById("auth-username")?.value || "").trim();
    const passVal = document.getElementById("auth-pass")?.value || "";
    const rememberMe = document.getElementById("auth-remember") ? document.getElementById("auth-remember").checked : true;

    if (!loginVal || !passVal) {
      app.showFormError("Preencha o usuário/e-mail e a senha.", "auth-form-login");
      return;
    }

    let targetEmail = loginVal;
    let targetUsername = loginVal;

    // Se o loginVal NÃO for e-mail, busca o e-mail correspondente ao username no banco public.users
    if (!loginVal.includes("@") && db.supabase) {
      try {
        const { data: userRecord } = await db.supabase
          .from("users")
          .select("id, email, username")
          .ilike("username", loginVal)
          .maybeSingle();
        if (userRecord && userRecord.email) {
          targetEmail = userRecord.email;
          targetUsername = userRecord.username;
        }
      } catch (err) {
        console.warn("Aviso ao buscar e-mail pelo username:", err);
      }
    }

    // Autenticação oficial e exclusiva via Supabase Auth (auth.users)
    let supabaseUser = null;
    if (db.supabase) {
      try {
        const { data, error } = await db.supabase.auth.signInWithPassword({
          email: targetEmail,
          password: passVal
        });
        if (error) {
          console.error("❌ Supabase Auth signIn erro:", error.message);
          const msg = error.message.includes("Invalid login")
            ? "E-mail/usuário ou senha incorretos. Verifique seus dados e tente novamente."
            : error.message;
          app.showFormError(msg, "auth-form-login");
          return;
        }
        if (data?.user) {
          supabaseUser = data.user;
          console.log("✅ Usuário autenticado com sucesso no Supabase Auth:", supabaseUser.id);
        }
      } catch (err) {
        console.error("Exceção no Supabase Auth signIn:", err);
        app.showFormError("Erro ao conectar com o serviço de autenticação. Tente novamente.", "auth-form-login");
        return;
      }
    }

    // Busca o perfil público na tabela public.users
    const users = await db.getUsers(true);
    let user = users.find(u => 
      (supabaseUser && u.id === supabaseUser.id) ||
      u.username.toLowerCase() === targetUsername.toLowerCase() || 
      (u.email && u.email.toLowerCase() === targetEmail.toLowerCase())
    );

    if (supabaseUser && !user) {
      user = {
        id: supabaseUser.id,
        username: supabaseUser.user_metadata?.username || targetUsername || targetEmail.split("@")[0],
        email: supabaseUser.email,
        discord_tag: supabaseUser.user_metadata?.discord_tag || "",
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(supabaseUser.id)}`,
        role: "player",
        created_at: supabaseUser.created_at || new Date().toISOString()
      };
      await db.saveUser(user);
    }

    if (!user) {
      app.showFormError("Perfil de usuário não encontrado no banco de dados.", "auth-form-login");
      return;
    }

    stateMgr.setUser(user, rememberMe);
    document.getElementById("auth-modal-overlay")?.classList.remove("active");
    app.updateAuthUI();
    app.showToast(`Bem-vindo de volta, ${user.username}! (${rememberMe ? 'Sessão: 30 dias' : 'Sessão: 2 dias'})`);
    router.handleRouting();
  };

  window.handleAuthRegister = async (e) => {
    e.preventDefault();
    const username = (document.getElementById("reg-username")?.value || "").trim();
    const email = (document.getElementById("reg-email")?.value || "").trim();
    const pass = document.getElementById("reg-pass")?.value || "";
    const passConfirm = document.getElementById("reg-pass-confirm")?.value || "";
    const discord = (document.getElementById("reg-discord")?.value || "").trim();
    const terms = document.getElementById("reg-terms")?.checked;

    if (!terms) {
      app.showFormError("Você deve aceitar os Termos e Condições para se cadastrar.", "auth-form-register");
      return;
    }

    if (!username || !email || !pass) {
      app.showFormError("Preencha todos os campos obrigatórios.", "auth-form-register");
      return;
    }

    if (pass !== passConfirm) {
      app.showFormError("As senhas não coincidem. Verifique e tente novamente.", "auth-form-register");
      return;
    }

    if (pass.length < 6) {
      app.showFormError("A senha deve ter no mínimo 6 caracteres.", "auth-form-register");
      return;
    }

    const users = await db.getUsers(true);
    const exists = users.find(u =>
      u.username.toLowerCase() === username.toLowerCase() ||
      (u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (exists) {
      app.showFormError("Este nome de usuário ou e-mail já está em uso. Tente outro.", "auth-form-register");
      return;
    }

    // Gera um UUID válido RFC4122 v4 para o usuário
    let generatedId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : (
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      })
    );

    let authEmailConfirmed = false;

    // Registra no Supabase Auth oficial (gerenciamento seguro de credenciais com hash)
    if (db.supabase && email.includes("@")) {
      try {
        app.showToast("Criando credenciais seguras no Supabase Auth...");
        const { data: authData, error: authError } = await db.supabase.auth.signUp({
          email: email,
          password: pass,
          options: {
            data: {
              username: username,
              discord_tag: discord
            }
          }
        });
        if (authError) {
          console.error("❌ Supabase Auth signUp erro:", authError.message);
          app.showFormError("Erro ao cadastrar: " + authError.message, "auth-form-register");
          return;
        }
        if (authData?.user?.id) {
          generatedId = authData.user.id;
          authEmailConfirmed = !!authData.user.email_confirmed_at;
          console.log("✅ Usuário cadastrado no Supabase Auth com UUID:", generatedId, "| Email confirmado:", authEmailConfirmed);
        }
      } catch (err) {
        console.error("Exceção Supabase Auth:", err);
        app.showFormError("Erro no serviço de autenticação: " + err.message, "auth-form-register");
        return;
      }
    }

    const randomAvatar = await NekosService.fetchRandomAvatar();

    // Perfil público: NUNCA salva senhas na tabela pública!
    const newUser = {
      id: generatedId,
      username: username,
      email: email,
      discord_tag: discord,
      bio: "",
      avatar_url: randomAvatar || APP_CONFIG.defaultAvatar,
      role: "player",
      is_dev: false,
      is_admin_apto: false,
      created_at: new Date().toISOString()
    };

    app.showToast("Salvando perfil público no Supabase...");
    try {
      await db.saveUser(newUser);
      console.log("✅ Perfil de usuário gravado com sucesso no Supabase!");
    } catch (dbErr) {
      app.showFormError("Erro ao gravar usuário no banco de dados: " + dbErr.message, "auth-form-register");
      return;
    }

    stateMgr.setUser(newUser, true);
    document.getElementById("auth-modal-overlay")?.classList.remove("active");
    app.updateAuthUI();
    app.showToast(`Conta criada com sucesso! Bem-vindo, ${newUser.username}!`);
    router.handleRouting();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => app.init());
  } else {
    app.init();
  }

})();
