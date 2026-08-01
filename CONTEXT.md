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

**Gasto categorizado**:
Saída destinada a consumo que reduz um Limite de gasto; pode ser uma compra ou uma transferência para uma conta não monitorada classificada explicitamente.
_Avoid_: Toda saída, débito

**Compromisso parcelado**:
Parcela futura de uma compra no cartão, contabilizada somente no Ciclo financeiro em que for lançada, mas exibida antecipadamente nos diagnósticos.
_Avoid_: Gasto já realizado, dívida integral no ciclo

**Pagamento de fatura**:
Liquidação do saldo do cartão, excluída dos gastos porque as compras correspondentes já foram contabilizadas.
_Avoid_: Compra, novo gasto

**Renda planejada**:
Valor que o Titular informa como disponível para financiar um Ciclo financeiro.
_Avoid_: Saldo bancário, receita automaticamente detectada

**Meta de reserva**:
Valor mínimo da Renda planejada que o Titular pretende preservar ao final do Ciclo financeiro.
_Avoid_: Limite de gasto, saldo atual

**Diagnóstico financeiro**:
Análise semanal ou de fechamento que estima a sobra do Ciclo financeiro a partir da renda, gastos, limites e compromissos conhecidos.
_Avoid_: Consultoria financeira, alerta de limite
