# NotifyFin

NotifyFin acompanha as finanças de uma única pessoa para ajudá-la a manter seus gastos dentro de limites planejados.

## Language

**Titular**:
A única pessoa cujas contas, transações e metas financeiras são acompanhadas pelo NotifyFin.
_Avoid_: Cliente, usuário final, correntista

**Monitoramento financeiro**:
Acompanhamento somente para leitura de dados financeiros, sem bloquear compras, movimentar dinheiro ou iniciar pagamentos.
_Avoid_: Controle bancário, gestão da conta

**Sincronização financeira**:
Atualização dos dados bancários para que novas movimentações possam gerar alertas em até uma hora após aparecerem na fonte.
_Avoid_: Tempo real, streaming bancário

**Ciclo financeiro**:
Período mensal recorrente iniciado no dia escolhido pelo Titular; quando esse dia não existir no mês, começa no último dia daquele mês.
_Avoid_: Mês-calendário, intervalo mensal

**Limite de gasto**:
Valor máximo planejado para uma categoria durante um Ciclo financeiro, sem transferência automática de sobra ou excesso para o ciclo seguinte.
_Avoid_: Orçamento mensal, teto bancário

**Categoria de gasto**:
Classificação própria do NotifyFin usada para agrupar gastos e aplicar Limites de gasto, independentemente da categoria original do banco.
_Avoid_: Categoria bancária

**Regra de classificação**:
Associação reutilizável que classifica transações semelhantes, podendo partir de dados bancários, IA ou correção do Titular.
_Avoid_: Categoria fixa do estabelecimento

**Marco de alerta**:
Percentual configurável de um Limite de gasto cuja primeira ultrapassagem no Ciclo financeiro dispara uma única notificação.
_Avoid_: Aviso recorrente, lembrete de orçamento

**Conta monitorada**:
Fonte financeira pertencente ao Titular cujas movimentações são importadas pelo NotifyFin; um Titular pode ter várias.
_Avoid_: Usuário bancário, perfil bancário

**Transferência interna**:
Movimentação entre duas Contas monitoradas do Titular, excluída dos gastos para evitar contagem dupla.
_Avoid_: Gasto, despesa

**Observação financeira**:
Registro canônico importado de uma fonte financeira, ainda separado da interpretação que determina seu significado e impacto financeiro.
_Avoid_: Gasto, transação já classificada

**Movimentação financeira**:
Fato financeiro local reconciliado a partir de uma ou mais Observações financeiras, com interpretação e impacto próprios.
_Avoid_: Registro bruto, duplicata por origem

**Lote de importação**:
Conjunto auditável de Observações financeiras trazidas por um único arquivo manual, que pode ser cancelado e substituído integralmente para corrigir seus dados.
_Avoid_: Sincronização bancária, arquivo descartável

**Gasto categorizado**:
Saída destinada a consumo que reduz um Limite de gasto; pode ser uma compra ou uma transferência para uma conta não monitorada classificada explicitamente.
_Avoid_: Toda saída, débito

**Gasto pendente de classificação**:
Saída reconhecida como consumo, mas ainda sem Categoria de gasto; compõe o gasto total e os diagnósticos sem reduzir um limite de categoria.
_Avoid_: Movimentação não resolvida, gasto ignorado

**Compromisso parcelado**:
Parcela futura de uma compra no cartão, contabilizada somente no Ciclo financeiro em que sua cobrança for efetivada, mas exibida antecipadamente nos diagnósticos.
_Avoid_: Gasto já realizado, dívida integral no ciclo

**Fatura de cartão**:
Agrupamento de lançamentos de uma Conta monitorada de cartão, com período, vencimento, fechamento, estado e totais próprios; não é uma movimentação financeira.
_Avoid_: Compra, Pagamento de fatura, gasto sintético

**Pagamento de fatura**:
Liquidação do saldo do cartão, excluída dos gastos porque as compras correspondentes já foram contabilizadas.
_Avoid_: Compra, novo gasto

**Entrada observada**:
Entrada de dinheiro identificada nas Contas monitoradas que permanece separada da Renda planejada.
_Avoid_: Renda planejada, aumento automático do orçamento

**Renda planejada**:
Valor que o Titular informa como disponível para financiar um Ciclo financeiro.
_Avoid_: Saldo bancário, receita automaticamente detectada

**Meta de reserva**:
Valor mínimo da Renda planejada que o Titular pretende preservar ao final do Ciclo financeiro.
_Avoid_: Limite de gasto, saldo atual

**Diagnóstico financeiro**:
Resumo semanal ou de fechamento, redigido pela IA exclusivamente a partir de fatos e cálculos determinísticos do NotifyFin sobre renda, gastos, limites e compromissos conhecidos. A IA não calcula valores nem cria fatos financeiros.
_Avoid_: Consultoria financeira, cálculo pela IA, alerta de limite

**Sobra comprometida**:
Parte da Renda planejada que permanece após descontar a Meta de reserva, os gastos realizados e os compromissos futuros conhecidos do Ciclo financeiro.
_Avoid_: Saldo disponível, saldo bancário

**Sobra projetada**:
Estimativa determinística do que restará da Renda planejada ao fim do Ciclo financeiro, considerando o ritmo de gastos e os compromissos futuros conhecidos; nos primeiros sete dias do ciclo, tem baixa confiança.
_Avoid_: Garantia de saldo, previsão pela IA
