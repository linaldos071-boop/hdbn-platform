/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - DEV ADMIN PANEL CONTROLLER
 * Requirement 3: Admin + Dev Synergy merged (full technical & administrative authority)
 * Management: Versioning links (Android, Windows, Linux), Dynamic Branding,
 * Streamers, Moderation, InfinityFree MySQL setup & JSON Backups.
 * ====================================================================
 */

class AdminService {
  constructor() {
    this.currentSection = "new-accounts";
  }

  setSection(sectionId) {
    this.currentSection = sectionId;
  }

  checkDevAccess() {
    // SYNERGY: Admin + Dev possuem permissão total
    return window.auth.isAdmin();
  }

  async getAdminStats() {
    let pendingMapsList = [];
    let allMapsList = [];
    let usersList = [];
    let inactiveUsersList = [];
    let reportedCount = 0;

    try { pendingMapsList = await window.db.getMaps({ status: "pending" }); } catch (e) {}
    try { allMapsList = await window.db.getMaps({ status: null }); } catch (e) {}
    try { usersList = await window.db.getUsers(); } catch (e) {}
    try { inactiveUsersList = await window.db.getInactiveUsers(21); } catch (e) {}

    try {
      if (window.db.clientA) {
        const res = await window.db.clientA.from("reports").select("id");
        if (!res.error && res.data) reportedCount = res.data.length;
      }
    } catch (e) {}

    return {
      pendingMaps: pendingMapsList.length,
      allMapsCount: allMapsList.length,
      totalUsers: usersList.length,
      newAccounts: usersList.length,
      inactiveUsers: inactiveUsersList.length,
      reportedMaps: reportedCount,
      totalPunishments: 0
    };
  }

  async approveMap(mapId) {
    return window.db.approveMap(mapId);
  }

  async suspendMap(mapId, reason) {
    return window.db.suspendMap(mapId, reason, window.auth.getCurrentUser());
  }

  async punishUser(userId, type, reason, durationDays) {
    const currentUser = window.auth.getCurrentUser();
    return window.db.addPunishment(userId, currentUser ? currentUser.id : "sys", type, reason, durationDays);
  }

  async setStreamerRole(userId, isStreamer, socialLinks = {}) {
    if (!this.checkDevAccess()) throw new Error("Acesso negado.");
    if (window.db.clientA) {
      await window.db.clientA.from("users").update({
        is_streamer: isStreamer,
        streamer_links: socialLinks
      }).eq("id", userId);
    }
    return true;
  }

  async unbanUser(userId) {
    return window.db.unbanUser(userId);
  }

  async deleteUser(userId) {
    return window.db.deleteUserCascade(userId, window.auth.getCurrentUser());
  }

  async ignoreUser(userId) {
    if (window.db.clientA) {
      try {
        await window.db.clientA.from("users").update({ last_login: new Date().toISOString() }).eq("id", userId);
      } catch (e) {}
    }
  }

  async getInactiveUsersList() {
    return window.db.getInactiveUsers(21);
  }

  async saveDownloadSettings(downloadPayload) {
    if (!this.checkDevAccess()) throw new Error("Acesso negado.");
    return window.db.updateSystemSettings("downloads", downloadPayload);
  }

  async saveBrandingSettings(brandingPayload) {
    if (!this.checkDevAccess()) throw new Error("Acesso negado.");
    return window.db.updateSystemSettings("branding", brandingPayload);
  }

  async saveInfinityFreeSettings(infinityPayload) {
    if (!this.checkDevAccess()) throw new Error("Acesso negado.");
    return window.db.updateSystemSettings("infinityfree", infinityPayload);
  }

  async exportBackup() {
    try {
      const users = await window.db.getUsers();
      const maps = await window.db.getMaps({ status: null });
      const dump = {
        users,
        maps,
        exported_at: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(dump, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hdbn_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Erro ao exportar backup:", err);
    }
  }

  async importBackup(file) {
    if (!file) return;
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.users && Array.isArray(data.users)) {
      for (const u of data.users) {
        try {
          await window.db._mutateAwithFailover("users", q => q.upsert([u]));
        } catch (e) {}
      }
    }
    if (data.maps && Array.isArray(data.maps)) {
      for (const m of data.maps) {
        try {
          await window.db._mutateAwithFailover("maps", q => q.upsert([m]));
        } catch (e) {}
      }
    }
    return true;
  }
}

window.adminService = new AdminService();