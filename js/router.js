/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - SPA ROUTER ULTIMATE (RESILIENTE & INFALÍVEL)
 * ====================================================================
 * Lida com qualquer variação de hash (#/rota, /#/rota, index.html#/rota),
 * normaliza apelidos (singular/plural), limpa menu mobile e alterna a view em <main id="main-view">.
 * ====================================================================
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.params = {};

    // Escuta alterações de hash e histórico do navegador
    window.addEventListener("hashchange", () => this.handleRouting());
    window.addEventListener("popstate", () => this.handleRouting());
    window.addEventListener("load", () => this.handleRouting());

    // Intercepta cliques globais em qualquer link local
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Ignora links externos (http, https, mailto) ou com target="_blank"
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || link.target === "_blank") {
        return;
      }

      // Intercepta navegação local (/publicar, #/publicar, /#/publicar)
      if (href.startsWith("/") || href.startsWith("#") || href.includes("#/")) {
        e.preventDefault();
        this.navigate(href);
      }
    });
  }

  register(path, handler) {
    const normalized = (path || "/").toLowerCase().trim();
    this.routes[normalized] = handler;
  }

  /**
   * Extrai de forma limpa e infalível a rota pura (ex: /download, /populares)
   * a partir de qualquer string de URL (/#/download, index.html#/downloads, etc.)
   */
  parseRoute(input) {
    let str = "";
    if (typeof input === "string" && input.trim().length > 0) {
      str = input.trim();
    } else if (typeof window !== "undefined" && window.location && typeof window.location.hash === "string" && window.location.hash.trim().length > 0) {
      str = window.location.hash.trim();
    } else if (typeof window !== "undefined" && window.location && typeof window.location.href === "string") {
      str = window.location.href.trim();
    }

    // Extrai a porção após o último '#' se houver
    if (str.includes("#")) {
      str = str.substring(str.lastIndexOf("#") + 1);
    } else {
      if (str.includes("/")) {
        str = str.substring(str.lastIndexOf("/"));
        if (str.endsWith("index.html") || str === "/" || str.startsWith("/index.html")) {
          str = "/";
        }
      }
    }

    if (!str.startsWith("/")) {
      str = "/" + str;
    }

    while (str.startsWith("//")) {
      str = str.slice(1);
    }

    const [cleanPath] = str.split("?");

    // Remove barra final para rotas secundárias (ex: /download/ -> /download)
    let finalPath = cleanPath;
    if (finalPath.length > 1 && finalPath.endsWith("/")) {
      finalPath = finalPath.slice(0, -1);
    }

    return finalPath || "/";
  }

  /**
   * Navega para a rota e atualiza a barra de endereços no formato #/rota
   */
  navigate(path) {
    const cleanRoute = this.parseRoute(path);
    const targetHash = "#" + (cleanRoute.startsWith("/") ? cleanRoute : "/" + cleanRoute);

    try {
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    } catch (e) {}

    // Oculta menu mobile se estivesse aberto
    if (window.app && typeof window.app.closeMobileMenu === "function") {
      window.app.closeMobileMenu();
    }

    // Despacho SÍNCRONO E IMEDIATO para renderizar a view sem esperar nada
    if (window.app) {
      const norm = cleanRoute.toLowerCase().trim();
      try {
        if (norm === "/download" || norm === "/downloads" || norm === "/instalar") window.app.renderDownloadView();
        else if (norm === "/populares" || norm === "/popular") window.app.renderPopularesView();
        else if (norm === "/ranking" || norm === "/rankings" || norm === "/rank") window.app.renderRankingView();
        else if (norm === "/rank-pro") window.app.renderRankProView();
        else if (norm === "/comunidade" || norm === "/community") window.app.renderCommunityView();
        else if (norm === "/wiki") window.app.renderWikiView();
        else if (norm === "/blog" || norm === "/noticias") window.app.renderBlogView();
        else if (norm === "/publicar" || norm === "/publish" || norm === "/upload") window.app.renderPublishView();
        else if (norm === "/admin" || norm === "/dev") window.app.renderAdminView();
        else if (norm === "/apoiar" || norm === "/support") window.app.renderSupportView();
        else if (norm === "/" || norm === "" || norm === "/index.html") window.app.renderHomeView();
      } catch (err) {
        console.warn("Direct render warning:", err);
      }
    }

    // Executa a troca de rota completa no corpo da página
    this.handleRouting();
  }

  updateOpenGraph({ title, description, image, url }) {
    document.title = title || "HDBN — Jogo de Ritmo";

    const setMeta = (property, content) => {
      let tag = document.querySelector(`meta[property='${property}']`) || document.querySelector(`meta[name='${property}']`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(property.startsWith("og:") ? "property" : "name", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMeta("og:title", title || "HDBN — Jogo de Ritmo");
    setMeta("og:description", description || "Olhe os principais mapas da comunidade HDBN");
    setMeta("og:image", image || `${window.location.origin}/og-cover.jpg`);
    setMeta("og:url", url || window.location.href);
  }

  start() {
    this.handleRouting();
  }

  async handleRouting() {
    // Garante fechamento de menus ou gavetas ativas
    if (window.app && typeof window.app.closeMobileMenu === "function") {
      window.app.closeMobileMenu();
    }

    const pathPart = this.parseRoute();
    const normalizedPath = pathPart.toLowerCase().trim();

    let matchedHandler = null;
    this.params = {};

    // 1) Busca rota com correspondência exata
    if (this.routes[normalizedPath]) {
      matchedHandler = this.routes[normalizedPath];
    } else if (normalizedPath === "" || normalizedPath === "/" || normalizedPath === "/index.html") {
      matchedHandler = this.routes["/"];
    }

    // 2) Busca rota com parâmetros dinâmicos (:id, :slug, etc.)
    if (!matchedHandler) {
      const actualParts = normalizedPath.split("/");

      for (const pattern in this.routes) {
        if (!pattern.includes(":")) continue;

        const patternParts = pattern.split("/");
        if (patternParts.length !== actualParts.length) continue;

        let match = true;
        const extracted = {};

        for (let i = 0; i < patternParts.length; i++) {
          if (patternParts[i].startsWith(":")) {
            extracted[patternParts[i].slice(1)] = decodeURIComponent(actualParts[i]);
          } else if (patternParts[i] !== actualParts[i]) {
            match = false;
            break;
          }
        }

        if (match) {
          matchedHandler = this.routes[pattern];
          this.params = extracted;
          break;
        }
      }
    }

    // Rola para o topo do documento imediatamente
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Atualiza estados ativos dos links (.active)
    document.querySelectorAll(".nav-link, .mobile-nav-link, .mobile-accordion-link, .footer-link").forEach(link => {
      const href = link.getAttribute("href") || "";
      const linkPath = this.parseRoute(href).toLowerCase().trim();

      if (linkPath === normalizedPath || (linkPath === "/" && (normalizedPath === "" || normalizedPath === "/"))) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Renderiza a visão no elemento <main id="main-view">
    if (matchedHandler) {
      this.currentRoute = normalizedPath;
      try {
        await matchedHandler(this.params);
      } catch (err) {
        console.error("[Router Execution Error]", normalizedPath, err);
      }
    } else {
      if (window.app) {
        if (normalizedPath === "/download" || normalizedPath === "/downloads" || normalizedPath === "/instalar") await window.app.renderDownloadView();
        else if (normalizedPath === "/populares" || normalizedPath === "/popular") await window.app.renderPopularesView();
        else if (normalizedPath === "/ranking" || normalizedPath === "/rankings" || normalizedPath === "/rank") await window.app.renderRankingView();
        else if (normalizedPath === "/rank-pro") await window.app.renderRankProView();
        else if (normalizedPath === "/comunidade" || normalizedPath === "/community") await window.app.renderCommunityView();
        else if (normalizedPath === "/wiki") await window.app.renderWikiView();
        else if (normalizedPath === "/blog" || normalizedPath === "/noticias") await window.app.renderBlogView();
        else if (normalizedPath === "/publicar" || normalizedPath === "/publish" || normalizedPath === "/upload") await window.app.renderPublishView();
        else if (normalizedPath === "/admin" || normalizedPath === "/dev") await window.app.renderAdminView();
        else if (normalizedPath === "/apoiar" || normalizedPath === "/support") await window.app.renderSupportView();
        else await window.app.renderHomeView();
      }
    }
  }
}

window.router = new Router();
