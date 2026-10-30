/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - CONFIGURAÇÕES OFICIAIS E CREDENCIAIS
 * ====================================================================
 */

const SUPABASE_CONFIG = {
  PROJECT_A: {
    url: "https://izltwpfhfsuigdteixpl.supabase.co",
    key: "sb_publishable_Y4dAZ1l379h78_Lz_Ke3PA_4cbarrHn"
  },
  PROJECT_B: {
    url: "https://usuoxnbitrbdkctgqsuu.supabase.co",
    key: "sb_publishable_tyH-DrZMHNEhAf3305kgWA_J_B1RuKs"
  }
};

const CLOUDINARY_CONFIG = {
  cloudName: "deln0ozqh",
  uploadPreset: "beatmaps",
  uploadUrl: "https://api.cloudinary.com/v1_1/deln0ozqh/auto/upload",
  folders: {
    audio: "hdbn/audio",
    cover: "hdbn/covers",
    package: "hdbn/packages",
    sfx: "hdbn/sfx",
    news: "hdbn/news"
  }
};

const APP_CONFIG = {
  appName: "HDBN",
  gameName: "HDBN Rhythm Game",
  version: "2.5.0",
  logoImage: "logo.png", // Pode ser substituído por caminho de imagem ou mantido como nulo/texto
  defaultAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=hdbn_default",
  defaultCover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
  socialPreviewDefault: "og-cover.jpg",

  socialLinks: {
    discord: "https://discord.gg/hdbn",
    youtube: "https://youtube.com/@hdbn"
  },

  DUPLICATE_MAP_MESSAGE: "Oops! This beatmap already exists. You cannot publish maps created by other users or publish duplicate maps!",
  DUPLICATE_MAP_REPEATED_WARNING: "Warning: Beatmap already registered. Repeated upload attempts without modifications may result in account suspension.",
  MAP_LOAD_ERROR_MESSAGE: "Oops! Could not load this beatmap, it seems to be incomplete...",

  DOWNLOAD_LINKS: {
    windows: {
      name: "Windows",
      version: "v2.5.0 (64-bit)",
      fileSize: "145 MB",
      url: "https://releases.hdbn.club/hdbn-installer-windows.exe",
      icon: "desktop_windows"
    },
    android: {
      name: "Android",
      version: "v2.5.0 (APK)",
      fileSize: "98 MB",
      url: "https://releases.hdbn.club/hdbn-android.apk",
      icon: "smartphone"
    },
    linux: {
      name: "Linux",
      version: "v2.5.0 (AppImage)",
      fileSize: "135 MB",
      url: "https://releases.hdbn.club/hdbn-linux.AppImage",
      icon: "terminal"
    }
  },

  RANKS: [
    { id: "SS+", label: "SS+", color: "var(--rank-ssp)", minAcc: 99.5, minScore: 950000 },
    { id: "SS",  label: "SS",  color: "var(--rank-ss)",  minAcc: 98.0, minScore: 900000 },
    { id: "S",   label: "S",   color: "var(--rank-s)",   minAcc: 95.0, minScore: 800000 },
    { id: "A",   label: "A",   color: "var(--rank-a)",   minAcc: 90.0, minScore: 700000 },
    { id: "B",   label: "B",   color: "var(--rank-b)",   minAcc: 80.0, minScore: 500000 },
    { id: "C",   label: "C",   color: "var(--rank-c)",   minAcc: 0.0,  minScore: 0 }
  ],

  DIFFICULTIES: ["Easy", "Normal", "Hard", "Insane", "Expert"]
};

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.CLOUDINARY_CONFIG = CLOUDINARY_CONFIG;
window.APP_CONFIG = APP_CONFIG;

