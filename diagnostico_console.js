/**
 * HDBN — SCRIPT DE DIAGNÓSTICO SUPABASE
 * Cole este código inteiro no Console do Navegador (F12 → Console)
 * enquanto o site estiver aberto, para testar a conexão.
 */
(async function diagnosticoHDBN() {
  console.log("=== DIAGNÓSTICO HDBN SUPABASE ===");

  // 1. Verificar se o Supabase está inicializado
  if (!window.db || !window.db.supabase) {
    console.error("❌ window.db ou window.db.supabase não encontrado! O script não carregou corretamente.");
    return;
  }
  console.log("✅ window.db.supabase inicializado:", !!window.db.supabase);

  // 2. Testar leitura da tabela beatmaps
  try {
    const { data: bmaps, error: bmErr } = await window.db.supabase
      .from("beatmaps").select("id, title").limit(3);
    if (bmErr) console.error("❌ Leitura beatmaps:", bmErr.message, bmErr.code);
    else console.log("✅ Beatmaps lidos do Supabase:", bmaps?.length, "registros:", bmaps);
  } catch(e) { console.error("❌ Exceção beatmaps:", e); }

  // 3. Testar leitura da tabela users
  try {
    const { data: usrs, error: usrErr } = await window.db.supabase
      .from("users").select("id, username, email").limit(5);
    if (usrErr) console.error("❌ Leitura users:", usrErr.message, usrErr.code);
    else console.log("✅ Users lidos do Supabase:", usrs?.length, "registros:", usrs);
  } catch(e) { console.error("❌ Exceção users:", e); }

  // 4. Testar INSERT na tabela users
  const testUUID = crypto.randomUUID();
  const testUser = {
    id: testUUID,
    username: "diag_test_" + Date.now(),
    email: "diag_" + Date.now() + "@hdbn.test",
    bio: "teste diagnóstico",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=test",
    role: "player",
    is_dev: false,
    is_admin_apto: false,
    discord_tag: "",
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  try {
    const { data: ins, error: insErr } = await window.db.supabase
      .from("users").upsert([testUser], { onConflict: "id" });
    if (insErr) {
      console.error("❌ INSERT users falhou:", insErr.message, insErr.code, insErr.details);
      console.error("   → Provável causa: RLS ativo. Execute supabase_fix_completo.sql no dashboard.");
    } else {
      console.log("✅ INSERT users FUNCIONOU! UUID:", testUUID);
      // Limpar registro de teste
      await window.db.supabase.from("users").delete().eq("id", testUUID);
      console.log("🧹 Registro de teste removido.");
    }
  } catch(e) { console.error("❌ Exceção INSERT users:", e); }

  // 5. Verificar sessão Auth atual
  try {
    const { data: { session } } = await window.db.supabase.auth.getSession();
    if (session) {
      console.log("✅ Sessão Auth ativa:", session.user?.email, "| ID:", session.user?.id);
    } else {
      console.log("ℹ️ Sem sessão Auth ativa (usuário não autenticado via Supabase Auth).");
    }
  } catch(e) { console.error("❌ Exceção getSession:", e); }

  console.log("=== FIM DO DIAGNÓSTICO ===");
})();
