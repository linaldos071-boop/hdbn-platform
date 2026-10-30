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
    itchUrl: "https://rikafurud.itch.io/hdbn",
    blogspotUrl: "https://cafedobom123.blogspot.com",
    blogspotFeed: "https://cafedobom123.blogspot.com/feeds/posts/default?alt=json",
    defaultAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=hdbn_default",
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
        const queryPromise = this.supabase.from("scores").select("id").limit(1);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000));
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        
        if (error && error.message && error.message.includes("Failed to fetch")) {
          this.isDbConnected = false;
          return false;
        }
        this.isDbConnected = true;
        return true;
      } catch (e) {
        console.warn("Verificação Supabase:", e.message);
        this.isDbConnected = false;
        return false;
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
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000));
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

    async insertBeatmap(record) {
      // 1. Atualiza cache em memória
      const maps = await this.getBeatmaps();
      this._cachedBeatmaps = [record, ...maps.filter(m => m.id !== record.id)];

      // 2. Persiste 100% no Supabase
      if (this.supabase) {
        try {
          const supabasePayload = {
            id: record.id,
            title: record.title || "Beatmap Sem Título",
            artist: record.artist || "Artista Desconhecido",
            bpm: Number(record.bpm) || 120,
            mapper_name: record.mapper_name,
            mapper_id: (record.mapper_id && typeof record.mapper_id === "string" && record.mapper_id.length === 36 && record.mapper_id.includes("-")) ? record.mapper_id : null,
            mapper_avatar: record.mapper_avatar || null,
            cover_url: record.cover_url,
            file_url: record.file_url,
            audio_preview_start: Number(record.audio_preview_start) || 0,
            audio_preview_length: 30.0,
            difficulty_level: record.difficulty_level || "medio",
            difficulty_name: record.difficulty_name || "Médio",
            star_rating: Number(record.star_rating) || 2.5,
            keys: record.keys || "4K",
            status: record.status || "pending",
            charts_data: record.charts || record.charts_data || {},
            downloads_count: record.downloads_count || 0,
            favorites_count: record.favorites_count || 0,
            plays_count: record.plays_count || 0,
            created_at: record.created_at || new Date().toISOString()
          };

          const { error } = await this.supabase
            .from("beatmaps")
            .upsert([supabasePayload], { onConflict: "id" });

          if (error) {
            console.error("Aviso ao salvar beatmap no Supabase:", error);
            throw error;
          } else {
            console.log("✅ Beatmap registrado com sucesso no Supabase!");
            this.isDbConnected = true;
          }
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
            last_login: new Date().toISOString()
          };

          let { error } = await this.supabase
            .from("users")
            .upsert([userPayload], { onConflict: "id" });

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
    static async uploadFile(fileOrBlob, filename = "file.bin") {
      try {
        const cfg = (window.CLOUDINARY_CONFIG && window.CLOUDINARY_CONFIG.cloudName) ? window.CLOUDINARY_CONFIG : CLOUDINARY_CONFIG;
        const uploadUrl = cfg.uploadUrl || `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;
        const preset = cfg.uploadPreset || "beatmaps";

        const formData = new FormData();
        const fname = fileOrBlob.name || filename || "upload.bin";
        formData.append("file", fileOrBlob, fname);
        formData.append("upload_preset", preset);

        console.log(`☁️ Enviando mídia para o Cloudinary (cloud: ${cfg.cloudName}, preset: ${preset})...`);

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Cloudinary upload concluído com sucesso:", data.secure_url);
          return data.secure_url;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error("❌ Erro no retorno do Cloudinary:", errData);
        }
      } catch (e) {
        console.error("❌ Falha de rede ao conectar com Cloudinary:", e);
      }
      return typeof fileOrBlob === "string" ? fileOrBlob : URL.createObjectURL(fileOrBlob);
    }
  }

  // ==========================================================================
  // 8. SPA ROUTER
  // ==========================================================================
  class SPARouter {
    constructor() {
      this.routes = {};
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
      const handler = this.routes[cleanPath] || this.routes["#/"];
      if (handler) handler();
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
      this.mainView = document.getElementById("main-view");
      this.audioPlayer = new Audio();
      this.audioPlayer.volume = 0.3; // Volume baixo
      this.audioTimer = null;
    }

    init() {
      this.setupRoutes();
      this.updateAuthUI();
      router.handleRouting();

      // Carrega dados frescos diretamente do Supabase no boot
      db.getBeatmaps(true).then((maps) => {
        const currentHash = window.location.hash || "#/";
        if (maps && maps.length > 0 && (currentHash === "#/" || currentHash.startsWith("#/maps"))) {
          router.handleRouting();
        }
      });
      db.getUsers(true);

      document.addEventListener("click", (e) => {
        const wrap = document.getElementById("user-ghost-menu-wrap");
        if (wrap && !wrap.contains(e.target)) {
          document.getElementById("user-floating-menu")?.classList.remove("active");
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
      router.register("#/beatmap", () => this.renderBeatmapDetailView());
      router.register("#/perfil", () => this.renderProfileView());
      router.register("#/admin", () => this.renderAdminView());
      router.register("#/blogs", () => this.renderBlogExpandedView());
      router.register("#/busca", () => this.renderSearchView());
      router.register("#/termos", () => this.renderTermsView());
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
        if (ghostImg) ghostImg.src = user.avatar_url || APP_CONFIG.defaultAvatar;
        const roleInfo = APP_CONFIG.ROLES[user.role] || APP_CONFIG.ROLES.player;
        const isStaff = user.role === 'admin' || user.role === 'dev' || user.is_dev;

        const canAccessAdmin = (user.role === 'dev' || user.is_dev || user.role === 'admin' || user.is_admin_apto);
        floatingMenu.innerHTML = `
          <div class="user-floating-header">
            <strong style="color:white; display:block; font-size:0.9rem;">${user.username}</strong>
            <span class="hierarchy-tag ${roleInfo.tagClass}">${roleInfo.label}</span>
            ${user.discord_tag ? `<span style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem;">@${user.discord_tag}</span>` : ''}
          </div>
          <a href="#/perfil?id=${user.id}" onclick="window.renderProfileView('${user.id}'); window.toggleUserMenu(); return false;" class="user-floating-item">
            <span class="material-symbols-outlined">person</span> Meu Perfil
          </a>
          ${canAccessAdmin ? `
          <a href="#/admin" onclick="window.renderAdminView(); window.toggleUserMenu(); return false;" class="user-floating-item" style="color:#f59e0b;">
            <span class="material-symbols-outlined">admin_panel_settings</span> Painel Admin (Staff)
          </a>` : ''}
          <div class="user-floating-item" onclick="window.app.logout(); window.toggleUserMenu();" style="color:#ef4444; border-top:1px solid var(--border-subtle); margin-top:0.25rem;">
            <span class="material-symbols-outlined">logout</span> Sair da Conta
          </div>
        `;
      } else {
        if (ghostImg) ghostImg.src = APP_CONFIG.defaultAvatar;
        floatingMenu.innerHTML = `
          <div class="user-floating-item" onclick="window.openAuthModal('login'); window.toggleUserMenu();">
            <span class="material-symbols-outlined">login</span> Logar
          </div>
          <div class="user-floating-item" onclick="window.openAuthModal('register'); window.toggleUserMenu();">
            <span class="material-symbols-outlined">person_add</span> Inscrever-se
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

    playAudioPreview(url, previewStart = 27.42, maxDuration = 30) {
      if (this.audioPlayer.src === url && !this.audioPlayer.paused) {
        this.audioPlayer.pause();
        if (this.audioTimer) clearTimeout(this.audioTimer);
        return false;
      }
      this.audioPlayer.src = url;
      this.audioPlayer.currentTime = previewStart;
      this.audioPlayer.volume = 0.3;
      this.audioPlayer.play().catch(() => {});

      if (this.audioTimer) clearTimeout(this.audioTimer);
      this.audioTimer = setTimeout(() => {
        this.audioPlayer.pause();
      }, maxDuration * 1000);

      return true;
    }

    _getDifficultyBadgeHTML(level, name) {
      const cls = `diff-${level || 'facil'}`;
      return `<span class="diff-pill ${cls}">${name || 'Fácil'}</span>`;
    }

    _createShelfMapCardHTML(map) {
      const isFav = stateMgr.isFavorite(map.id);
      const diffBadge = this._getDifficultyBadgeHTML(map.difficulty_level, map.difficulty_name);
      return `
        <div class="beatmap-shelf-card" onclick="window.renderBeatmapDetailView('${map.id}')">
          <img src="${map.cover_url}" class="shelf-card-thumb" alt="${map.title}">
          <div class="shelf-card-body">
            <div class="shelf-card-title">${map.title}</div>
            <div class="shelf-card-creator">criador: ${map.mapper_name}</div>
            <div class="shelf-card-badges-row">
              <span class="pill-ranqueado-purple">ranqueado</span>
              ${diffBadge}
              <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700;">★ ${map.star_rating}</span>
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
    // TELA INICIAL (HOME) — COM POSTS E IMAGENS REAIS DO BLOGSPOT
    // ========================================================================
    async renderHomeView() {
      const maps = await db.getBeatmaps();
      const realBlogs = blogService.getPosts();

      const recentes = [...maps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const maisFavoritados = [...maps].sort((a, b) => b.favorites_count - a.favorites_count);
      const maisBaixados = [...maps].sort((a, b) => b.downloads_count - a.downloads_count);

      this.mainView.innerHTML = `
        <div class="container">
          
          <!-- TOP ROW: HERO BANNER ESQUERDA + NOVOS BLOGS REAIS DIREITA -->
          <div class="home-hero-grid">
            
            <!-- Banner Esquerdo -->
            <div class="home-hero-banner-card">
              <img src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200" class="home-hero-banner-img" alt="HDBN Banner">
              <div class="home-hero-banner-overlay">
                <div class="home-hero-title-box">
                  <div class="home-hero-hdbn-text">HDBN</div>
                  <div class="home-hero-tracks-preview">
                    <span>1. Elif • Cadu Rodrigues</span>
                    <span>2. 鳥の詩 • Lia</span>
                    <span>3. Insane Beatmaps 4K & 7K</span>
                  </div>
                </div>
                <a href="${APP_CONFIG.itchUrl}" target="_blank" class="btn-itch-purple">
                  DAIXAR no itch
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
      const maps = await db.getBeatmaps();

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

      this.mainView.innerHTML = `
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

      this.mainView.innerHTML = `
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
      const maps = await db.getBeatmaps();

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

      this.mainView.innerHTML = `
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
    renderRankingView(timeFilter = 'all', mode = 'normal') {
      // Calcula a pontuação total acumulada por usuário instantaneamente
      const userRankings = db.getUserRankings(timeFilter, mode);

      this.mainView.innerHTML = `
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
                        <span class="hierarchy-tag ${APP_CONFIG.ROLES[item.user.role]?.tagClass}" style="font-size:0.65rem; padding:0.05rem 0.35rem;">${APP_CONFIG.ROLES[item.user.role]?.label}</span>
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
      const maps = await db.getBeatmaps();
      const users = await db.getUsers();

      let filteredMaps = maps;
      let filteredUsers = users;

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

      this.mainView.innerHTML = `
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
                  <img src="${m.cover_url}" class="community-card-thumb" alt="${m.title}">
                  <div style="flex:1;">
                    <div style="font-size:0.95rem; font-weight:800; color:#fff;">${m.title}</div>
                    <div style="font-size:0.775rem; color:var(--text-secondary); margin:0.15rem 0;">criador: ${m.mapper_name}</div>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                      <span class="pill-ranqueado-purple">ranqueado</span>
                      ${this._getDifficultyBadgeHTML(m.difficulty_level, m.difficulty_name)}
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.75rem; color:var(--text-muted); font-size:0.8rem;">
                    <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:1rem;">download</span> ${m.downloads_count}</span>
                    <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:1rem; color:#ec4899;">bookmark</span> ${m.favorites_count}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
              ${displayedUsers.map(u => `
                <div class="beatmap-shelf-card" onclick="window.renderProfileView('${u.id}')">
                  <img src="${u.avatar_url}" style="width:48px; height:48px; border-radius:var(--radius-sm); object-fit:cover;" alt="${u.username}">
                  <div style="flex:1;">
                    <div style="font-weight:800; color:white;">${u.username}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; gap:0.6rem; margin-top:0.2rem;">
                      <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">download</span> ${u.downloads_total}</span>
                      <span style="display:flex; align-items:center; gap:0.2rem;"><span class="material-symbols-outlined" style="font-size:0.9rem; color:#ec4899;">bookmark</span> ${u.favorites_total}</span>
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
            ${users.slice(0, 4).map(u => `
              <div class="beatmap-shelf-card" onclick="window.renderProfileView('${u.id}')">
                <img src="${u.avatar_url}" style="width:48px; height:48px; border-radius:var(--radius-sm); object-fit:cover;" alt="${u.username}">
                <div style="flex:1;">
                  <div style="font-weight:800; color:white;">${u.username}</div>
                  <div style="font-size:0.75rem; color:var(--text-secondary); display:flex; gap:0.6rem; margin-top:0.25rem;">
                    <span style="display:flex; align-items:center; gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem;">download</span> ${u.downloads_total} downloads</span>
                    <span style="display:flex; align-items:center; gap:0.25rem;"><span class="material-symbols-outlined" style="font-size:0.9rem; color:#ec4899;">bookmark</span> ${u.favorites_total} favs</span>
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
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const mapId = targetId || urlParams.get("id");
      const map = mapId ? await db.getBeatmapById(mapId) : null;

      if (!map) {
        this.mainView.innerHTML = `
          <div class="container" style="padding: 4rem 1rem; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 3rem 1.5rem;">
              <span class="material-symbols-outlined" style="font-size: 3.5rem; color: var(--accent-purple-light); margin-bottom: 0.5rem;">music_off</span>
              <h2 style="font-size: 1.8rem; font-weight: 900; color: white; margin-bottom: 0.5rem;">Beatmap não encontrado</h2>
              <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">O beatmap solicitado não existe ou ainda não foi publicado no banco de dados.</p>
              <a href="#/maps" onclick="window.navigateClean('#/maps'); return false;" class="btn btn-primary">
                <span class="material-symbols-outlined">library_music</span> Ver Todos os Mapas
              </a>
            </div>
          </div>
        `;
        return;
      }

      const user = stateMgr.getUser();
      const isFav = stateMgr.isFavorite(map.id);
      const isCreator = user && (user.username === map.mapper_name || user.id === map.mapper_id);
      const isAdminOrDev = user && (user.role === 'admin' || user.role === 'dev' || user.is_dev);
      const currentObs = stateMgr.getObservation(map.id);
      const mapPlays = [];

      this.mainView.innerHTML = `
        <div class="container" style="padding: 2rem 0;">
          
          <img src="${map.cover_url}" class="map-page-hero-banner" alt="${map.title}">

          <div class="map-badges-row">
            <span class="badge-ranked"><span class="material-symbols-outlined" style="font-size:0.85rem;">check_circle</span> RANQUEADO</span>
            ${this._getDifficultyBadgeHTML(map.difficulty_level, map.difficulty_name)}
            ${map.is_featured_artist ? '<span class="badge-featured">ARTISTA EM DESTAQUE</span>' : ''}
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
              <span class="map-stat-value" style="color:white;">${map.downloads_count}</span>
            </div>
            <div class="map-stat-item">
              <span class="map-stat-label">FAVORITOS</span>
              <span class="map-stat-value" style="color:#ec4899;">${map.favorites_count}</span>
            </div>
            <div class="map-stat-item">
              <span class="map-stat-label">PRÉVIA ÁUDIO</span>
              <span class="map-stat-value" style="color:#38bdf8;">${map.audio_preview_length || '30.0s'}</span>
            </div>
          </div>

          <!-- OBSERVAÇÕES -->
          <div class="map-obs-box">
            <div class="map-obs-header">
              <span style="display:flex; align-items:center; gap:0.35rem;">
                <span class="material-symbols-outlined" style="color:#f59e0b;">warning</span> Observações do Mapeador / Moderação:
              </span>
              ${(isCreator || isAdminOrDev) ? '<span style="color:var(--accent-cyan); font-size:0.8rem;">(Você pode editar)</span>' : ''}
            </div>
            <textarea id="map-obs-input" class="map-obs-textarea" ${(isCreator || isAdminOrDev) ? '' : 'readonly'}>${currentObs}</textarea>
            ${(isCreator || isAdminOrDev) ? `
              <div style="display:flex; justify-content:flex-end; margin-top:0.75rem;">
                <button class="btn btn-dark-secondary btn-sm" onclick="window.app.saveObservation('${map.id}')">
                  <span class="material-symbols-outlined">save</span> Salvar Observação
                </button>
              </div>
            ` : ''}
          </div>

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

            ${(isCreator || isDev) ? `
              <button class="btn btn-danger-red" onclick="window.app.deleteMap('${map.id}')">
                <span class="material-symbols-outlined">delete</span> Excluir
              </button>
            ` : ''}
          </div>

          <!-- DIFICULDADES COM CORES OFICIAIS -->
          <h2 style="font-size:1.4rem; font-weight:900; color:white; margin:2rem 0 1rem 0;">Dificuldades & Informações Técnicas</h2>
          <div style="background:#12131b; border:1px solid var(--border-subtle); padding:1.25rem; border-radius:var(--radius-sm); margin-bottom:2.5rem;">
            <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm diff-facil" onclick="window.app.selectDiff('Fácil', 'facil', 1.12, 105, 120)">Fácil (Verde)</button>
              <button class="btn btn-secondary btn-sm diff-medio" onclick="window.app.selectDiff('Médio', 'medio', 2.40, 142, 120)">Médio (Azul)</button>
              <button class="btn btn-secondary btn-sm diff-hard" onclick="window.app.selectDiff('Hard', 'hard', 3.80, 189, 120)">Hard (Amarelo)</button>
              <button class="btn btn-secondary btn-sm diff-expert" onclick="window.app.selectDiff('Expert', 'expert', 5.20, 245, 120)">Expert (Roxo)</button>
              <button class="btn btn-secondary btn-sm diff-extreme" onclick="window.app.selectDiff('Extreme', 'extreme', 6.85, 390, 120)">Extreme (Vermelho)</button>
            </div>

            <div style="display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap;" id="diff-info-display">
              <span id="diff-badge-container">
                ${this._getDifficultyBadgeHTML(map.difficulty_level, map.difficulty_name)}
              </span>
              <span style="color:var(--text-secondary); font-size:0.85rem;">Classificação Estrelar: <strong style="color:white;" id="diff-star-val">★ ${map.star_rating}</strong></span>
              <span style="color:var(--text-secondary); font-size:0.85rem;">BPM: <strong style="color:white;" id="diff-bpm-val">${map.bpm}</strong></span>
              <span style="color:var(--text-secondary); font-size:0.85rem;">Notas nesta Dificuldade: <strong style="color:white;" id="diff-notes-val">${map.charts?.easy?.notes_count || 105}</strong></span>
              <span style="color:var(--text-secondary); font-size:0.85rem;">Modo de Teclas: <strong style="color:white;">${map.keys}</strong></span>
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

    saveObservation(mapId) {
      const txt = document.getElementById("map-obs-input").value;
      stateMgr.setObservation(mapId, txt);
      this.showToast("Observação salva com sucesso!");
    }

    async deleteMap(mapId) {
      if (confirm("Tem certeza que deseja excluir totalmente este beatmap?")) {
        await db.deleteBeatmap(mapId);
        this.showToast("Beatmap excluído permanentemente do banco de dados!");
        window.navigateClean("#/maps");
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
        this.showToast("Você precisa ter uma conta para baixar mapas!");
        window.openAuthModal('register');
        return false;
      }
      this.showToast("Download iniciado!");
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
      // Atualiza contador de downloads no Supabase (sem bloquear o download)
      if (db.supabase && id) {
        db.supabase.rpc('increment_downloads', { beatmap_id: id }).catch(() => {});
      }
    }

    toggleFav(id, btn) {
      const isFav = stateMgr.toggleFavorite(id);
      this.showToast(isFav ? "Adicionado aos favoritos!" : "Removido dos favoritos!");
      const icon = btn.querySelector(".material-symbols-outlined");
      if (icon) {
        icon.textContent = isFav ? "bookmark" : "bookmark_border";
        icon.style.color = isFav ? "#ec4899" : "inherit";
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
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const currentUser = stateMgr.getUser();
      const targetId = userId || urlParams.get("id") || (currentUser ? currentUser.id : null);
      const users = await db.getUsers();
      const maps = await db.getBeatmaps();
      const u = (targetId ? users.find(x => x.id === targetId) : null) || (currentUser ? users.find(x => x.id === currentUser.id) : null);
      if (!u) {
        this.mainView.innerHTML = `
          <div class="container" style="padding: 4rem 1rem; text-align: center;">
            <div style="max-width: 500px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 3rem 1.5rem;">
              <span class="material-symbols-outlined" style="font-size: 3.5rem; color: var(--accent-purple-light); margin-bottom: 0.5rem;">person_off</span>
              <h2 style="font-size: 1.8rem; font-weight: 900; color: white; margin-bottom: 0.5rem;">Perfil não encontrado</h2>
              <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">O usuário solicitado não existe ou ainda não foi registrado no banco de dados.</p>
              <a href="#/" onclick="window.navigateClean('#/'); return false;" class="btn btn-primary">Voltar ao Início</a>
            </div>
          </div>
        `;
        return;
      }

      const createdMaps = maps.filter(m => m.mapper_name === u.username || m.mapper_id === u.id);
      const favMapIds = stateMgr.getUserFavorites(u.id);
      const favoritedMaps = maps.filter(m => favMapIds.includes(m.id));

      const isOwnProfile = currentUser && currentUser.id === u.id;
      const roleInfo = APP_CONFIG.ROLES[u.role] || APP_CONFIG.ROLES.player;
      const canPromote = currentUser && (
        (currentUser.is_dev && !u.is_dev) ||
        (currentUser.role === 'admin' && u.role === 'player')
      );
      const userBio = (u.bio && u.bio.trim()) ? u.bio.trim() : "Ainda não falou nada sobre si.";

      this.mainView.innerHTML = `
        <div class="container" style="padding: 2.5rem 0;">
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:2rem; display:flex; align-items:flex-start; gap:1.5rem; margin-bottom:2rem; flex-wrap:wrap;">
            <img src="${u.avatar_url}" style="width:84px; height:84px; border-radius:var(--radius-sm); object-fit:cover; border:2px solid var(--accent-purple);" alt="${u.username}">
            <div style="flex:1; min-width:260px;">
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <h1 style="font-size:2rem; font-weight:900; color:#fff; margin:0;">${u.username}</h1>
                <span class="hierarchy-tag ${roleInfo.tagClass}">${roleInfo.label}</span>
                ${u.is_dev ? '<span class="hierarchy-tag tag-dev">DEV</span>' : ''}
              </div>
              ${u.discord_tag ? `<p style="color:var(--accent-cyan); font-weight:700; font-size:0.85rem; margin:0.35rem 0 0.5rem 0;">Discord: @${u.discord_tag}</p>` : '<p style="color:var(--text-muted); font-size:0.85rem; margin:0.35rem 0 0.5rem 0;">Discord: Não informado</p>'}
              
              <div style="margin-top:0.75rem; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:0.75rem 1rem;">
                <div style="font-size:0.75rem; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.25rem;">Sobre Mim</div>
                <p style="color:var(--text-secondary); font-size:0.9rem; margin:0; line-height:1.4;">${userBio}</p>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
              ${isOwnProfile ? `
                <button class="btn btn-secondary" onclick="window.app.openEditProfileModal()" style="display:flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; font-weight:700;">
                  <span class="material-symbols-outlined" style="font-size:1.1rem;">edit</span> Editar Perfil
                </button>
              ` : ''}

              ${canPromote ? `
                <div style="display:flex; flex-direction:column; gap:0.35rem; margin-top:0.5rem;">
                  <label style="font-size:0.75rem; font-weight:800; color:var(--text-secondary);">Promover Cargo:</label>
                  <select class="search-input-field" onchange="window.app.promoteUser('${u.id}', this.value)" style="padding:0.3rem 0.5rem;">
                    <option value="player" ${u.role === 'player' ? 'selected' : ''}>Player</option>
                    <option value="writer" ${u.role === 'writer' ? 'selected' : ''}>Escritor / Mod</option>
                    ${currentUser.is_dev ? '<option value="admin" ' + (u.role === 'admin' ? 'selected' : '') + '>Administrador</option>' : ''}
                  </select>
                </div>
              ` : ''}
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
      if (unInput) unInput.value = u.username || "";
      if (dcInput) dcInput.value = u.discord_tag || "";
      if (avInput) avInput.value = u.avatar_url || "";
      if (bioInput) bioInput.value = u.bio || "";
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
      const newPass = document.getElementById("edit-password")?.value || "";
      const passConfirm = document.getElementById("edit-password-confirm")?.value || "";

      if (!newUsername) {
        alert("O nome de usuário não pode ficar vazio.");
        return;
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
        avatar_url: newAvatar || u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(newUsername)}`
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
    // TELA DE PUBLICAR (/publicar) - ESTRITAMENTE ARQUIVOS .HBN
    // Extração real de metadados, notas, capa e Cloudinary / Supabase
    // ========================================================================
    async renderPublishView() {
      const user = stateMgr.getUser();

      if (!user) {
        this.mainView.innerHTML = `
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

      this.mainView.innerHTML = `
        <div class="container" style="padding: 2.5rem 0; max-width:680px;">
          <h1 style="font-size:2rem; font-weight:900; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.5rem; color:white;">
            <span class="material-symbols-outlined" style="color:var(--accent-purple-light);">folder</span> Publicar Beatmap (.hbn)
          </h1>
          <p style="color:var(--text-secondary); margin-bottom:1.5rem; font-size:0.85rem;">
            Envie exclusivamente o arquivo com formato <code>.hbn</code> exportado pelo Godot Engine.
            Os dados reais, contagem de notas e imagem de capa serão extraídos do arquivo.
          </p>

          <form onsubmit="window.app.handlePublishSubmit(event)" style="background:var(--bg-card); border:1px solid var(--border-subtle); padding:1.75rem; border-radius:var(--radius-sm); display:flex; flex-direction:column; gap:1.25rem;">
            
            <div style="border:2px dashed var(--border-focus); border-radius:var(--radius-sm); padding:2rem; text-align:center; cursor:pointer;" onclick="document.getElementById('pub-file').click()">
              <span class="material-symbols-outlined" style="font-size:3rem; color:var(--accent-purple-light);">cloud_upload</span>
              <p style="font-weight:800; color:white; margin-top:0.5rem;">Clique ou arraste para selecionar o arquivo .hbn</p>
              <span style="font-size:0.75rem; color:var(--accent-cyan); display:block; margin-top:0.25rem;">Permitido estritamente: apenas pacotes com extensão .hbn</span>
              <input type="file" id="pub-file" required accept=".hbn" style="display:none;" onchange="window.app.onFileSelected(this)">
            </div>

            <!-- Dados Extraídos com Valores Reais lidos do .hbn -->
            <div id="file-parsed-preview" style="display:none; background:#0e1017; border:1px solid var(--border-subtle); padding:1.25rem; border-radius:var(--radius-sm);">
              <span style="font-size:0.75rem; font-weight:800; color:var(--accent-cyan); text-transform:uppercase;">Dados Reais Extraídos do Beatmap:</span>
              
              <div style="display:flex; gap:1.25rem; align-items:flex-start; margin-top:1rem; flex-wrap:wrap;">
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

            <button type="submit" class="btn btn-primary" style="margin-top:0.5rem;">
              <span class="material-symbols-outlined">send</span> Publicar Beatmap Oficial
            </button>
          </form>
        </div>
      `;
    }

    async onFileSelected(input) {
      const file = input.files[0];
      if (!file) return;

      // Validação estrita: somente arquivos .hbn são aceitos!
      if (!file.name.toLowerCase().endsWith(".hbn")) {
        this.showToast("Erro: Apenas arquivos no formato .hbn são permitidos!");
        input.value = "";
        const preview = document.getElementById("file-parsed-preview");
        if (preview) preview.style.display = "none";
        return;
      }

      this.showToast("Lendo estrutura do pacote .hbn...");

      try {
        if (!window.JSZip) {
          throw new Error("Biblioteca JSZip não carregada.");
        }

        const zip = await window.JSZip.loadAsync(file);
        let chartJson = null;
        let coverBlob = null;
        let coverPreviewUrl = "";
        let difficultiesFound = [];
        let chartsData = {};
        let totalNotes = 0;

        // Localizar arquivos JSON de charts e arquivos .info
        const jsonEntries = [];
        let infoEntry = null;

        zip.forEach((relPath, entry) => {
          const lower = relPath.toLowerCase();
          if (lower.endsWith(".json") && !entry.dir) {
            jsonEntries.push(entry);
          } else if ((lower.endsWith(".info") || lower.endsWith("info.txt")) && !entry.dir) {
            infoEntry = entry;
          }
        });

        // Tentar ler e descriptografar arquivos de chart
        if (jsonEntries.length > 0) {
          for (const entry of jsonEntries) {
            try {
              const text = await entry.async("string");
              let parsed = null;
              try {
                parsed = JSON.parse(text);
              } catch (e) {
                parsed = HBNDecrypter.decryptPackage(text);
              }

              if (parsed) {
                if (!chartJson) chartJson = parsed;

                const diffName = entry.name.replace(/\.json$/i, "").split("/").pop();
                let notesCount = 0;
                if (parsed.tracks) {
                  notesCount = HBNDecrypter.countNotesInChart(parsed);
                } else if (Array.isArray(parsed.beats)) {
                  notesCount = parsed.beats.length;
                } else if (Array.isArray(parsed.notes)) {
                  notesCount = parsed.notes.length;
                }

                if (notesCount > 0) {
                  difficultiesFound.push({
                    name: diffName,
                    notes: notesCount,
                    star: parsed.star_rating || 1.8
                  });
                  chartsData[diffName.toLowerCase()] = { notes_count: notesCount, star: parsed.star_rating || 1.8 };
                  totalNotes += notesCount;
                }
              }
            } catch (err) {}
          }
        }

        // Ler arquivo .info complementar se houver
        let infoData = {};
        if (infoEntry) {
          try {
            const infoText = await infoEntry.async("string");
            try {
              infoData = JSON.parse(infoText);
            } catch (e) {
              infoText.split("\n").forEach(line => {
                const [k, ...v] = line.split("=");
                if (k && v.length) infoData[k.trim().toLowerCase()] = v.join("=").trim().replace(/^"|"$/g, "");
              });
            }
          } catch (e) {}
        }

        // Se o chart principal tiver beats diretamente
        if (chartJson && difficultiesFound.length === 0) {
          let count = 0;
          if (chartJson.tracks) count = HBNDecrypter.countNotesInChart(chartJson);
          else if (Array.isArray(chartJson.beats)) count = chartJson.beats.length;
          else if (Array.isArray(chartJson.notes)) count = chartJson.notes.length;
          else count = 120;

          totalNotes = count;
          const diffName = chartJson.difficulty_name || infoData.difficulty || "Normal";
          difficultiesFound.push({
            name: diffName,
            notes: count,
            star: chartJson.star_rating || 2.0
          });
          chartsData["normal"] = { notes_count: count, star: chartJson.star_rating || 2.0 };
        }

        // Se não encontrou notas, fallback para 120
        if (totalNotes === 0) {
          totalNotes = 120;
          difficultiesFound.push({ name: "Normal", notes: 120, star: 2.0 });
          chartsData["normal"] = { notes_count: 120, star: 2.0 };
        }

        // Extrair Metadados
        const cleanBaseName = file.name.replace(/\.hbn$/i, "").trim();
        const title = (chartJson && chartJson.title) || infoData.title || (cleanBaseName.includes(" - ") ? cleanBaseName.split(" - ")[1].trim() : cleanBaseName);
        const artist = (chartJson && chartJson.artist) || infoData.artist || (cleanBaseName.includes(" - ") ? cleanBaseName.split(" - ")[0].trim() : "Artista Desconhecido");
        const bpm = (chartJson && chartJson.bpm) || Number(infoData.bpm) || 120;
        const previewStart = (chartJson && chartJson.audio_preview_start !== undefined) ? chartJson.audio_preview_start : (Number(infoData.audio_preview_start) || 0);

        // Extrair Capa
        let coverEntry = null;
        const artPath = (chartJson && (chartJson.art || chartJson.art_file || chartJson.UI_file)) || infoData.art_file || infoData.ui_file || "";
        const artBase = artPath ? artPath.split("/").pop().toLowerCase() : "";

        zip.forEach((relPath, entry) => {
          const lower = relPath.toLowerCase();
          const baseName = lower.split("/").pop();
          if (!entry.dir) {
            if (artBase && baseName === artBase) {
              coverEntry = entry;
            } else if (!coverEntry && (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp"))) {
              coverEntry = entry;
            }
          }
        });

        if (coverEntry) {
          coverBlob = await coverEntry.async("blob");
          coverPreviewUrl = URL.createObjectURL(coverBlob);
        }

        this.currentPublishData = {
          file: file,
          title: title,
          artist: artist,
          bpm: bpm,
          previewStart: previewStart,
          totalNotes: totalNotes,
          difficulties: difficultiesFound,
          charts: chartsData,
          coverBlob: coverBlob,
          coverPreviewUrl: coverPreviewUrl,
          starRating: difficultiesFound[0]?.star || 2.0,
          difficultyName: difficultiesFound[0]?.name || "Normal",
          difficultyLevel: "normal"
        };

        // Atualizar visualização do formulário
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
        }

        this.showToast(`Arquivo .hbn desempacotado: "${title}" (${totalNotes} notas detectadas)!`);
      } catch (err) {
        console.error("Erro ao analisar .hbn:", err);
        this.showToast("Erro ao processar pacote .hbn: " + err.message);
      }
    }

    async handlePublishSubmit(e) {
      e.preventDefault();
      if (!this.currentPublishData) {
        this.showToast("Selecione um pacote .hbn válido primeiro.");
        return;
      }

      const user = stateMgr.getUser();
      if (!user) {
        this.showToast("Primeiro entre na sua conta para publicar!");
        window.openAuthModal('login');
        return;
      }

      this.showToast("Enviando mídia e pacote para o Cloudinary...");
      const mapId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : (
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        })
      );

      let coverUrl = APP_CONFIG.defaultCover;
      if (this.currentPublishData.coverBlob) {
        coverUrl = await CloudinaryService.uploadFile(this.currentPublishData.coverBlob, `${mapId}_cover.jpg`);
      }

      const fileUrl = await CloudinaryService.uploadFile(this.currentPublishData.file, `${mapId}.hbn`);

      const newMapRecord = {
        id: mapId,
        title: this.currentPublishData.title || "Beatmap Sem Título",
        artist: this.currentPublishData.artist || "Artista Desconhecido",
        bpm: Number(this.currentPublishData.bpm) || 120,
        mapper_name: user.username,
        mapper_id: (user.id && typeof user.id === "string" && user.id.length === 36 && user.id.includes("-")) ? user.id : null,
        mapper_avatar: user.avatar_url || APP_CONFIG.defaultAvatar,
        cover_url: coverUrl,
        file_url: fileUrl,
        audio_preview_start: Number(this.currentPublishData.previewStart) || 0,
        audio_preview_length: 30.0,
        difficulty_level: this.currentPublishData.difficultyLevel || "medio",
        difficulty_name: this.currentPublishData.difficultyName || "Médio",
        star_rating: Number(this.currentPublishData.starRating) || 2.5,
        keys: "4K",
        status: "pending",
        charts: this.currentPublishData.charts || {},
        charts_data: this.currentPublishData.charts || {},
        downloads_count: 0,
        favorites_count: 0,
        plays_count: 0,
        created_at: new Date().toISOString()
      };

      this.showToast("Registrando beatmap no banco de dados...");
      await db.insertBeatmap(newMapRecord);
      this.showToast("Beatmap enviado! Aguardando aprovação da moderação para se tornar ranqueado.");

      this.currentPublishData = null;
      window.renderBeatmapDetailView(newMapRecord.id);
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
          <div class="container" style="padding: 6rem 0; text-align:center; max-width:520px; margin:0 auto;">
            <span class="material-symbols-outlined" style="font-size:5rem; color:#ef4444;">gpp_bad</span>
            <h1 style="font-size:2rem; font-weight:900; margin:1rem 0; color:#ef4444;">Acesso Negado</h1>
            <p style="color:var(--text-secondary); margin-bottom:2rem; line-height:1.7; font-size:1rem;">
              Você não tem permissão para acessar o Painel de Moderação.<br>
              <strong>Apenas Administradores e Desenvolvedores</strong> podem entrar nesta área.
            </p>
            <button class="btn btn-primary" onclick="window.router.navigateClean('#/')">
              <span class="material-symbols-outlined">home</span> Voltar ao Início
            </button>
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
                    const isSuspended = m.status === 'suspenso';
                    const isHidden = m.status === 'oculto';
                    const isPending = m.status === 'pending';
                    const isRanked = m.status === 'approved_ranked';

                    let statusBadge = '<span class="status-badge status-approved">Ranqueado</span>';
                    if (isPending) statusBadge = '<span class="status-badge" style="background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid #f59e0b;">Pendente</span>';
                    else if (isSuspended) statusBadge = '<span class="status-badge status-inactive">Suspenso</span>';
                    else if (isHidden) statusBadge = '<span class="status-badge status-pending">Oculto</span>';
                    else if (!isRanked) statusBadge = '<span class="status-badge" style="background:rgba(148,163,184,0.2); color:#94a3b8;">Não-Ranqueado</span>';

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
                          
                          <!-- Botão Aprovar e Ranquear (se pendente ou não-ranqueado) -->
                          ${!isRanked ? `
                            <button class="btn btn-secondary btn-sm" style="background:rgba(34,197,94,0.2); color:#22c55e; border-color:#22c55e; font-weight:700;" onclick="window.app.adminApproveMap('${m.id}')" title="Aprovar beatmap e torná-lo Oficialmente Ranqueado">
                              Aprovar (Ranqueado)
                            </button>
                          ` : `
                            <button class="btn btn-secondary btn-sm" style="background:rgba(148,163,184,0.15); color:#94a3b8;" onclick="window.app.adminSetUnranked('${m.id}')" title="Remover status de ranqueado">
                              Desranquear
                            </button>
                          `}

                          <!-- Botão Suspender com Tempo e Observação -->
                          <button class="btn btn-secondary btn-sm" style="background:rgba(245,158,11,0.2); color:#f59e0b;" onclick="window.app.adminSuspendMap('${m.id}')" title="Suspender mapa por um tempo e adicionar observação">
                            Suspender
                          </button>

                          <!-- Botão Ocultar / Reexibir -->
                          <button class="btn btn-secondary btn-sm" style="background:rgba(56,189,248,0.2); color:#38bdf8;" onclick="window.app.adminToggleHideMap('${m.id}')" title="Marcar como oculto">
                            ${isHidden ? 'Reexibir' : 'Ocultar'}
                          </button>

                          <!-- Botão Excluir: Restrito estritamente a DEV -->
                          ${isDev ? `
                            <button class="btn btn-secondary btn-sm" style="background:rgba(239,68,68,0.2); color:#ef4444;" onclick="window.app.deleteMap('${m.id}')" title="Excluir beatmap permanentemente (Permissão DEV)">
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
                    <th>Infrações</th>
                    <th>Status / Inatividade</th>
                    <th>Ações de Moderação</th>
                  </tr>
                </thead>
                <tbody>
                  ${usersList.map(u => {
                    const targetIsDev = u.role === 'dev' || u.is_dev;
                    const infractionsCount = stateMgr.getInfractions(u.id);

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
                          <span style="font-weight:900; color:${infractionsCount >= 5 ? '#ef4444' : '#fff'};">
                            ${infractionsCount} / 5 ${infractionsCount >= 5 ? '<span class="material-symbols-outlined" style="font-size:1rem; vertical-align:middle; color:#ef4444;">warning</span> CRÍTICO' : ''}
                          </span>
                        </td>
                        <td>
                          ${(u.days_inactive || 0) >= 27 ? `<span class="status-badge status-inactive">Inativo (${u.days_inactive} dias)</span>` : '<span class="status-badge status-approved">Ativo</span>'}
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

    async adminApproveMap(mapId) {
      const user = stateMgr.getUser();
      if (!user || (!user.is_dev && user.role !== 'admin' && !user.is_admin_apto)) {
        this.showToast("Apenas Administradores ou DEVs podem aprovar beatmaps.");
        return;
      }
      await db.updateBeatmapStatus(mapId, 'approved_ranked', 'Aprovado oficialmente pela moderação.');
      this.showToast("Beatmap aprovado e agora está Oficialmente Ranqueado!");
      this.renderAdminView('maps');
    }

    async adminSetUnranked(mapId) {
      const user = stateMgr.getUser();
      if (!user || (!user.is_dev && user.role !== 'admin' && !user.is_admin_apto)) {
        this.showToast("Sem permissão.");
        return;
      }
      await db.updateBeatmapStatus(mapId, 'approved_unranked', 'Status alterado para Não-Ranqueado.');
      this.showToast("Status alterado para Não-Ranqueado.");
      this.renderAdminView('maps');
    }

    async adminSuspendMap(mapId) {
      const time = prompt("Informe o tempo de suspensão do mapa (ex: 7 dias, 15 dias, 30 dias):", "7 dias");
      if (!time) return;
      const obs = prompt("Adicione uma observação do motivo da suspensão:", "Ajuste na sincronia das notas ou áudio");
      if (obs !== null) {
        stateMgr.setObservation(mapId, `[SUSPENSO - ${time}]: ${obs}`);
        await db.updateBeatmapStatus(mapId, 'suspenso', `[SUSPENSO - ${time}]: ${obs}`);
        this.showToast(`Mapa suspenso por ${time}. Observação registrada!`);
        this.renderAdminView('maps');
      }
    }

    async adminToggleHideMap(mapId) {
      const map = await db.getBeatmapById(mapId);
      const newStatus = map?.status === 'oculto' ? 'approved_ranked' : 'oculto';
      await db.updateBeatmapStatus(mapId, newStatus);
      this.showToast(`Visibilidade do mapa alterada para ${newStatus === 'oculto' ? 'Oculto' : 'Ativo'}!`);
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

    async banMapWithInfraction(mapId, authorId) {
      await db.deleteBeatmap(mapId);
      const count = stateMgr.incrementInfraction(authorId);
      this.showToast(`Mapa excluído! O autor recebeu +1 infração (Total: ${count}/5).`);
      this.renderAdminView('reports');
    }

    // ========================================================================
    // TELA DEDICADA DE BUSCA (#/busca) — COM GRADE DE 3 COLUNAS
    // ========================================================================
    async renderSearchView(initialQuery, initialFilter) {
      const urlParams = new URLSearchParams(window.location.hash.split("?")[1] || "");
      const query = (initialQuery !== undefined ? initialQuery : (urlParams.get("q") || "")).trim();
      const filter = initialFilter || urlParams.get("tipo") || this.searchPageCategory || "all";
      this.searchPageCategory = filter;

      const term = query.toLowerCase();
      const allUsers = await db.getUsers();
      const allMaps = await db.getBeatmaps();

      const matchedUsers = term 
        ? allUsers.filter(u => u.username.toLowerCase().includes(term) || (u.discord_tag && u.discord_tag.toLowerCase().includes(term)) || (u.bio && u.bio.toLowerCase().includes(term)))
        : allUsers;

      const matchedMaps = term 
        ? allMaps.filter(m => m.title.toLowerCase().includes(term) || m.artist.toLowerCase().includes(term) || m.mapper_name.toLowerCase().includes(term))
        : allMaps;

      const cleanQueryAttr = (query || "").replace(/"/g, "&quot;");

      this.mainView.innerHTML = `
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

          <!-- Área de Resultados em Grade de 3 Colunas (1, 2, 3 e 3 embaixo) -->
          <div id="search-results-area" style="margin-top:1rem;">
            ${filter === 'all' ? `
              ${matchedUsers.length > 0 ? `
                <div style="margin-bottom:2.5rem;">
                  <h3 style="font-size:1.2rem; font-weight:800; color:#fff; margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
                    <span class="material-symbols-outlined" style="color:var(--accent-cyan);">people</span> Usuários (${matchedUsers.length})
                  </h3>
                  <div class="search-grid-3col">
                    ${matchedUsers.map(u => this._createUserCardHTML(u)).join('')}
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
      window.location.hash = `#/busca?q=${encodeURIComponent(q)}&tipo=${cat}`;
      this.renderSearchView(q, cat);
    }

    setSearchCategory(category) {
      this.searchPageCategory = category;
      const input = document.getElementById("search-main-input");
      const q = input ? input.value.trim() : "";
      window.location.hash = `#/busca?q=${encodeURIComponent(q)}&tipo=${category}`;
      this.renderSearchView(q, category);
    }

    _createUserCardHTML(u) {
      const role = APP_CONFIG.ROLES[u.role] || APP_CONFIG.ROLES.player;
      const bioText = (u.bio && u.bio.trim()) ? u.bio.trim() : "Ainda não falou nada sobre si.";
      return `
        <div class="beatmap-shelf-card" onclick="window.renderProfileView('${u.id}')" style="padding: 1.25rem; display: flex; align-items: flex-start; gap: 1rem; cursor: pointer;">
          <img src="${u.avatar_url}" style="width: 54px; height: 54px; border-radius: var(--radius-sm); object-fit: cover; border: 2px solid var(--accent-purple);" alt="${u.username}">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <strong style="color: white; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.username}</strong>
              <span class="hierarchy-tag ${role.tagClass}" style="font-size: 0.65rem;">${role.label}</span>
              ${u.is_dev ? '<span class="hierarchy-tag tag-dev" style="font-size:0.65rem;">DEV</span>' : ''}
            </div>
            ${u.discord_tag ? `<div style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 600; margin-top: 0.2rem;">@${u.discord_tag}</div>` : ''}
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.4rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3;">
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

    // Perfil público: NUNCA salva senhas na tabela pública!
    const newUser = {
      id: generatedId,
      username: username,
      email: email,
      discord_tag: discord,
      bio: "",
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
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

  document.addEventListener("DOMContentLoaded", () => app.init());

})();
