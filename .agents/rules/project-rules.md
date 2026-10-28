# Regras do Projeto — Minimalist To-Do (Preto & Roxo)

## Princípios de Design e Usabilidade
- O sistema é intencionalmente minimalista: sem painéis laterais complexos, sem abas desnecessárias, sem configurações prolixas.
- Autenticação de tela única: se deslogado, mostra apenas o card centralizado com botão "Entrar com o Google". Se logado, vai direto para as 3 colunas (`A Fazer`, `Fazendo`, `Completo`).
- Todo componente deve respeitar o tema escuro profundo (`#09090b` / `#121217`) com realces roxos (`#8b5cf6` / `#7c3aed`).

## Restrições do Banco de Dados
- Utilizar SQLite em modo WAL (`journal_mode = WAL`) para concorrência segura.
- Todas as chaves estrangeiras (`PRAGMA foreign_keys = ON;`) ativadas.
- Tarefas só aceitam os status canônicos: `'todo'`, `'doing'`, `'done'`.

## Segurança e Autenticação
- O backend deve validar a assinatura do ID Token emitido pelo Google utilizando o Client ID configurado (`GOOGLE_CLIENT_ID`).
- Armazenamento de sessão seguro via JWT em cookie HttpOnly com `SameSite=Lax` (ou `Strict`) e flag `Secure` em produção.
- Usuários autenticados podem ver todas as tarefas da organização/instância, mas apenas o criador ou designado pode editar campos sensíveis, e todos podem comentar e submeter entregas.

## Diretrizes de Deploy
- Zero manutenção: a aplicação deve ser empacotada em container Docker ou processo leve Node.js.
- Persistência: o arquivo SQLite deve ficar em pasta montada via volume (`/data/app.db`).
- Proxy reverso: Caddy ou Nginx cuidam do SSL automático e redirecionamento HTTPS.

