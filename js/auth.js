/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - AUTHENTICATION SERVICE (SUPABASE AUTH)
 * Security Specification: Delegates ALL password & authentication
 * operations strictly to Supabase Auth (auth.users).
 * User profiles reside in public.users linked via FK id -> auth.users.id.
 * Synergy: Admin + Dev role permissions merged. Streamer role supported.
 * ====================================================================
 */

class AuthService {
  constructor() {
    this.SESSION_KEY = "HDBN_ACTIVE_USER_ID";
    this.currentUser = null;
    this.listeners = [];
    this._ready = false;
    this._init();
  }

  async _init() {
    // Escuta mudanças de auth em tempo real no Supabase
    if (window.db?.clientA?.auth) {
      window.db.clientA.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await this._syncUserSession(session.user.id);
        } else {
          this.currentUser = null;
          try { localStorage.removeItem(this.SESSION_KEY); } catch (e) {}
          this.notify();
        }
      });
    }

    let savedUserId = null;
    try { savedUserId = localStorage.getItem(this.SESSION_KEY); } catch (e) {}
    if (savedUserId) {
      try {
        await this._syncUserSession(savedUserId);
      } catch (e) {
        console.warn("Erro ao restaurar sessão:", e);
      }
    }

    this._ready = true;
    this.notify();
  }

  async _syncUserSession(userId) {
    const profile = await window.db.getUserById(userId);
    if (profile) {
      this.currentUser = profile;
      try { localStorage.setItem(this.SESSION_KEY, profile.id); } catch (e) {}
    } else {
      this.currentUser = null;
      try { localStorage.removeItem(this.SESSION_KEY); } catch (e) {}
    }
    this.notify();
  }

  isReady() { return this._ready; }
  getCurrentUser() { return this.currentUser; }
  isLoggedIn() { return !!this.currentUser; }
  
  // ADMIN + DEV SYNERGY: Devs e Admins possuem autoridade técnica e administrativa total
  isDev() { return !!(this.currentUser?.is_dev); }
  isAdmin() { return !!(this.currentUser?.is_admin_apto || this.currentUser?.is_dev); }
  isWriter() { return !!(this.currentUser?.is_writer || this.currentUser?.is_dev || this.currentUser?.is_admin_apto); }
  isStreamer() { return !!(this.currentUser?.is_streamer); }

  async login(emailOrUser, password) {
    if (!emailOrUser || !password) throw new Error("Preencha o e-mail/usuário e a senha.");
    const user = await window.db.loginUser(emailOrUser, password);
    this.currentUser = user;
    try { localStorage.setItem(this.SESSION_KEY, user.id); } catch (e) {}
    this.notify();
    return user;
  }

  async register(username, email, password, confirmPassword) {
    if (!username || !email || !password || !confirmPassword) {
      throw new Error("Preencha todos os campos obrigatórios.");
    }
    if (password !== confirmPassword) throw new Error("As senhas não conferem.");
    if (password.length < 3) throw new Error("A senha deve ter pelo menos 3 caracteres.");

    const newUser = await window.db.registerUser({ username, email, password });
    this.currentUser = newUser;
    try { localStorage.setItem(this.SESSION_KEY, newUser.id); } catch (e) {}
    this.notify();
    return newUser;
  }

  async logout() {
    if (window.db?.clientA?.auth) {
      try { await window.db.clientA.auth.signOut(); } catch (e) {}
    }
    this.currentUser = null;
    try { localStorage.removeItem(this.SESSION_KEY); } catch (e) {}
    this.notify();
  }

  onAuthChange(callback) { this.listeners.push(callback); }

  notify() {
    for (const cb of this.listeners) {
      try { cb(this.currentUser); } catch (err) { console.error("Auth listener error:", err); }
    }
  }
}

window.auth = new AuthService();
