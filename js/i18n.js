/**
 * ====================================================================
 * HDBN RHYTHM GAME PLATFORM - MULTI-LANGUAGE (i18n) MODULE
 * Auto-detection of browser language (EN, PT, ES, JA). Fallback: EN.
 * Scope: Homepage (/), Popular (/populares), Global Rank (/rank-global),
 * Pro Rank (/rank-pro), Community (/comunidade), Publish (/publicar).
 * ====================================================================
 */

class I18nService {
  constructor() {
    this.STORAGE_KEY = "HDBN_LANG_CHOICE";
    this.supportedLangs = ["en", "pt", "es", "ja"];
    this.currentLang = this._detectLanguage();
    this.listeners = [];

    const translations = {
      en: {
        nav_home: "Home",
        nav_install: "Install",
        nav_popular: "Popular",
        nav_global_ranks: "Global Ranks",
        nav_rank_pro: "Rank Pro",
        nav_community: "Community",
        nav_publish: "Publish",
        nav_wiki: "Wiki",
        nav_blog: "Blog",
        nav_search: "Search",
        nav_signin: "Sign In",
        nav_dev_panel: "Dev Panel",

        hero_title: "HDBN Rhythm Game",
        hero_tag: "Official Rhythm Game",
        hero_desc: "The dynamic rhythm game for the community. Create beatmaps with the editor, export as .hbn, and compete for top ranks on global leaderboards.",
        hero_btn_install: "Install Game",
        hero_btn_support: "Support Project",

        section_highlights: "Community Highlights",
        section_most_liked: "Most Liked",
        section_most_downloaded: "Most Downloaded",
        section_news: "Blogs & News",
        section_view_more: "View more",
        section_loading: "Loading...",

        rank_pro_title: "Rank Pro",
        rank_pro_subtitle: "(Elite Ranks: SS+, SS, S, A)",
        global_rank_title: "Global Leaderboards",
        community_title: "HDBN Community",
        community_featured_maps: "Featured Beatmaps",

        publish_title: "Publish Beatmap (.hbn)",
        publish_subtitle: "Upload your HDBN editor package. Information from .info will be extracted automatically.",
        publish_dropzone_title: "Drag your .hbn file here",
        publish_dropzone_subtitle: "or click the button below",
        publish_btn_select: "Select .hbn File",
        publish_label_title: "Title:",
        publish_label_artist: "Artist:",
        publish_label_bpm: "BPM:",
        publish_label_diff: "Difficulties:",
        publish_label_cover: "Cover:",
        publish_notice: "Moderation Queue: The map will remain pending until approved by a moderator.",
        publish_btn_submit: "Publish Beatmap",
        publish_login_required_title: "Sign In to Publish",
        publish_login_required_desc: "You must be signed in to upload .hbn beatmaps.",

        search_toggle_maps: "Maps",
        search_toggle_users: "Artists / Users",
        search_input_placeholder_maps: "Search beatmaps by title or artist...",
        search_input_placeholder_users: "Search mappers or users...",
        search_no_results: "No items found."
      },
      pt: {
        nav_home: "Início",
        nav_install: "Instalar",
        nav_popular: "Populares",
        nav_global_ranks: "Rank Globais",
        nav_rank_pro: "Rank Pro",
        nav_community: "Comunidade",
        nav_publish: "Publicar",
        nav_wiki: "Wiki",
        nav_blog: "Blog",
        nav_search: "Buscar",
        nav_signin: "Entrar",
        nav_dev_panel: "Painel Dev",

        hero_title: "HDBN Rhythm Game",
        hero_tag: "Jogo de Ritmo Oficial",
        hero_desc: "O jogo de ritmo dinâmico para a comunidade. Crie beatmaps com o editor, exporte como .hbn e dispute as patentes mais altas nos rankings globais.",
        hero_btn_install: "Instalar o Jogo",
        hero_btn_support: "Apoiar Projeto",

        section_highlights: "Destaques da Comunidade",
        section_most_liked: "Mais Favoritados",
        section_most_downloaded: "Mais Baixados",
        section_news: "Blogs & Novidades",
        section_view_more: "Ver mais",
        section_loading: "Carregando...",

        rank_pro_title: "Rank Pro",
        rank_pro_subtitle: "(Patentes de Elite: SS+, SS, S, A)",
        global_rank_title: "Classificação Global",
        community_title: "Comunidade HDBN",
        community_featured_maps: "Mapas em Destaque",

        publish_title: "Publicar Beatmap (.hbn)",
        publish_subtitle: "Carregue o pacote exportado pelo editor HDBN. As informações do .info serão extraídas automaticamente.",
        publish_dropzone_title: "Arraste o arquivo .hbn aqui",
        publish_dropzone_subtitle: "ou clique no botão abaixo",
        publish_btn_select: "Selecionar Arquivo .hbn",
        publish_label_title: "Título:",
        publish_label_artist: "Artista:",
        publish_label_bpm: "BPM:",
        publish_label_diff: "Dificuldades:",
        publish_label_cover: "Capa:",
        publish_notice: "Aprovação Prévia: O mapa ficará como pending até um moderador aprovar.",
        publish_btn_submit: "Publicar Beatmap",
        publish_login_required_title: "Faça Login para Publicar",
        publish_login_required_desc: "Você precisa estar autenticado para enviar beatmaps .hbn.",

        search_toggle_maps: "Mapas",
        search_toggle_users: "Artistas / Usuários",
        search_input_placeholder_maps: "Pesquisar beatmaps por título ou artista...",
        search_input_placeholder_users: "Pesquisar criadores ou usuários...",
        search_no_results: "Nenhum item encontrado."
      },
      es: {
        nav_home: "Inicio",
        nav_install: "Instalar",
        nav_popular: "Populares",
        nav_global_ranks: "Rango Global",
        nav_rank_pro: "Rank Pro",
        nav_community: "Comunidad",
        nav_publish: "Publicar",
        nav_wiki: "Wiki",
        nav_blog: "Blog",
        nav_search: "Buscar",
        nav_signin: "Iniciar Sesión",
        nav_dev_panel: "Panel Dev",

        hero_title: "HDBN Rhythm Game",
        hero_tag: "Juego de Ritmo Oficial",
        hero_desc: "El juego de ritmo dinámico para la comunidad. Crea beatmaps con el editor, expórtalos como .hbn y compite por los puestos más altos en las clasificaciones globales.",
        hero_btn_install: "Instalar Juego",
        hero_btn_support: "Apoyar Proyecto",

        section_highlights: "Destacados de la Comunidad",
        section_most_liked: "Más Favoritos",
        section_most_downloaded: "Más Descargados",
        section_news: "Blogs y Noticias",
        section_view_more: "Ver más",
        section_loading: "Cargando...",

        rank_pro_title: "Rank Pro",
        rank_pro_subtitle: "(Rangos Elite: SS+, SS, S, A)",
        global_rank_title: "Clasificación Global",
        community_title: "Comunidad HDBN",
        community_featured_maps: "Beatmaps Destacados",

        publish_title: "Publicar Beatmap (.hbn)",
        publish_subtitle: "Sube el paquete exportado por el editor HDBN. La información del archivo .info se extraerá automáticamente.",
        publish_dropzone_title: "Arrastra el archivo .hbn aquí",
        publish_dropzone_subtitle: "o haz clic en el botón de abajo",
        publish_btn_select: "Seleccionar Archivo .hbn",
        publish_label_title: "Título:",
        publish_label_artist: "Artista:",
        publish_label_bpm: "BPM:",
        publish_label_diff: "Dificultades:",
        publish_label_cover: "Portada:",
        publish_notice: "Cola de Moderación: El beatmap estará en estado pendiente hasta ser revisado por un moderador.",
        publish_btn_submit: "Publicar Beatmap",
        publish_login_required_title: "Inicia Sesión para Publicar",
        publish_login_required_desc: "Debes iniciar sesión para subir beatmaps .hbn.",

        search_toggle_maps: "Mapas",
        search_toggle_users: "Artistas / Usuarios",
        search_input_placeholder_maps: "Buscar beatmaps por título o artista...",
        search_input_placeholder_users: "Buscar creadores o usuarios...",
        search_no_results: "No se encontraron elementos."
      },
      ja: {
        nav_home: "ホーム",
        nav_install: "インストール",
        nav_popular: "人気",
        nav_global_ranks: "グローバルランク",
        nav_rank_pro: "ランクプロ",
        nav_community: "コミュニティ",
        nav_publish: "投稿する",
        nav_wiki: "Wiki",
        nav_blog: "ブログ",
        nav_search: "検索",
        nav_signin: "ログイン",
        nav_dev_panel: "開発パネル",

        hero_title: "HDBN Rhythm Game",
        hero_tag: "公式リズムゲーム",
        hero_desc: "コミュニティのためのダイナミックなリズムゲーム。エディターでビートマップを作成し、.hbnとしてエクスポートしてグローバルランキングのトップを目指そう。",
        hero_btn_install: "ゲームをインストール",
        hero_btn_support: "プロジェクトを支援",

        section_highlights: "コミュニティハイライト",
        section_most_liked: "高評価マップ",
        section_most_downloaded: "最多ダウンロード",
        section_news: "ブログ＆ニュース",
        section_view_more: "もっと見る",
        section_loading: "読み込み中...",

        rank_pro_title: "ランクプロ",
        rank_pro_subtitle: "（エリートランク：SS+、SS、S、A）",
        global_rank_title: "グローバルリーダーボード",
        community_title: "HDBN コミュニティ",
        community_featured_maps: "フィーチャービートマップ",

        publish_title: "ビートマップ投稿 (.hbn)",
        publish_subtitle: "HDBNエディターでエクスポートしたパッケージをアップロードしてください。.infoの情報が自動的に抽出されます。",
        publish_dropzone_title: "ここに .hbn ファイルをドロップ",
        publish_dropzone_subtitle: "または下のボタンをクリック",
        publish_btn_select: ".hbn ファイルを選択",
        publish_label_title: "タイトル:",
        publish_label_artist: "アーティスト:",
        publish_label_bpm: "BPM:",
        publish_label_diff: "難易度:",
        publish_label_cover: "カバー画像:",
        publish_notice: "モデレーション待ち: モデレーターの承認までマップは「pending」状態になります。",
        publish_btn_submit: "ビートマップを投稿",
        publish_login_required_title: "投稿するにはログインしてください",
        publish_login_required_desc: ".hbnビートマップをアップロードするにはログインが必要です。",

        search_toggle_maps: "マップ",
        search_toggle_users: "アーティスト / ユーザー",
        search_input_placeholder_maps: "タイトルまたはアーティストで検索...",
        search_input_placeholder_users: "製作者またはユーザーを検索...",
        search_no_results: "該当する項目が見つかりません。"
      }
    };

    this.translations = translations;
  }

  _detectLanguage() {
    let saved = null;
    try {
      saved = localStorage.getItem(this.STORAGE_KEY);
    } catch (e) {}
    if (saved && this.supportedLangs.includes(saved)) return saved;

    let navLang = "";
    try {
      navLang = (navigator.language || navigator.userLanguage || "").toLowerCase();
    } catch (e) {}

    if (navLang.startsWith("pt")) return "pt";
    if (navLang.startsWith("es")) return "es";
    if (navLang.startsWith("ja")) return "ja";
    if (navLang.startsWith("en")) return "en";

    // Regra de Fallback: Inglês
    return "en";
  }

  getLang() { return this.currentLang; }

  setLang(lang) {
    if (!this.supportedLangs.includes(lang)) lang = "en";
    this.currentLang = lang;
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch (e) {}
    this.notify();
  }

  t(key) {
    const dict = this.translations[this.currentLang] || this.translations.en;
    return dict[key] || this.translations.en[key] || key;
  }

  onLangChange(cb) { this.listeners.push(cb); }

  notify() {
    this.listeners.forEach(cb => {
      try { cb(this.currentLang); } catch (e) { console.error("i18n listener error:", e); }
    });
  }
}

window.i18n = new I18nService();
