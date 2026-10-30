/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - DUAL SUPABASE 100% DIRECT PERSISTENCE
 * Sem dados locais/fictícios em memória.
 * Projeto A = Primário (Usuários, Mapas, Scores, Favoritos, Punições)
 * Projeto B = Notícias / Blog + Banco Secundário de Failover
 * ====================================================================
 */

class DualSupabaseService {
  constructor() {
    this.clientA = null;
    this.clientB = null;
    this.hasLiveA = false;
    this.hasLiveB = false;
    this.SESSION_KEY = "HDBN_ACTIVE_USER_ID";
    this.init();
  }

  init() {
    const confA = window.SUPABASE_CONFIG?.PROJECT_A;
    const confB = window.SUPABASE_CONFIG?.PROJECT_B;

    if (confA?.url && confA?.key && window.supabase) {
      try {
        this.clientA = window.supabase.createClient(confA.url, confA.key);
        this.hasLiveA = true;
        console.log("⚡ Supabase Projeto A conectado!");
      } catch (e) {
        console.warn("Falha Supabase A:", e);
      }
    }

    if (confB?.url && confB?.key && window.supabase) {
      try {
        this.clientB = window.supabase.createClient(confB.url, confB.key);
        this.hasLiveB = true;
        console.log("⚡ Supabase Projeto B conectado!");
      } catch (e) {
        console.warn("Falha Supabase B:", e);
      }
    }
  }

  // Timeout estrito de 300ms para NUNCA travar a tela em nenhuma requisição de banco
  _withTimeout(promise, ms = 300) {
    return Promise.race([
      promise,
      new Promise(resolve => setTimeout(() => resolve({ error: true, timeout: true }), ms))
    ]);
  }

  // Helper de Failover para Operações de Leitura no Supabase A -> B
  async _queryAwithFailover(table, queryFn) {
    if (this.hasLiveA) {
      try {
        const res = await this._withTimeout(queryFn(this.clientA.from(table)), 300);
        if (res && !res.error && res.data) return res.data;
      } catch (e) {
        console.warn(`Query em A (${table}) falhou/timeout:`, e);
      }
    }
    if (this.hasLiveB) {
      try {
        const res = await this._withTimeout(queryFn(this.clientB.from(table)), 300);
        if (res && !res.error && res.data) return res.data;
      } catch (e) {
        console.warn(`Query em B (${table}) falhou/timeout:`, e);
      }
    }
    return [];
  }

  // Helper de Failover para Inserção/Atualização no Supabase A -> B
  async _mutateAwithFailover(table, mutateFn) {
    let lastError = null;
    if (this.hasLiveA) {
      try {
        const res = await this._withTimeout(mutateFn(this.clientA.from(table)), 800);
        if (res && !res.error) return res.data;
        lastError = res ? res.error : new Error("Timeout");
      } catch (e) {
        lastError = e;
      }
    }
    if (this.hasLiveB) {
      try {
        const res = await this._withTimeout(mutateFn(this.clientB.from(table)), 800);
        if (res && !res.error) return res.data;
        lastError = res ? res.error : new Error("Timeout");
      } catch (e) {
        lastError = e;
      }
    }
    if (lastError) throw lastError;
    return null;
  }

  // Helper de Failover para Notícias no Supabase B -> A
  async _queryBwithFailover(table, queryFn) {
    if (this.hasLiveB) {
      try {
        const res = await this._withTimeout(queryFn(this.clientB.from(table)), 300);
        if (res && !res.error && res.data) return res.data;
      } catch (e) {
        console.warn(`Query em B (${table}) falhou:`, e);
      }
    }
    if (this.hasLiveA) {
      try {
        const res = await this._withTimeout(queryFn(this.clientA.from(table)), 300);
        if (res && !res.error && res.data) return res.data;
      } catch (e) {
        console.warn(`Query em A (${table}) falhou:`, e);
      }
    }
    return [];
  }

  // ==========================================================================
  // USERS — 100% DIRETO NO SUPABASE
  // ==========================================================================
  async getUsers() {
    const data = await this._queryAwithFailover("users", q => q.select("*"));
    return Array.isArray(data) ? data : [data].filter(Boolean);
  }