// Funções Globais Incondicionais para Modais (execução garantida em qualquer contexto)
window.openAuthModal = function(mode = "login") {
  if (window.app && typeof window.app.openAuthModal === "function") {
    window.app.openAuthModal(mode);
  } else {
    const backdrop = document.getElementById("modal-backdrop");
    const container = document.getElementById("modal-container");
    if (backdrop && container) {
      container.classList.add("auth-split-modal");
      container.innerHTML = `
        <div style="padding:2rem; position:relative; max-width:440px; margin:0 auto;">
          <button class="modal-close-btn" onclick="document.getElementById('modal-backdrop').classList.remove('active')">
            <span class="material-symbols-outlined">close</span>
          </button>
          
          <!-- SELETOR DE ABAS ENTRAR / CADASTRAR-SE -->
          <div style="display:flex; gap:0.5rem; margin-bottom:1.5rem; background:var(--bg-surface); padding:0.25rem; border-radius:var(--radius-md);">
            <button type="button" class="btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}" style="flex:1; padding:0.5rem; font-size:0.85rem;" onclick="window.openAuthModal('login')">
              <span class="material-symbols-outlined" style="font-size:16px;">login</span> Entrar
            </button>
            <button type="button" class="btn ${mode === 'register' ? 'btn-primary' : 'btn-secondary'}" style="flex:1; padding:0.5rem; font-size:0.85rem;" onclick="window.openAuthModal('register')">
              <span class="material-symbols-outlined" style="font-size:16px;">person_add</span> Cadastrar-se
            </button>
          </div>

          ${mode === 'login' ? `
            <form id="auth-login-fallback" style="display:flex; flex-direction:column; gap:0.85rem;">
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem; display:block; text-align:left;">Email ou Usuário</label>
                <input type="text" id="auth-email-fb" required class="search-input-field" placeholder="seu@email.com ou usuario" style="padding:0.65rem 0.85rem;">
              </div>
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem; display:block; text-align:left;">Senha</label>
                <input type="password" id="auth-password-fb" required class="search-input-field" placeholder="Sua senha" style="padding:0.65rem 0.85rem;">
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem; text-align:left;">
                <input type="checkbox" id="auth-remember-fb" checked style="width:16px; height:16px; accent-color:var(--accent-purple);">
                <label for="auth-remember-fb" style="font-size:0.8rem; color:var(--text-secondary); cursor:pointer;">Lembre de mim (30 dias)</label>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.35rem;">
                <span class="material-symbols-outlined">login</span><span>Entrar</span>
              </button>
            </form>
          ` : `
            <form id="auth-register-fallback" style="display:flex; flex-direction:column; gap:0.85rem;">
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem; display:block; text-align:left;">Nome de Usuário</label>
                <input type="text" id="reg-username-fb" required class="search-input-field" placeholder="Seu usuário único" style="padding:0.65rem 0.85rem;">
              </div>
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem; display:block; text-align:left;">Email</label>
                <input type="email" id="reg-email-fb" required class="search-input-field" placeholder="seu@email.com" style="padding:0.65rem 0.85rem;">
              </div>
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem; display:block; text-align:left;">Senha</label>
                <input type="password" id="reg-pass-fb" required class="search-input-field" placeholder="Mínimo 6 caracteres" style="padding:0.65rem 0.85rem;">
              </div>
              <div>
                <label style="font-size:0.8rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem; display:block; text-align:left;">Confirmar Senha</label>
                <input type="password" id="reg-pass-confirm-fb" required class="search-input-field" placeholder="Repita a senha" style="padding:0.65rem 0.85rem;">
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem; text-align:left;">
                <input type="checkbox" id="reg-terms-fb" required style="width:16px; height:16px; accent-color:var(--accent-purple);">
                <label for="reg-terms-fb" style="font-size:0.8rem; color:var(--text-secondary); cursor:pointer;">
                  Li e aceito os <a href="#/termos" onclick="document.getElementById('modal-backdrop')?.classList.remove('active'); window.navigateClean?.('#/termos'); return false;" style="color:var(--accent-purple-light); text-decoration:underline;">Termos e Condições</a>
                </label>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%; margin-top:0.35rem;">
                <span class="material-symbols-outlined">person_add</span><span>Criar Minha Conta</span>
              </button>
            </form>
          `}
        </div>
      `;

      document.getElementById("auth-login-fallback")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const em = document.getElementById("auth-email-fb").value;
        const pw = document.getElementById("auth-password-fb").value;
        try {
          if (window.auth) await window.auth.login(em, pw);
          backdrop.classList.remove("active");
          window.location.reload();
        } catch (err) {
          alert("Erro ao entrar: " + err.message);
        }
      });

      document.getElementById("auth-register-fallback")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const u = document.getElementById("reg-username-fb").value;
        const em = document.getElementById("reg-email-fb").value;
        const pw = document.getElementById("reg-pass-fb").value;
        const pw2 = document.getElementById("reg-pass-confirm-fb").value;
        try {
          if (window.auth) await window.auth.register(u, em, pw, pw2);
          backdrop.classList.remove("active");
          window.location.reload();
        } catch (err) {
          alert("Erro no cadastro: " + err.message);
        }
      });

      backdrop.classList.add("active");
    }
  }
};

window.openSearchBalloon = function() {
  if (window.app && typeof window.app.openSearchBalloon === "function") {
    window.app.openSearchBalloon();
  }
};
