📝 Notas de Atualização Recentes (Changelog)
🚀 Ontem & Hoje no HDBN:
Perfil de Usuário Renovado: Novo Hero Banner com degradê escuro, avatar ampliado e centralizado com iluminação neon, data oficial de criação da conta e links diretos para YouTube, Twitch e Kick (sem poluição visual quando não preenchidos). Remoção definitiva de tags genéricas de jogador.
Diretrizes & Regras da Comunidade: Nova seção e página dedicada (#/regras) acessível pela Comunidade e Central de Ajuda, com critérios claros de estabilidade contra crashes na Godot Engine, sincronia de áudio/BPM, diretrizes para artes de capa e políticas anti-spam.
Estabilidade & Navegação: Correção total do travamento de carregamento infinito ao recarregar a página (F5) e rota blindada com página 404 exibindo os mapas mais baixados e favoritos.
Métricas em Tempo Real: Atualização instantânea dos contadores de downloads e fãs/favoritos diretamente na interface e no banco de dados.
Banco de Dados Otimizado (Supabase): Limpeza de colunas redundantes, suporte direto a streams e índices acelerados para consultas mais rápidas.
---

## 🚀 Visão Geral da Arquitetura & Stack Tecnológica

O projeto foi planejado para ser leve, otimizado e seguro, separando o processamento pesado de mídia e a segurança dos dados:
* **Frontend:** Interface web responsiva desenvolvida em **HTML, CSS e JavaScript**.
* **Banco de Dados & Autenticação (Supabase Duplo / Split Load Balancing):** Utiliza dois projetos independentes no Supabase para balancear a carga e otimizar recursos (dividindo consultas de dados da comunidade, perfis e tabelas de mapas). Conta com gerenciamento seguro de sessões e criptografia de senhas por *Hash Auth* (garantindo que senhas nunca fiquem expostas em texto plano nas tabelas).
* **Armazenamento de Mídia (Cloudinary):** Responsável por hospedar de forma centralizada e otimizada os arquivos `.hbn`, capas (`art`), áudios e trechos de preview dos mapas.
* **Integração de Conteúdo:** Feed dinâmico integrado diretamente ao Blogspot (`cafedobom123.blogspot.com`) para notas de atualização e posts da beta.
* **Motor do Jogo:** Desenvolvido em **Godot Engine** (`GDScript`), utilizando criptografia estrita baseada na chave interna do projeto (`ENCRYPTION_KEY: String = "HigurashiKai!Kamisama_no_Syndrome#Hinamizawa_07$WhenTheyCry"`) para empacotar e desempacotar mapas de forma segura.

---

## 🗺️ Funcionalidades e Seções do Sistema

### 1. Navegação & Layout Principal
* **Header Dinâmico:** Links rápidos para *Início, Maps, Rank, Comunidade* e botão de atalho para a página externa do projeto no itch.io[cite: 1].
* **Menu de Perfil (Ghost Menu):** Área no canto superior direito para acesso rápido às telas de **Inscrever-se** e **Logar**.
* **Responsividade Inteligente:** Adaptação de menus laterais (estilo painel de ferramentas) para dispositivos móveis e layouts de grade otimizados para desktop (exibindo grades limitadas de 12 a 14 itens por vez para evitar poluição visual).

### 2. Sistema de Mapas & Publicação
* **Envio Protegido:** Os usuários podem arrastar e soltar arquivos compactados `.hbn`. O pacote e o JSON interno (contendo notas, posições e dados de contagem) trafegam criptografados.
* **Processamento Automático:** O sistema extrai a capa (`art`), localiza o áudio base e recorta automaticamente um trecho de **30 segundos** (a partir do `audio_preview_start`) para reprodução rápida via player embutido de volume baixo.
* **Restrição de Integridade:** O título do mapa é lido nativamente do arquivo compactado, impedindo alterações manuais não autorizadas.
* **Fila de Moderação:** Todo mapa recém-publicado passa obrigatoriamente por uma etapa de triagem onde os administradores decidem se ele será aprovado, integrado ao modo ranqueado ou descartado.

### 3. Sistema de Ranking (Normal vs. Pro)
* **Rank Normal:** Soma o desempenho e a pontuação acumulada de **todos** os mapas jogados e concluídos (incluindo notas mais baixas, como B ou C).
* **Rank Pro:** Inspirado no sistema de performance competitivo (*osu!*), filtra e contabiliza **apenas** pontuações de mapas com notas de alto desempenho (**A, S, S+, SS e SS+**), ignorando notas inferiores.
* **Filtros Temporais:** Listagem segmentada por **Ano**, **Mês** e **Semana**.

### 4. Comunidade & Perfis
* **Hub Social:** Listagem de mapas e usuários recentes com paginação numérica otimizada (máximo de 12 itens por página) tanto no topo quanto na base.
* **Destaques:** Exibição dos criadores com maior volume de mapas baixados e favoritados pela comunidade.
* **Perfis Detalhados:** Possibilidade de visualizar informações públicas dos jogadores e os mapas adicionados aos favoritos de cada usuário.

---

## 🛡️ Painel de Administração e Moderação (`/admin`)

Para manter a integridade da plataforma e otimizar os recursos do banco de dados, o painel conta com ferramentas robustas de controle:
* **Hierarquia de Cargos:** Moderadores e administradores só possuem permissão para gerenciar ou punir usuários com **cargos inferiores** ao seu, prevenindo conflitos hierárquicos.
* **Gestão de Inatividade (27 Dias):** Alertas automáticos para contas inativas há 27 dias. Os administradores podem optar por manter a conta ativa, suspendê-la (concedendo um prazo de carência de 7 dias para o usuário logado reativar automaticamente) ou realizar a exclusão definitiva para otimizar espaço.
* **Controle de Infrações (Mapas Banidos):** Mapas julgados inadequados ou ofensivos são removidos permanentemente do banco de dados (sem retenção de arquivos para economizar armazenamento). No entanto, o sistema incrementa um contador de infrações na conta do autor. Acumular o limite máximo (ex: 5 infrações) resulta em suspensão severa, enquanto contas sem novas ocorrências durante **1 ano inteiro** têm o histórico limpo automaticamente.