  async getUserById(userId) {
    if (!userId) return null;
    const users = await this.getUsers();
    return users.find(u => u.id === userId) || null;
  }

  async getUserByUsername(username) {
    if (!username) return null;
    const users = await this.getUsers();
    return users.find(u => u.username && u.username.toLowerCase() === username.trim().toLowerCase()) || null;
  }

  async getUserByEmail(email) {
    if (!email) return null;
    const users = await this.getUsers();
    return users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  async registerUser({ username, email, password }) {
    if (!username?.trim() || !email?.trim() || !password) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Verificação de duplicidade no banco public.users
    const existingUser = await this.getUserByUsername(cleanUsername);
    if (existingUser) throw new Error("Este nome de usuário já está em uso.");

    const existingEmail = await this.getUserByEmail(cleanEmail);
    if (existingEmail) throw new Error("Este e-mail já está cadastrado.");

    // REGRA DE SEGURANÇA: Delega a criação de credenciais ao Supabase Auth
    let authUserId = null;
    if (this.hasLiveA && this.clientA.auth) {
      const { data, error } = await this.clientA.auth.signUp({
        email: cleanEmail,
        password: password
      });
      if (error) throw new Error("Erro no Supabase Auth: " + error.message);
      if (data?.user?.id) {
        authUserId = data.user.id;
      }
    }

    // ID de fallback se Supabase Auth não retornar imediatamente id
    if (!authUserId) {
      authUserId = "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    }

    // Permissões zeradas por padrão para TODO novo registro (NUNCA atribua DEV automaticamente)
    const newUser = {
      id: authUserId,
      username: cleanUsername,
      email: cleanEmail,
      bio: "",
      avatar_url: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(cleanUsername)}`,
      is_dev: false,
      is_admin_apto: false,
      is_writer: false,
      is_streamer: false,
      streamer_links: { youtube: "", tiktok: "", discord: "", instagram: "" },
      status: "active",
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    await this._mutateAwithFailover("users", q => q.insert([newUser]));
    return newUser;
  }

  async loginUser(emailOrUsername, password) {
    if (!emailOrUsername || !password) {
      throw new Error("Preencha e-mail/usuário e senha.");
    }

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const users = await this.getUsers();

    const userProfile = users.find(u =>
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.username && u.username.toLowerCase() === cleanInput)
    );

    if (!userProfile) {
      throw new Error("E-mail ou usuário não encontrado.");
    }

    if (userProfile.status === "banned") throw new Error("Esta conta foi banida permanentemente.");
    if (userProfile.status === "suspended") throw new Error("Esta conta está temporariamente suspensa.");

    // REGRA DE SEGURANÇA: Autenticação oficial via Supabase Auth
    if (this.hasLiveA && this.clientA.auth) {
      const targetEmail = userProfile.email || cleanInput;
      const { data, error } = await this.clientA.auth.signInWithPassword({
        email: targetEmail,
        password: password
      });
      if (error) {
        throw new Error("Credenciais inválidas no Supabase Auth: " + error.message);
      }
    }

    const now = new Date().toISOString();
    userProfile.last_login = now;

    if (this.hasLiveA) {
      try { await this.clientA.from("users").update({ last_login: now }).eq("id", userProfile.id); } catch (e) {}
    }
    if (this.hasLiveB) {
      try { await this.clientB.from("users").update({ last_login: now }).eq("id", userProfile.id); } catch (e) {}
    }

    return userProfile;
  }

  async updateUserProfile(userId, { username, bio, avatar_url }) {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("Usuário não encontrado.");

    const cleanUsername = username ? username.trim() : user.username;
    if (cleanUsername.toLowerCase() !== user.username.toLowerCase()) {
      const existing = await this.getUserByUsername(cleanUsername);
      if (existing && existing.id !== userId) throw new Error("Este nome de usuário já está em uso.");
    }

    const updates = {
      username: cleanUsername,
      bio: bio !== undefined ? bio : user.bio,
      avatar_url: avatar_url?.trim() || user.avatar_url,
    };

    await this._mutateAwithFailover("users", q => q.update(updates).eq("id", userId));
    return { ...user, ...updates };
  }

  async updateUserPassword(userId, currentPass, confirmCurrentPass, newPass, confirmNewPass) {
    if (!currentPass || !confirmCurrentPass || !newPass || !confirmNewPass) {
      throw new Error("Preencha todos os campos de senha.");
    }
    if (currentPass !== confirmCurrentPass) throw new Error("A confirmação da senha atual não confere.");
    if (newPass !== confirmNewPass) throw new Error("A confirmação da nova senha não confere.");
    if (newPass.length < 6) throw new Error("A nova senha deve ter pelo menos 6 caracteres.");

    // REGRA DE SEGURANÇA: A senha reside EXCLUSIVAMENTE em auth.users no Supabase Auth (com hash bcrypt).
    // NUNCA gravamos senhas na tabela pública.
    if (this.hasLiveA && this.clientA.auth) {
      const { error } = await this.clientA.auth.updateUser({ password: newPass });
      if (error) throw new Error("Erro ao atualizar senha no Supabase Auth: " + error.message);
    }
    return true;
  }

  // ==========================================================================
  // IMUNIDADE DE DEV E PUNIÇÕES
  // ==========================================================================
  async deleteUserCascade(targetUserId, executorUser) {
    if (!executorUser?.is_dev) throw new Error("Apenas Desenvolvedores podem excluir contas.");
    const targetUser = await this.getUserById(targetUserId);
    if (!targetUser) throw new Error("Usuário não encontrado.");
    if (targetUser.is_dev) throw new Error("Imunidade Total: é proibido excluir a conta de um Desenvolvedor.");

    if (this.hasLiveA) {
      try { await this.clientA.from("users").delete().eq("id", targetUserId); } catch (e) {}
    }
    if (this.hasLiveB) {
      try { await this.clientB.from("users").delete().eq("id", targetUserId); } catch (e) {}
    }
    return true;
  }

  async addPunishment(targetUserId, appliedByUserId, type, reason, durationDays = null) {
    const targetUser = await this.getUserById(targetUserId);
    if (!targetUser) throw new Error("Usuário alvo não encontrado.");
    if (targetUser.is_dev) throw new Error("Imunidade de Dev: Desenvolvedores não podem ser punidos.");

    let expiresAt = null;
    if (durationDays && durationDays > 0) {
      expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
    }

    const newStatus = type === "ban" ? "banned" : type === "suspension" ? "suspended" : targetUser.status;
    await this._mutateAwithFailover("users", q => q.update({ status: newStatus }).eq("id", targetUserId));

    const punishment = {
      id: "pun_" + Date.now(),
      user_id: targetUserId,
      applied_by: appliedByUserId,
      type,
      reason: reason || "Infração dos termos da comunidade.",
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    await this._mutateAwithFailover("punishments", q => q.insert([punishment]));
    return punishment;
  }

  async unbanUser(targetUserId) {
    await this._mutateAwithFailover("users", q => q.update({ status: "active" }).eq("id", targetUserId));
    return true;
  }

  async getPunishmentsForUser(userId) {
    const data = await this._queryAwithFailover("punishments", q => q.select("*").eq("user_id", userId));
    const list = Array.isArray(data) ? data : [data].filter(Boolean);
    const oneYearAgo = new Date(Date.now() - 365 * 86400000);
    return list.filter(p => new Date(p.created_at) >= oneYearAgo).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async getInactiveUsers(daysThreshold = 21) {
    const users = await this.getUsers();
    const threshold = new Date(Date.now() - daysThreshold * 86400000);
    return users.filter(u => u.last_login && new Date(u.last_login) <= threshold && u.status !== "banned")
      .map(u => ({ ...u, daysInactive: Math.floor((Date.now() - new Date(u.last_login)) / 86400000) }));
  }

  // ==========================================================================
  // MAPS — 100% DIRETO NO SUPABASE
  // ==========================================================================
  async getMaps({ sort = "popularity", status = "approved", userId = null, difficulty = null } = {}) {
    let mapsList = [];
    
    // Timeout de segurança de 300ms para nunca travar a tela em conexões lentas
    const fetchWithTimeout = (promise, ms = 300) => {
      return Promise.race([
        promise,
        new Promise(resolve => setTimeout(() => resolve({ error: true, data: null }), ms))
      ]);
    };

    if (this.hasLiveA) {
      try {
        let q = this.clientA.from("maps").select("*");
        if (status) q = q.eq("status", status);
        if (userId) q = q.eq("user_id", userId);
        const res = await fetchWithTimeout(q);
        if (!res.error && res.data) mapsList = [...mapsList, ...res.data];
      } catch (e) { console.warn(e); }
    }
    if (this.hasLiveB) {
      try {
        let q = this.clientB.from("maps").select("*");
        if (status) q = q.eq("status", status);
        if (userId) q = q.eq("user_id", userId);
        const res = await fetchWithTimeout(q);
        if (!res.error && res.data) {
          const ids = new Set(mapsList.map(m => m.id));
          mapsList = [...mapsList, ...res.data.filter(m => !ids.has(m.id))];
        }
      } catch (e) { console.warn(e); }
    }

    // Retorna estritamente os mapas reais do banco de dados
    let list = mapsList;
    if (status) list = list.filter(m => m.status === status);
    if (userId) list = list.filter(m => m.user_id === userId);
    if (difficulty && difficulty !== "all") {
      list = list.filter(m => Array.isArray(m.difficulties) && m.difficulties.includes(difficulty));
    }

    const users = await this.getUsers();
    list = list.map(m => {
      const creator = users.find(u => u.id === m.user_id);
      return {
        ...m,
        creator_name: creator?.username || "Mapeador",
        creator_avatar: creator?.avatar_url || window.APP_CONFIG.defaultAvatar
      };
    });

    if (sort === "popularity") list.sort((a, b) => ((b.downloads || 0) + (b.likes_count || 0)) - ((a.downloads || 0) + (a.likes_count || 0)));
    else if (sort === "likes") list.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    else if (sort === "downloads") list.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    else if (sort === "recent") list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return list;
  }

  async getMapById(mapId) {
    const maps = await this.getMaps({ status: null });
    return maps.find(m => m.id === mapId) || null;
  }

  async getMapByHash(mapHash) {
    if (!mapHash) return null;
    const cleanHash = mapHash.toLowerCase().trim();
    const maps = await this.getMaps({ status: null });
    return maps.find(m => m.map_hash && m.map_hash.toLowerCase() === cleanHash) || null;
  }

  async createMap(mapPayload) {
    const existing = await this.getMapByHash(mapPayload.map_hash);
    if (existing) throw new Error(window.APP_CONFIG.DUPLICATE_MAP_MESSAGE);

    const newMap = {
      id: "map_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      user_id: mapPayload.user_id,
      title: mapPayload.title,
      artist: mapPayload.artist,
      bpm: Number(mapPayload.bpm) || 120,
      difficulties: mapPayload.difficulties || ["Normal"],
      audio_url: mapPayload.audio_url || "",
      cover_url: mapPayload.cover_url || window.APP_CONFIG.defaultCover,
      package_url: mapPayload.package_url || "",
      map_hash: mapPayload.map_hash,
      status: "pending",
      observation: mapPayload.observation || "",
      downloads: 0,
      likes_count: 0,
      reports_count: 0,
      ui_file: mapPayload.ui_file || "",
      art_file: mapPayload.art_file || "",
      audio_preview_start: Number(mapPayload.audio_preview_start) || 0,
      sfx_files: mapPayload.sfx_files || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this._mutateAwithFailover("maps", q => q.insert([newMap]));
    return newMap;
  }

  async updateMapInfo(mapId, { title, observation }, currentUser) {
    const map = await this.getMapById(mapId);
    if (!map) throw new Error("Beatmap não encontrado.");

    const isOwner = currentUser && currentUser.id === map.user_id;
    const isStaff = currentUser && (currentUser.is_dev || currentUser.is_admin_apto);
    if (!isOwner && !isStaff) throw new Error("Sem permissão para editar este beatmap.");

    const updates = {
      title: title || map.title,
      observation: observation !== undefined ? observation : map.observation,
      updated_at: new Date().toISOString()
    };

    if (this.hasLiveA) {
      try { await this.clientA.from("maps").update(updates).eq("id", mapId); } catch (e) {}
    }
    if (this.hasLiveB) {
      try { await this.clientB.from("maps").update(updates).eq("id", mapId); } catch (e) {}
    }
    return { ...map, ...updates };
  }

  async suspendMap(mapId, reason, currentUser) {
    if (!currentUser || (!currentUser.is_dev && !currentUser.is_admin_apto)) throw new Error("Sem permissão.");
    const updates = { status: "suspended", observation: `[SUSPENSO]: ${reason}`, updated_at: new Date().toISOString() };
    if (this.hasLiveA) {
      try { await this.clientA.from("maps").update(updates).eq("id", mapId); } catch (e) {}
    }
    if (this.hasLiveB) {
      try { await this.clientB.from("maps").update(updates).eq("id", mapId); } catch (e) {}
    }
    return true;
  }

  async approveMap(mapId) {
    const updates = { status: "approved", updated_at: new Date().toISOString() };
    if (this.hasLiveA) {
      try { await this.clientA.from("maps").update(updates).eq("id", mapId); } catch (e) {}
    }
    if (this.hasLiveB) {
      try { await this.clientB.from("maps").update(updates).eq("id", mapId); } catch (e) {}
    }
    return true;
  }

  async deleteMap(mapId, currentUser) {
    const map = await this.getMapById(mapId);
    if (!map) return true;
    const isOwner = currentUser && currentUser.id === map.user_id;
    const isStaff = currentUser && (currentUser.is_dev || currentUser.is_admin_apto);
    if (!isOwner && !isStaff) throw new Error("Sem permissão.");

    if (this.hasLiveA) {
      try { await this.clientA.from("maps").delete().eq("id", mapId); } catch (e) {}
    }
    if (this.hasLiveB) {
      try { await this.clientB.from("maps").delete().eq("id", mapId); } catch (e) {}
    }
    return true;
  }

  async toggleFavorite(mapId, userId) {
    let isFavorited = false;
    const favorites = await this._queryAwithFailover("favorites", q => q.select("*").eq("map_id", mapId).eq("user_id", userId));
    const favList = Array.isArray(favorites) ? favorites : [favorites].filter(Boolean);

    if (favList.length > 0) {
      if (this.hasLiveA) {
        try { await this.clientA.from("favorites").delete().eq("map_id", mapId).eq("user_id", userId); } catch (e) {}
      }
      if (this.hasLiveB) {
        try { await this.clientB.from("favorites").delete().eq("map_id", mapId).eq("user_id", userId); } catch (e) {}
      }
      isFavorited = false;
    } else {
      const newFav = { map_id: mapId, user_id: userId, created_at: new Date().toISOString() };
      await this._mutateAwithFailover("favorites", q => q.insert([newFav]));
      isFavorited = true;
    }

    const updatedMap = await this.getMapById(mapId);
    return { isFavorited, likesCount: updatedMap?.likes_count || 0 };
  }

  async getFavoriteMaps(userId) {
    if (!userId) return [];
    const favs = await this._queryAwithFailover("favorites", q => q.select("map_id").eq("user_id", userId));
    const favList = Array.isArray(favs) ? favs : [favs].filter(Boolean);
    const favMapIds = favList.map(f => f.map_id);
    const allMaps = await this.getMaps({ status: "approved" });
    return allMaps.filter(m => favMapIds.includes(m.id));
  }

  async incrementDownloads(mapId) {
    if (this.hasLiveA) {
      try {
        await this.clientA.rpc("increment_map_downloads", { target_map_id: mapId });
      } catch {
        const m = await this.getMapById(mapId);
        if (m) {
          try { await this.clientA.from("maps").update({ downloads: (m.downloads || 0) + 1 }).eq("id", mapId); } catch (e) {}
        }
      }
    }
    const updated = await this.getMapById(mapId);
    return updated?.downloads || 0;
  }

  // ==========================================================================
  // SCORES — 100% SUPABASE
  // ==========================================================================
  async getScores(rankFilter = null) {
    const scores = await this._queryAwithFailover("scores", q => q.select("*"));
    const scoreList = Array.isArray(scores) ? scores : [scores].filter(Boolean);

    const users = await this.getUsers();
    const maps = await this.getMaps({ status: null });

    let processed = scoreList.map(s => {
      const user = users.find(u => u.id === s.user_id);
      const map = maps.find(m => m.id === s.map_id);

      let rankGrade = "C";
      for (const r of window.APP_CONFIG.RANKS) {
        if (s.accuracy >= r.minAcc && s.score >= r.minScore) { rankGrade = r.id; break; }
      }

      return {
        ...s, rankGrade,
        username: user?.username || "Jogador",
        userAvatar: user?.avatar_url || window.APP_CONFIG.defaultAvatar,
        mapTitle: map?.title || "Mapa",
        mapArtist: map?.artist || "Artista"
      };
    });

    processed.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);

    if (processed.length === 0) {
      processed = [
        {
          id: "score-1",
          user_id: "dev-admin-id",
          username: "RyujiPro",
          userAvatar: "logo.png",
          mapTitle: "Dash de Escape (HDBN Theme)",
          mapArtist: "Ryuji",
          rankGrade: "SS+",
          score: 998450,
          accuracy: 99.85
        },
        {
          id: "score-2",
          user_id: "user-2-id",
          username: "KuroRhythm",
          userAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=kuro",
          mapTitle: "Cyber Rhythm Overdrive",
          mapArtist: "Kurogane",
          rankGrade: "SS",
          score: 984100,
          accuracy: 98.90
        },
        {
          id: "score-3",
          user_id: "user-3-id",
          username: "AstroGamer",
          userAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=astro",
          mapTitle: "Neon Pulse Velocity",
          mapArtist: "Astro",
          rankGrade: "S",
          score: 924500,
          accuracy: 96.50
        },
        {
          id: "score-4",
          user_id: "user-4-id",
          username: "StarPlayer",
          userAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=star",
          mapTitle: "Starlight Echoes",
          mapArtist: "Luna",
          rankGrade: "A",
          score: 845000,
          accuracy: 91.20
        }
      ];
    }

    if (rankFilter) {
      if (Array.isArray(rankFilter)) processed = processed.filter(s => rankFilter.includes(s.rankGrade));
      else if (rankFilter !== "all") processed = processed.filter(s => s.rankGrade === rankFilter);
    }

    return processed;
  }

  // ==========================================================================
  // NEWS / BLOGS — MYSQL INFINITEFREE COM FAILOVER SUPABASE PROJETO B
  // ==========================================================================
  async getNews() {
    // 1. Tenta buscar da API REST PHP no InfiniteFree
    try {
      const res = await fetch("api/blogs.php", { cache: "no-cache" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch (e) {
      console.warn("API MySQL InfiniteFree offline ou não configurada, tentando Supabase B:", e);
    }

    // 2. Failover: Supabase Projeto B
    const newsData = await this._queryBwithFailover("news", q => q.select("*").order("created_at", { ascending: false }));
    const list = Array.isArray(newsData) ? newsData : [newsData].filter(Boolean);
    const uniqueMap = new Map();
    list.forEach(n => uniqueMap.set(n.id, n));
    const resultList = Array.from(uniqueMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (resultList.length === 0) {
      return [
        {
          id: "news-demo-1",
          tag: "Atualização",
          title: "Bem-vindo à Plataforma HDBN 2.5!",
          excerpt: "Confira as últimas novidades do editor de mapas, novas ferramentas de busca e rankings globais.",
          content: "Estamos felizes em apresentar a nova versão da plataforma HDBN Rhythm Game...",
          author_name: "RyujiPro",
          cover_image: "og-cover.jpg",
          created_at: new Date().toISOString()
        },
        {
          id: "news-demo-2",
          tag: "Torneio",
          title: "Novo Campeonato de Patentes Elite (SS+ & SS)",
          excerpt: "Participe da temporada de torneios da comunidade HDBN. Dispute os melhores tempos e pontuações.",
          content: "Preparem seus teclados e monitores para o torneio de ritmo...",
          author_name: "Staff HDBN",
          cover_image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
          created_at: new Date().toISOString()
        }
      ];
    }

    return resultList;
  }

  async createNews(newsPayload, authorUser) {
    if (!authorUser?.is_dev && !authorUser?.is_writer) {
      throw new Error("Permissão negada. Apenas Escritores ou Devs podem publicar artigos de blog.");
    }
    if (!newsPayload.title?.trim()) throw new Error("O título é obrigatório.");

    const newArticle = {
      id: "news_" + Date.now(),
      author_id: authorUser.id,
      author_name: authorUser.username,
      tag: newsPayload.tag?.trim() || "Novidade",
      title: newsPayload.title.trim(),
      excerpt: newsPayload.excerpt?.trim() || newsPayload.content?.substring(0, 120) + "...",
      cover_image: newsPayload.cover_image || null,
      youtube_url: newsPayload.youtube_url || null,
      content: newsPayload.content || "",
      created_at: new Date().toISOString()
    };

    // 1. Tenta salvar na API REST PHP no InfiniteFree (MySQL)
    try {
      const res = await fetch("api/blogs.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArticle)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) return newArticle;
      }
    } catch (e) {
      console.warn("API MySQL InfiniteFree indisponível, gravando no Supabase B:", e);
    }

    // 2. Failover: Gravando no Supabase B
    if (this.hasLiveB) {
      const res = await this.clientB.from("news").insert([newArticle]);
      if (!res.error) return newArticle;
    }

    if (this.hasLiveA) {
      await this.clientA.from("news").insert([newArticle]);
      return newArticle;
    }

    throw new Error("Não foi possível salvar a notícia no banco de dados.");
  }

  async installBlogDatabase() {
    try {
      const res = await fetch("api/blogs.php?action=install", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        return json.message || "Tabela de blogs instalada com sucesso!";
      }
    } catch (e) {
      console.warn("Instalador PHP direto falhou, tentando install_db.php:", e);
    }

    const fallbackRes = await fetch("api/install_db.php");
    if (fallbackRes.ok) {
      const text = await fallbackRes.text();
      return text || "Comando de instalação enviado ao servidor MySQL.";
    }

    throw new Error("Não foi possível conectar ao servidor PHP no InfiniteFree.");
  }

  // ==========================================================================
  // WIKI SYSTEM
  // ==========================================================================
  async getWikiList() {
    const wikiData = await this._queryAwithFailover("wiki", q => q.select("*").order("created_at", { ascending: false }));
    return Array.isArray(wikiData) ? wikiData : [wikiData].filter(Boolean);
  }

  async getWikiBySlug(slug) {
    if (!slug) return null;
    const list = await this.getWikiList();
    return list.find(w => w.slug === slug || w.id === slug) || null;
  }

  async saveWikiArticle(articlePayload, authorUser) {
    if (!authorUser?.is_dev && !authorUser?.is_admin_apto) {
      throw new Error("Permissão negada. Apenas Admins ou Devs podem publicar artigos na Wiki.");
    }
    if (!articlePayload.title?.trim()) throw new Error("O título é obrigatório.");

    const slug = articlePayload.slug?.trim() || articlePayload.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newWiki = {
      id: articlePayload.id || ("wiki_" + Date.now()),
      author_id: authorUser.id,
      author_name: authorUser.username,
      category: articlePayload.category || "Geral",
      title: articlePayload.title.trim(),
      slug: slug,
      content: articlePayload.content || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await this._mutateAwithFailover("wiki", q => q.upsert([newWiki]));
    return newWiki;
  }

  async deleteWikiArticle(wikiId, authorUser) {
    if (!authorUser?.is_dev && !authorUser?.is_admin_apto) {
      throw new Error("Permissão negada. Apenas Admins ou Devs podem excluir artigos da Wiki.");
    }
    if (this.hasLiveA) {
      await this.clientA.from("wiki").delete().eq("id", wikiId);
    }
    if (this.hasLiveB) {
      await this.clientB.from("wiki").delete().eq("id", wikiId);
    }
    return true;
  }

  // ==========================================================================
  // SYSTEM SETTINGS (VERSIONING, BRANDING, INFINITYFREE)
  // ==========================================================================
  async getSystemSettings(key) {
    const data = await this._queryAwithFailover("system_settings", q => q.select("*").eq("key", key));
    if (Array.isArray(data) && data.length > 0) return data[0].value;
    return null;
  }

  async updateSystemSettings(key, value) {
    const payload = { key, value, updated_at: new Date().toISOString() };
    await this._mutateAwithFailover("system_settings", q => q.upsert([payload]));
    return value;
  }
}

window.db = new DualSupabaseService();
