# Build v0.0.1 - Relatório de Auditoria e Retomada

**Data:** 29/12/2025
**Projeto:** LumenConsumer
**Versão:** v0.0.1 (Estado Atual)

---

## 1. Visão Geral do Projeto
O **LumenConsumer** é uma plataforma de PDV (Ponto de Vendas) focada em simplicidade ("Vovó-Friendly") e performance em tempo real. O sistema é composto por um Dashboard Administrativo (React/Electron) e uma interface de Cozinha (KDS), ambos sincronizados via Supabase Realtime.

A arquitetura atual é híbrida (Monólito Modular no Frontend com Backend as a Service via Supabase).

---

## 2. Tecnologias Utilizadas

### Frontend (vibe-one)
- **Framework:** React 19 (Vite)
- **Container:** Electron 39.2.7 (para distribuição Desktop)
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS + Shadcn/UI (Radix Primitives) + Lucide Icons
- **Gerenciamento de Estado:** React Hooks (useState/useEffect) locais + Supabase Realtime
- **Bibliotecas Chave:** `use-sound` (alertas), `date-fns` (datas), `recharts` (gráficos, pendente de uso real), `zod` (validação).

### Backend & Infraestrutura
- **BaaS:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Integração WhatsApp:** Evolution API (atualmente configurada para localhost)
- **Pagamentos:** Mercado Pago (Mock/Placeholder implementado em Edge Function)

---

## 3. Status Atual da Build

### ✅ Funcionalidades Concluídas
- **Autenticação:** Login e Cadastro via Supabase Auth funcionais.
- **Dashboard Visual:** Interface Kanban e Cards de Status implementados.
- **Cozinha (KDS):** Visualização de pedidos em tempo real.
- **Realtime Básico:** Pedidos novos aparecem na tela instantaneamente.
- **Configuração de Tenant:** Salvamento de chaves PIX no banco de dados.

### ⚠️ Funcionalidades Incompletas ou Quebradas
- **Integração WhatsApp:**
  - `handle-whatsapp` edge function tem lógica básica mas não está conectada a uma instância real da Evolution API em produção.
  - A interface Admin tenta conectar em `http://localhost:8080`, o que falhará em produção.
- **Pagamentos:**
  - `handle-payment` edge function é um **MOCK**. Não processa pagamentos reais do Mercado Pago.
  - O fluxo de atualização de status para 'paid' é simulado.
- **Criação de Pedidos:**
  - Botão de "Simular Pedido" no Dashboard cria dados `fakes`. Não há interface de POS (Frente de Caixa) real para lançar pedidos manualmente com produtos reais.
- **Histórico e Paginação:**
  - O Dashboard limita-se aos últimos 50 pedidos (`.limit(50)`). Não há paginação ou filtro por data robusto.

---

## 4. Diagnóstico e Correção Crítica: Supabase Egress 🔴

**Diagnóstico:**
O consumo excessivo de Egress (banda) foi causado por má implementação dos listeners `Realtime` em `Kitchen.tsx` e `Dashboard.tsx`.
1. **Kitchen.tsx:** Escutava TODOS (`*`) os eventos da tabela de pedidos. Cada insert/update (mesmo de pedidos pagos ou entregues fora da tela da cozinha) disparava um download completo da lista de pedidos.
2. **Dashboard.tsx:** Reagia instantaneamente a cada evento. Em atualizações em lote ou rápidas, fazia dezenas de requests desnecessários em segundos.

**Correção Aplicada:**
- **Refatoração KDS (`Kitchen.tsx`):**
  - Listener agora filtra eventos. O refetch (download de dados) só ocorre se o pedido entrar ou sair do status `'preparing'`.
  - Ignora atualizações irrelevantes (ex: mudança de 'pending' para 'paid', ou criação de pedidos não pagos).
- **Otimização Dashboard (`Dashboard.tsx`):**
  - Implementado **Debounce** (atraso de 1s). Se 10 atualizações ocorrerem em 1 segundo, o sistema fará apenas 1 download ao final.

**Status:** ✅ **RESOLVIDO** (Código aplicado e mitigado).

---

## 5. Pendências do Back-end / Dashboard

Priorização para as próximas sprints:

### 🔴 Urgente (Bloqueante)
1. **Externalizar URL da Evolution API:** Remover hardcode `localhost:8080` do Admin. Criar tabela de configuração de sistema ou usar ENV para apontar para a instância real da API.
2. **Implementar Webhook Real de Pagamento:** Finalizar `handle-payment` para validar assinaturas do Mercado Pago e atualizar status real.
3. **Segurança RLS (Row Level Security):** Revisar se as policies do Supabase garantem que um Tenant não veja pedidos de outro (crítico para SaaS).

### 🟡 Média (Importante)
1. **Paginação de Pedidos:** Implementar paginação ou "Lazy Loading" no Kanban para suportar lojas com milhares de pedidos sem travar o navegador.
2. **Gestão de Produtos:** Interface para criar/editar produtos reais (hoje os itens são inseridos via código ou simulação).

### 🟢 Baixa (Refinamento)
1. **Sons Personalizados:** Permitir que o usuário escolha o som de alerta.
2. **Modo Offline:** Melhorar feedback visual quando a conexão cai (atualmente há apenas um banner simples na Admin).

---

## 6. Melhorias Técnicas Recomendadas
- **Tipagem Compartilhada:** Mover tipos (`Order`, `OrderItem`) para um pacote ou arquivo `shared` único para evitar duplicação entre Admin, Dashboard e KDS.
- **State Management:** Adicionar React Query ou Zustand. O uso puro de `useEffect` com Supabase causa "waterfalls" de dados e dificulta o cache.
- **Edge Function Segura:** As functions atuais usam `Deno.env.get` para chaves, o que é correto, mas não validam origem do request (HMAC do Webhook).

---

## 7. Próximos Passos
1. **Validar Correção Egress:** Monitorar painel do Supabase por 24h.
2. **Configuração de Ambiente:** Definir Variáveis de Ambiente para Evolution API (URL/Key).
3. **Frente de Caixa (PDV):** Construir a tela de lançamento de pedidos reais (selecionar produtos -> gerar QR Code Pix).

---
*Relatório gerado automaticamente por Antigravity Agent.*
