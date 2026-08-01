# Acesso somente leitura a dados do Banco Inter

Pesquisa para o ticket [#2](https://github.com/FlavioHeartnet/notifyFin/issues/2). Consultada em 2026-06-17. O objetivo é contas, saldos, transações e cartões, atualização em até uma hora, histórico mínimo de 90 dias e custo máximo de R$ 150/mês.

## Resposta executiva

**Não foi encontrado um caminho oficialmente suportado e publicamente comprovado que satisfaça todos os requisitos do MVP ao mesmo tempo.** Para uma **conta PF**, o caminho regulado é compartilhar os dados via Open Finance com uma instituição receptora autorizada, diretamente ou por um agregador que opere essa jornada. Um aplicativo pessoal comum não pode se registrar diretamente: o onboarding oficial exige instituição autorizada pelo Banco Central, cadastro no Diretório, certificações de segurança e funcionais e publicação das aplicações/APIs ([Open Finance Brasil — Onboarding](https://openfinancebrasil.org.br/onboarding/)).

A **API Inter Empresas** é o único caminho oficial direto do próprio Inter identificado. Ela oferece saldo e extrato da **conta empresarial**, com chaves e certificado criados no Internet Banking, mas o catálogo público não confirma leitura de cartão. Portanto ela pode atender conta/saldo/transações de uma conta PJ com polling, mas não a cobertura PF + cartão ([Portal do Desenvolvedor Inter Empresas](https://developers.inter.co/); [API Banking](https://developers.inter.co/references/banking)).

Entre agregadores, a **Pluggy** confirma publicamente o Inter nos contextos Personal e Business, com Accounts, Transactions e Credit Cards; contudo, o plano de dados começa em **R$ 2.500/mês**, muito acima do teto, e os limites operacionais do Open Finance não permitem polling sustentado de hora em hora ([cobertura](https://docs.pluggy.ai/docs/open-finance-institutions-coverage); [preços](https://www.pluggy.ai/precos); [limites](https://docs.pluggy.ai/docs/rate-limits-of)). A **Belvo** publica plano de produção de **R$ 6.000/mês** e sua lista pública atual de instituições OFDA não lista o Inter, logo exige confirmação comercial de cobertura antes mesmo de considerar custo ([preços](https://belvo.com/pt-br/planos-precos/); [instituições](https://developers.belvo.com/pt-br/products/aggregation_brazil/aggregation-brazil-institutions)).

**Recomendação para o MVP:** não integrar automaticamente o Inter nesta fase. Implementar importação manual de arquivo/extrato como fallback, ou reduzir o requisito de atualização e orçamento; manter uma interface de provedor para futura POC comercial. Se o titular possuir e aceitar usar uma conta Inter PJ, fazer uma POC separada da API Inter Empresas apenas para conta/saldo/extrato, tratando cartão como fora de escopo até prova oficial.

## Caminhos oficialmente suportados

### 1. API Inter Empresas — direta, mas limitada à conta empresarial

| Critério | Resultado confirmado |
|---|---|
| Elegibilidade | A jornada pública é do **Inter Empresas**: login no Internet Banking, criação em “Soluções para sua empresa”, aceite de permissões e ativação de chaves/certificado. Isso comprova uma integração vinculada à conta empresarial, não uma API pessoal PF ([portal](https://developers.inter.co/)). |
| Autenticação/certificados | O Inter manda baixar e ativar **chaves e certificado** após criar a integração ([portal](https://developers.inter.co/)). Os detalhes de OAuth/mTLS e rotação devem ser validados no sandbox/documentação autenticada antes da implementação. |
| Conta e saldo | O catálogo oficial anuncia APIs de **Saldos** e API Banking ([portal](https://developers.inter.co/); [referência Banking](https://developers.inter.co/references/banking)). |
| Transações/histórico | O catálogo anuncia **Extrato** por período. A documentação legada oficial indexada informava janela máxima de 90 dias e limite de 10 chamadas/minuto; como o portal legado foi descontinuado, esses dois números precisam ser reconfirmados no sandbox atual ([referência legada](https://developers.bancointer.com.br/reference/extrato-1); [portal atual](https://developers.inter.co/)). |
| Cartão | **Não confirmado.** O catálogo público visível lista saldo e extrato, mas não uma API de leitura de cartão/fatura/transações de cartão. Não assumir cobertura sem prova do sandbox/suporte ([portal](https://developers.inter.co/)). |
| Atualização <= 1h | Para saldo/extrato, polling horário parece tecnicamente compatível com o limite legado de 10/min, mas não há SLA público de latência/frescor. É uma hipótese a provar em sandbox/produção. |
| Webhook | **Não foi localizada documentação pública de webhook de novas transações de conta ou mudança de saldo.** O desenho deve assumir polling; webhooks de Pix/cobrança, se disponíveis, não equivalem a um feed completo do extrato. |
| Custos | Não há preço público específico da API no portal. A página afirma que a Conta Digital PJ é gratuita, mas isso não prova gratuidade ou ausência de tarifas/condições da API; requer confirmação contratual ([portal](https://developers.inter.co/)). |
| Regulação | Não há onboarding próprio no Open Finance para consumir a API privada da própria conta empresarial; valem o contrato, permissões e credenciais do Inter. Isso não transforma a aplicação em receptora regulada de dados de terceiros. |

**Conclusão:** opção potencialmente barata para o próprio titular com conta PJ e leitura de conta, mas **não resolve o caso PF nem cartão** e ainda requer provar custo, frescor e janela atual.

### 2. Open Finance direto — cobertura adequada, inviável para um app pessoal não regulado

O escopo oficial inclui identificação da conta, saldos, limites, detalhes de transações e, para cartão, identificação, limites e transações ([dicionário de dados](https://openfinancebrasil.org.br/escopo-de-dados-dicionario/)). O próprio Inter informa que podem ser compartilhados saldo de conta, histórico de transações, extratos e faturas de cartão ([Ajuda Inter](https://ajuda.inter.co/open-finance/quais-dados-podem-ser-compartilhados-pelo-open-finance)).

Requisitos confirmados:

1. **Receptor elegível:** participação direta exige instituição autorizada pelo Banco Central, comprovação para cadastro no Diretório, implementação dos controles de segurança e UX, certificação de segurança e funcional e publicação das aplicações/APIs ([Onboarding](https://openfinancebrasil.org.br/onboarding/)). Um projeto pessoal sem essa condição não recebe credenciais de produção.
2. **Consentimento:** deve ser manifestação ativa, com finalidade determinada, em canal digital oficial da instituição receptora; o cliente é redirecionado à transmissora para autenticar e confirmar. O consentimento pode durar até 12 meses e pode ser revogado ([FAQ](https://openfinancebrasil.org.br/perguntas-frequentes/)). O Inter descreve a mesma jornada: ela começa na instituição que receberá os dados e redireciona ao app Inter ([Ajuda Inter — Conta PF](https://ajuda.inter.co/open-finance/como-compartilhar-dados-pelo-open-finance-na-conta-pf)).
3. **Certificação:** testes/certificados funcionais e de segurança são mandatórios para participantes das fases de dados ([Onboarding](https://openfinancebrasil.org.br/onboarding/); [certificados](https://openfinancebrasil.org.br/certificado-de-conformidade/)).
4. **Cobertura e histórico:** o padrão cobre contas, saldos, transações, cartões, limites e faturas; agregadores documentam recuperação histórica de até 12 meses, excedendo os 90 dias pedidos ([escopo oficial](https://openfinancebrasil.org.br/escopo-de-dados-dicionario/); [Belvo](https://developers.belvo.com/pt-br/products/aggregation_brazil/aggregation-brazil-introduction)). Cobertura prática do Inter precisa ser testada porque campos e estabilidade reais podem divergir.
5. **Polling/frescor:** as APIs são consultivas. Os limites publicados pela Pluggy, derivados da rede, são 420 consultas/mês para saldo, 240 para transações recentes, 4 para lista/detalhes de contas e histórico, e, em cartão, 240 para limites/recentes, 30 para faturas e 4 para histórico ([limites](https://docs.pluggy.ai/docs/rate-limits-of)). Mesmo distribuindo 240 consultas em 30 dias, são cerca de 8/dia (uma a cada 3 horas), portanto **atualização completa de hora em hora não é sustentável**. Faturas fechadas podem atualizar apenas diariamente e um cartão recém-autorizado pode levar até sete dias para aparecer na listagem ([limites](https://docs.pluggy.ai/docs/rate-limits-of)).
6. **Custo:** o compartilhamento/consentimento é gratuito ao consumidor ([Open Finance Brasil](https://openfinancebrasil.org.br/entenda-e-aprenda/)), mas ser participante regulado tem custos de autorização, governança, segurança, certificação e operação sem tabela simples pública. Para este MVP, o caminho direto é desproporcional e não cabe em R$150/mês.

**Conclusão:** cobertura normativa suficiente, mas inelegível e economicamente inviável para este app pessoal, além de não cumprir frescor integral <=1h por limites operacionais.

### 3. Agregador regulado — viável tecnicamente, fora do orçamento

#### Pluggy

- **Cobertura confirmada:** a tabela oficial, atualizada automaticamente da API, lista **Inter — Personal, Business — Accounts, Transactions, Credit Cards e Investments** ([cobertura](https://docs.pluggy.ai/docs/open-finance-institutions-coverage)). Para este ticket, isso confirma conta, transações e cartão; saldos fazem parte do produto Accounts/descrição comercial ([preços](https://www.pluggy.ai/precos)).
- **Consentimento/regulação:** o conector Open Finance precisa ser habilitado comercialmente e segue a jornada regulada; a Pluggy se apresenta como ITP regulada pelo Banco Central ([conectores](https://docs.pluggy.ai/docs/open-finance-regulated); [preços](https://www.pluggy.ai/precos)). É necessário implementar onboarding e gestão/revogação do consentimento conforme o contrato.
- **Histórico:** a documentação de cartão registra busca inicial de 12 meses e atualizações subsequentes; a janela excede 90 dias ([parcelas de cartão](https://docs.pluggy.ai/docs/credit-card-installments)).
- **Polling/webhooks:** a Pluggy oferece webhooks de criação/atualização/exclusão, mas eles notificam após as sincronizações permitidas; não anulam os limites nem garantem evento bancário em tempo real ([parcelas](https://docs.pluggy.ai/docs/credit-card-installments); [limites](https://docs.pluggy.ai/docs/rate-limits-of)). A página de preços promete webhooks de atualização ([preços](https://www.pluggy.ai/precos)).
- **Frescor:** saldo e transações recentes podem atualizar em cada execução, mas os tetos de 420/240 por mês impedem uma execução completa a cada hora; faturas atualizam uma vez ao dia ([limites](https://docs.pluggy.ai/docs/rate-limits-of)). **Não atende o requisito <=1h como garantia geral.**
- **Preço:** Dados a partir de **R$ 2.500/mês**, teste grátis de 14 dias ([preços](https://www.pluggy.ai/precos)). Não cabe no teto de R$150/mês.

#### Belvo

- **Cobertura do produto:** OFDA oferece contas/saldos, transações e faturas/cartões, recupera automaticamente os últimos 12 meses e envia webhooks `historical_update` e `new_{resource}_available` ([visão geral](https://developers.belvo.com/pt-br/products/aggregation_brazil/aggregation-brazil-introduction)).
- **Inter:** **não consta na lista pública atual de instituições OFDA** consultada; portanto, cobertura Inter PF/PJ/cartão não está confirmada e exige resposta comercial/sandbox ([instituições](https://developers.belvo.com/pt-br/products/aggregation_brazil/aggregation-brazil-institutions)).
- **Consentimento:** o hosted widget coleta CPF/CNPJ e nome, redireciona à instituição e cria consent/link; o usuário precisa dispor de meio fácil para gerenciar/renovar/revogar o consentimento ([visão geral](https://developers.belvo.com/pt-br/products/aggregation_brazil/aggregation-brazil-introduction)). O agregador reduz a carga de integração, mas não elimina obrigações de UX/LGPD/contrato para o app.
- **Polling/webhooks/frescor:** webhooks sinalizam conclusão ou disponibilidade após atualização, sem SLA público de <=1h na página consultada ([visão geral](https://developers.belvo.com/pt-br/products/aggregation_brazil/aggregation-brazil-introduction)). Requer prova comercial.
- **Preço:** sandbox gratuito somente para teste; produção no plano Launch custa **R$ 6.000/mês** ([preços](https://belvo.com/pt-br/planos-precos/)). Não cabe no teto.

## Cobertura real: conta versus cartão

| Dado | Inter Empresas | Open Finance/Pluggy para Inter | Belvo para Inter |
|---|---|---|---|
| Identificação de conta | Provável pelo contexto da própria conta, mas schema a validar | Confirmada como Accounts | Não confirmada: Inter ausente da lista pública |
| Saldo | Confirmado no catálogo | Confirmado pelo escopo/Accounts | Produto suporta, instituição não confirmada |
| Transações de conta | Confirmado como Extrato | Confirmado | Produto suporta, instituição não confirmada |
| Histórico >=90 dias | Limite legado de janela de até 90 dias; reconfirmar | Até 12 meses no fluxo do agregador | Até 12 meses no produto, se Inter for habilitado |
| Cartão/limites | Não documentado publicamente | Confirmado pela tabela de cobertura | Produto suporta, instituição não confirmada |
| Fatura/transações do cartão | Não documentado publicamente | Padrão e fluxo do agregador cobrem; testar campos/parcelas do Inter | Produto suporta, instituição não confirmada |
| Atualização completa <=1h | Possível só como hipótese para saldo/extrato por polling; sem SLA | Não: limites e cadências de fatura impedem garantia | Não comprovada; requer proposta/SLA |

Cartão tem limitações próprias: compras parceladas não possuem identificador único de grupo padronizado, bancos podem publicar parcelas de formas diferentes, e dados podem mudar de `PENDING` para `POSTED` apenas quando associados a uma fatura. A Pluggy recomenda consumir webhooks e usar heurísticas para parcelamentos ([documentação de parcelas](https://docs.pluggy.ai/docs/credit-card-installments)).

## Fatos confirmados versus lacunas de prova

### Confirmado publicamente

- Inter Empresas possui integração criada no Internet Banking com chaves/certificado e catálogo de saldo/extrato ([portal](https://developers.inter.co/)).
- Open Finance exige receptor autorizado pelo BCB, Diretório e certificações; consentimento explícito e revogável é obrigatório ([Onboarding](https://openfinancebrasil.org.br/onboarding/); [FAQ](https://openfinancebrasil.org.br/perguntas-frequentes/)).
- O escopo regulado cobre conta, saldo, transações e cartão ([dicionário](https://openfinancebrasil.org.br/escopo-de-dados-dicionario/)).
- Pluggy lista Inter PF/PJ com Accounts, Transactions e Credit Cards e custa a partir de R$2.500/mês ([cobertura](https://docs.pluggy.ai/docs/open-finance-institutions-coverage); [preços](https://www.pluggy.ai/precos)).
- Os limites do Open Finance documentados pelo agregador tornam inviável uma sincronização completa a cada hora de forma contínua ([limites](https://docs.pluggy.ai/docs/rate-limits-of)).
- Belvo custa R$6.000/mês em produção e não lista Inter na cobertura pública atual ([preços](https://belvo.com/pt-br/planos-precos/); [instituições](https://developers.belvo.com/pt-br/products/aggregation_brazil/aggregation-brazil-institutions)).

### Exige prova comercial ou sandbox

- Se a API Inter Empresas está disponível para a modalidade exata da conta do titular e sem custo adicional.
- OAuth/mTLS, validade/rotação de certificados, escopos atuais, paginação e janela atual de extrato no portal novo.
- Se existe endpoint privado/não indexado para cartão no Inter Empresas.
- Latência real do extrato Inter e se polling horário é aceitável contratualmente.
- Cobertura de campos e estabilidade do cartão Inter via Pluggy, sobretudo parcelas, faturas abertas e transações pendentes.
- Qualquer desconto/plano pessoal da Pluggy abaixo do preço público; não há evidência pública de plano <=R$150.
- Habilitação do Inter na Belvo, preço negociado e SLA de atualização; a lista pública atual não dá suporte a essa opção.

## Decisão recomendada para o MVP (teto R$150/mês)

1. **Não contratar Pluggy ou Belvo:** os pisos públicos excedem o teto em mais de uma ordem de grandeza.
2. **Não tentar acesso direto ao Open Finance:** o aplicativo não é instituição autorizada/receptora e o custo/compliance é incompatível com um MVP pessoal.
3. **PF:** usar importação manual (CSV/OFX/extrato exportado pelo canal oficial) e deixar sincronização automática como requisito adiado. Este relatório não confirmou formato, cobertura de cartão nem automação dessa exportação; isso deve ser um ticket separado de POC manual.
4. **PJ opcional:** se já houver conta Inter Empresas, provar no sandbox a API de saldo/extrato e custo zero/aceitável. Implementar polling no máximo horário, cache, idempotência e janela móvel; não prometer SLA de uma hora até medir. Cartão permanece fora do escopo.
5. **Arquitetura:** definir uma interface `FinancialDataProvider` separando conta, cartão, cursor/janela e `lastSuccessfulSyncAt`, para permitir futura troca por agregador sem reescrever o domínio.

Com os requisitos atuais, a decisão honesta é: **nenhuma integração automática em produção cabe em R$150/mês e entrega PF + conta + cartão + <=1h de forma oficialmente comprovada**.
