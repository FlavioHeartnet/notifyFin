# PROTÓTIPO THROWAWAY — fluxo do painel administrativo

Três variantes do fluxo administrativo, alternáveis por `?variant=A|B|C`, na rota isolada deste app React/Vite.

```bash
./prototype/admin-flow/run.sh
```

Tudo é sintético e fica somente em memória. Não há autenticação, persistência, upload ou integração real com Pluggy, Banco Inter, e-mail, WhatsApp ou IA.

## Veredito validado

- Usar **A — Roteiro guiado** para a configuração inicial.
- Usar **B — Central de operação** no uso recorrente.
- Manter **C — Fila de atenção** apenas como alternativa explorada, não escolhida.

A configuração guiada oferece conexão Pluggy e importação manual desde o início, sem deixar falhas da origem bloquearem o planejamento. Ela termina após salvar dia inicial do Ciclo financeiro, Renda planejada, Meta de reserva e ao menos uma Categoria de gasto com Limite de gasto. Conexão, importação e canais podem continuar pendentes. A revisão de classificações só entra no roteiro se houver Gastos pendentes de classificação.

Na Central de operação, a hierarquia é: confiabilidade/atualização dos dados; situação do Ciclo financeiro e sobras; classificações pendentes; Limites de gasto, alertas e Diagnósticos financeiros. A navegação fica restrita a Visão geral, Contas monitoradas, Planejamento, Classificações e Alertas e diagnósticos.
