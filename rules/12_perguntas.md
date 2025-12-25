1. A Utilidade "Estrela do Norte"
Resposta: O sistema tem duas caras.

Para a Cozinha (Operacional): Velocidade de despacho. A tela deve gritar "FAÇA ISSO AGORA".

Para o Dono (Gerencial): Segurança do Caixa. Onde está o dinheiro? Decisão de Design: Criaremos rotas separadas (/kitchen vs /admin). A tela da cozinha não terá gráficos financeiros, apenas cartões de pedidos. O financeiro fica protegido por PIN.

2. O Modelo Mental do Usuário
Resposta: Gerenciamento em Tempo Real (Modo Multiplayer). O usuário não está "lendo" um site; ele está operando um painel de controle. O estado dos pedidos muda sozinho (via Supabase Realtime) sem ele precisar dar F5. Decisão: Uso pesado de WebSockets (Supabase Subscribe) para que, assim que o PIX cair, o card mude de cor instantaneamente na tela de todos.

3. A Regra dos 3 Segundos
Resposta: O operador deve bater o olho e identificar Status do Pagamento e Tempo de Espera. Decisão Visual:

🟥 Vermelho = Atrasado / Problema.

🟨 Amarelo = Novo Pedido (Atenção Requerida).

🟩 Verde = Pago/Pronto.

Uso de badges gigantes: "PAGO VIA PIX" vs "A PAGAR NA ENTREGA".

4. A Fonte da Verdade dos Dados
Resposta: Supabase (PostgreSQL). O WhatsApp é efêmero. A Evolution API é apenas o mensageiro. Fluxo: O Cliente fala -> Evolution API recebe -> Webhook chama seu Backend -> Backend grava no Supabase -> Supabase avisa o Frontend. Se o celular do restaurante desligar, o pedido continua salvo no banco.

5. O Caminho Feliz vs. O Abismo
Resposta:

Feliz: Cliente paga PIX -> Mercado Pago avisa -> Pedido fica verde e toca um sino.

Abismo (Falhas):

Cliente manda comprovante falso: O sistema ignora a imagem e espera o Webhook do Mercado Pago. Mantém status "Aguardando Pagamento".

Bot desconectado: Um banner vermelho fixo no topo da Dashboard avisa: "⚠️ WhatsApp Desconectado. Reconecte Agora".

6. Hierarquia Visual
Resposta: Ação de Avanço de Status. O botão mais chamativo do Card de Pedido não é "Ver Detalhes", é o botão de ação imediata: "ACEITAR PEDIDO" ou "DESPACHAR MOTOBOY". O resto é secundário.

7. Custo de Interação
Resposta: Zero Fricção.

Cliente: Fluxo numérico simples no Zap (Digite 1, Digite 2). Nada de digitar textos longos.

Restaurante: 1 Clique para aceitar, 1 Clique para imprimir (integração via browser print).

8. A "Vibe" & Estética
Resposta: Clean SaaS Utilitário. Fundo escuro (Dark Mode) por padrão para economizar bateria de tablets e cansar menos a vista em ambientes noturnos. Fontes grandes (Inter ou Roboto), botões com áreas de toque generosas (mínimo 44px) para dedos engordurados ou telas ruins.

9. Fricção de Integração (O Pivô Decisivo)
Resposta: Evolution API (Self-Hosted/Docker).

Onboarding: O cliente lê um QR Code na tela do seu sistema (igual WhatsApp Web).

Hibridismo: O cliente mantém o acesso ao WhatsApp no celular dele para responder dúvidas manuais enquanto o bot opera.

Infra: Um servidor VPS central rodando a Evolution API que gerencia múltiplas instâncias (uma para cada restaurante).

10. Prova de Futuro
Resposta: Paginação Infinita + Virtualização. Não carregaremos "todos os pedidos de hoje" de uma vez se forem 500. Carregamos os 50 últimos. O histórico antigo fica na aba "Histórico", não na tela "Ao Vivo". Isso impede o navegador de travar.

11. O Teste da Vovó (Acessibilidade)
Resposta: Responsividade Agressiva. O layout será Mobile-First. No PC, ele expande para mostrar mais colunas (Kanban). No celular, vira uma lista vertical. Contraste alto obrigatório (WCAG AA).

12. O Cheque "Mate seus Queridinhos"
Resposta: Foco no MVP (Minimum Viable Product). Cortamos: IA de sugestão de pratos, programa de fidelidade complexo e App nativo. Focamos em: Pedir -> Pagar (PIX Auto) -> Cozinhar -> Entregar.