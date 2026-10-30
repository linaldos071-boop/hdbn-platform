/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - ADVANCED DUAL-FILTER SEARCH SYSTEM
 * Requirement 7:
 * - Search categories: "maps" vs "users" (Artists/Users).
 * - When "maps" is selected: displays beatmap search results exclusively.
 * - When "users" is selected: displays user profile search results exclusively.
 * ====================================================================
 */

class SearchService {
  constructor() {
    this.category = "maps"; // "maps" | "users"
    this.selectedDifficulties = new Set();
  }

  levenshteinDistance(str1, str2) {
    const s1 = (str1 || "").toLowerCase();
    const s2 = (str2 || "").toLowerCase();
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[len1][len2];
  }

  computeFuzzyScore(targetText, queryText) {
    const target = (targetText || "").toLowerCase().trim();
    const query = (queryText || "").toLowerCase().trim();

    if (!query) return 100;
    if (target === query) return 1000;
    if (target.startsWith(query)) return 500 + (query.length / target.length) * 100;
    if (target.includes(query)) return 300 + (query.length / target.length) * 100;

    const maxLen = Math.max(target.length, query.length);
    if (maxLen === 0) return 0;
    const distance = this.levenshteinDistance(target, query);
    const ratio = (1 - distance / maxLen) * 100;

    const targetTokens = target.split(/[\s\-_]+/);
    const queryTokens = query.split(/[\s\-_]+/);
    let tokenBonus = 0;

    for (const qToken of queryTokens) {
      if (!qToken) continue;
      for (const tToken of targetTokens) {
        if (tToken === qToken) tokenBonus += 150;
        else if (tToken.includes(qToken)) tokenBonus += 80;
        else {
          const tDist = this.levenshteinDistance(tToken, qToken);
          const tMax = Math.max(tToken.length, qToken.length);
          if (tMax > 0 && tDist <= 2) {
            tokenBonus += (1 - tDist / tMax) * 60;
          }
        }
      }
    }

    return ratio + tokenBonus;
  }

  async search(query = "", options = {}) {
    const category = options.category || this.category || "maps";
    const cleanQuery = (query || "").trim();

    if (category === "users") {
      // BUSCA EXCLUSIVA DE ARTISTAS E USUÁRIOS
      const users = await window.db.getUsers();
      if (!cleanQuery) return users.map(u => ({ ...u, _type: "user" }));

      const scoredUsers = [];
      for (const u of users) {
        const scoreUser = this.computeFuzzyScore(u.username, cleanQuery);
        const scoreBio = this.computeFuzzyScore(u.bio || "", cleanQuery);
        const maxScore = Math.max(scoreUser, scoreBio);

        if (maxScore >= 45 || u.username.toLowerCase().includes(cleanQuery.toLowerCase())) {
          scoredUsers.push({ user: { ...u, _type: "user" }, score: maxScore });
        }
      }
      return scoredUsers.sort((a, b) => b.score - a.score).map(r => r.user);
    }

    // BUSCA EXCLUSIVA DE BEATMAPS
    const difficulties = options.difficulties || Array.from(this.selectedDifficulties);
    let maps = await window.db.getMaps({ status: "approved" });

    if (difficulties && difficulties.length > 0) {
      maps = maps.filter(m => 
        Array.isArray(m.difficulties) && difficulties.some(d => m.difficulties.includes(d))
      );
    }

    if (!cleanQuery) {
      return maps
        .sort((a, b) => ((b.downloads + b.likes_count) - (a.downloads + a.likes_count)))
        .map(m => ({ ...m, _type: "map" }));
    }

    const scoredMaps = [];
    for (const map of maps) {
      const scoreTitle = this.computeFuzzyScore(map.title, cleanQuery);
      const scoreArtist = this.computeFuzzyScore(map.artist, cleanQuery);
      const maxScore = Math.max(scoreTitle, scoreArtist);
      const isExactMatch = 
        map.artist.toLowerCase() === cleanQuery.toLowerCase() || 
        map.title.toLowerCase() === cleanQuery.toLowerCase();

      if (isExactMatch || maxScore >= 45) {
        scoredMaps.push({
          map: { ...map, _type: "map" },
          score: maxScore,
          isExactMatch
        });
      }
    }

    scoredMaps.sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      return b.score - a.score;
    });

    return scoredMaps.map(r => r.map);
  }
}

// Instância global singleton
window.searchService = new SearchService();
