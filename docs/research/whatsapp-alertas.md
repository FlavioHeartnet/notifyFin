# Alertas pessoais por WhatsApp no NotifyFin

**Decisão pesquisada:** issue [#3](https://github.com/FlavioHeartnet/notifyFin/issues/3), filha do mapa [#1](https://github.com/FlavioHeartnet/notifyFin/issues/1).  
**Referência temporal:** 1º de agosto de 2026. Preços e políticas do WhatsApp mudam; a Meta informa que tarifas podem mudar no primeiro dia de cada trimestre, mediante o aviso aplicável. ([Meta — Pricing](https://developers.facebook.com/docs/whatsapp/pricing/))

## Resposta curta

A opção oficialmente suportada para o NotifyFin iniciar alertas proativos individuais é a **WhatsApp Business Platform Cloud API**, usando um **template aprovado** — provavelmente da categoria **Utility** se o alerta for não promocional, específico da conta/serviço e solicitado pelo usuário. Templates são o único tipo de mensagem permitido fora da janela de atendimento de 24 horas; a própria diretriz da Meta dá “account alerts or updates” e atualização de saldo como exemplos de Utility. ([Meta — Messages](https://developers.facebook.com/docs/whatsapp/conversation-types/), [Meta — Template categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/))

Para o MVP de uso próprio, a rota direta é preferível: a Cloud API é hospedada pela Meta, o acesso à API não tem tarifa adicional de licença/hospedagem da Meta e um Direct Developer usando somente os próprios ativos não precisa de Advanced Access/App Review. Um BSP continua sujeito às políticas, templates, limites e tarifas da Meta e adiciona sua própria cobrança; ele simplifica integração/suporte, não cria uma exceção para alertas pessoais. ([Meta — Cloud vs. On-Premises](https://developers.facebook.com/docs/whatsapp/cloud-vs-onprem/), [Meta — Solution Partner FAQ](https://developers.facebook.com/docs/whatsapp/solution-providers/get-started-for-solution-partners/), [Meta — App Review](https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/), [Twilio — Pricing](https://www.twilio.com/en-us/whatsapp/pricing))

**Cabe no teto total de R$150/mês, de forma condicional.** Na tabela oficial em BRL vigente desde 1º/7/2026, um Utility entregue a número brasileiro custa **R$0,0350** fora da janela: R$150 comprariam aproximadamente **4.285 entregas/mês** se todo o teto fosse reservado ao WhatsApp, antes de impostos e infraestrutura. Um uso pessoal de 30 alertas/dia (900/mês) custaria cerca de **R$31,50/mês** em tarifas Meta. A conclusão final depende do custo conjunto do backend/webhook e dos impostos exibidos no cadastro de cobrança; portanto deve haver trava de gasto, e a tarifa deve ser conferida no Billing Hub/rate card antes de produção. ([Meta — Pricing e rate card BRL](https://developers.facebook.com/docs/whatsapp/pricing/))

## Como o envio proativo funciona

1. O usuário fornece o número e dá opt-in para receber comunicações do **NotifyFin**.
2. O NotifyFin registra a preferência e dispara um template aprovado quando uma regra financeira é atingida.
3. Fora da janela de atendimento, envia `type=template` pela Graph API. Dentro da janela de 24 horas aberta pela última mensagem ou chamada do usuário, mensagens livres são tecnicamente permitidas; para alertas previsíveis, manter o template reduz bifurcações operacionais. ([Meta — Messages](https://developers.facebook.com/docs/whatsapp/conversation-types/))
4. O endpoint de webhook recebe estados `sent`, `delivered`, `read` ou `failed`; **aceite HTTP não equivale a entrega**, então o produto só deve marcar o alerta como entregue ao receber `delivered`. ([Meta — Webhook payloads](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components/))

Exemplo inicial de template a submeter como `UTILITY` (a categoria final é da Meta):

> **Alerta NotifyFin**: seus gastos em {{categoria}} chegaram a {{percentual}}% do limite de {{valor_limite}}. Gasto atual: {{valor_atual}}. Responda PARAR para desativar estes alertas.

O texto deve permanecer transacional, específico e sem promoção. A Meta pode aprovar um template submetido como Utility na categoria Marketing, recategorizá-lo depois ou restringir Utility em caso de classificação abusiva; a operação deve ler status/categoria antes do envio e tratar `template_category_update`. ([Meta — Template categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/))

## Requisitos de conta, número e aprovação

### Obrigatórios para produção direta

- Conta Facebook ou Meta gerenciada, cadastro como desenvolvedor, app Meta com o caso de uso WhatsApp, **Business Portfolio** e **WhatsApp Business Account (WABA)**. O portfolio é obrigatório e contém a WABA. ([Meta — Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started), [Meta — Cloud API overview](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/))
- Número controlado pelo projeto, com código de país/área e capaz de receber SMS ou ligação; verificar a posse e registrar o número na Cloud API com PIN de verificação em duas etapas. Um número registrado não pode continuar no WhatsApp Messenger comum, embora possa continuar recebendo voz/SMS. ([Meta — Business phone numbers](https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers), [Meta — Registration](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration/))
- Método de pagamento para o remetente de produção e token permanente de **system user** com os ativos e permissões `business_management`, `whatsapp_business_messaging` e `whatsapp_business_management`; guardar token e app secret como segredos e rotacioná-los. O token temporário do quickstart expira rapidamente. ([Meta — Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started))
- Template aprovado e ativo no idioma enviado. Templates são revisados automaticamente, só podem ser enviados no estado `APPROVED` e podem ser pausados/desabilitados por feedback/baixa qualidade. ([Meta — Message Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines))
- Endpoint HTTPS próprio em produção, configurado e inscrito ao campo `messages`; webhooks entregam entradas e estados de saída. Para `messages`, é necessária `whatsapp_business_messaging`; os demais eventos usam `whatsapp_business_management`. ([Meta — Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/))

### Um projeto pessoal consegue entrar?

**Sim para um piloto pequeno, mas não existe garantia prévia de “aprovação do projeto”.** A Meta afirma que revisão do display name e verificação do negócio não são necessárias para começar e que se pode enviar imediatamente após o cadastro; portfolios novos começam com capacidade de alcançar 250 números únicos fora da janela em 24 horas. Um Direct Developer que usa os próprios ativos não precisa de Advanced Access/App Review. Isso cobre com ampla margem um destinatário próprio. ([Meta — About WhatsApp Business display name](https://www.facebook.com/business/help/338047025165344), [Meta — Messaging Limits](https://developers.facebook.com/docs/whatsapp/messaging-limits/), [Meta — App Review](https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/))

Há, porém, três avaliações separadas e assíncronas: integridade/conta, conformidade do nome e aprovação/classificação do template. O nome deve representar o negócio/produto e cada template é revisado; feedback negativo pode pausá-lo. Se for necessário verificar o negócio para escalar, a Meta pode exigir documento oficial que comprove nome legal e endereço/telefone (por exemplo, registro ou licença empresarial). Logo, **“NotifyFin” sem presença pública ou registro pode funcionar no nível inicial, mas o resultado real de onboarding/nome/template é uma lacuna que exige cadastro e teste**; não se deve prometer OBA/selo, que é voltado a negócios notórios e não é necessário para enviar. ([Meta — Display name](https://www.facebook.com/business/help/338047025165344), [Meta — documentos para business verification](https://www.facebook.com/business/help/159334372093366), [Meta — Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines))

## Consentimento, opt-in e opt-out

A Meta exige, antes da primeira mensagem, que a pessoa (a) tenha fornecido seu telefone e (b) tenha autorizado mensagens ou chamadas posteriores de um negócio identificado. Desde a atualização de novembro de 2024, o opt-in pode ser geral e não precisa mencionar especificamente WhatsApp, desde que cumpra a lei local; ainda assim, para reduzir bloqueios e tornar a prova inequívoca, o MVP deve usar opt-in **específico para alertas financeiros por WhatsApp**. O formulário deve identificar “NotifyFin”, explicar categorias/frequência esperada e oferecer opt-out claro, que deve ser honrado. Website, SMS, telefone e papel são métodos aceitos pela política. ([Meta — Get opt-in](https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in/))

Registro mínimo recomendado: número em E.164, texto/versão da declaração, categorias autorizadas, timestamp, origem, usuário e estado `active/revoked`. Processar imediatamente “PARAR”, “SAIR” e equivalentes; suprimir antes de enfileirar novos alertas. Como os alertas contêm dados financeiros, aplicar também aviso de privacidade, base legal, minimização, retenção e segurança segundo a LGPD; o opt-in do WhatsApp não substitui as obrigações legais brasileiras. ([Lei 13.709/2018 — LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), [Meta — Get opt-in](https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in/))

## Templates e janela de atendimento

- Uma mensagem ou chamada do usuário abre uma **customer service window de 24 horas**, reiniciada a cada nova interação. Dentro dela podem ser enviadas mensagens livres; fora dela somente templates pré-aprovados. O opt-in continua obrigatório em ambos os casos. ([Meta — Messages](https://developers.facebook.com/docs/whatsapp/conversation-types/))
- O alerta de limite financeiro tem boa aderência a Utility se foi solicitado, é específico da conta/serviço e não promocional. A Meta cita atualizações/alertas de conta e saldo disponível entre exemplos Utility. Se o conteúdo não resultar de ação/solicitação do usuário ou misturar persuasão, pode virar Marketing. ([Meta — Template categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/))
- Templates não entregues têm TTL padrão de 30 dias (autenticação: 10 minutos), ajustável em casos suportados. Para um alerta financeiro perecível, configurar TTL curto quando permitido e incluir timestamp/período para não entregar informação velha; sem webhook `delivered` antes do TTL, considerar descartado. ([Meta — Sending messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages/))

## Limites e qualidade

- O limite inicial é **250 números únicos alcançados fora da janela em um período móvel de 24 horas**, compartilhado pelo Business Portfolio. Pode subir a 2.000 por business verification, verificação via parceiro ou trilha de volume/qualidade; escalas seguintes são 10.000, 100.000 e ilimitada, condicionadas a qualidade e uso. Para o MVP de um usuário, o limite relevante é efetivamente a política antiabuso/qualidade, não capacidade. ([Meta — Messaging Limits](https://developers.facebook.com/docs/whatsapp/messaging-limits/))
- Uma WABA não verificada pode manter até 250 templates; portfolios verificados e qualificados podem chegar a 6.000. Um template é suficiente para o MVP. ([Meta — Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines))
- Cloud API suporta até 80 mensagens/s por número por padrão, mas para o mesmo usuário o limite é 1 mensagem a cada 6 segundos (aprox. 10/minuto), com throttling e backoff após excesso. O NotifyFin deve agregar eventos próximos em um alerta e impor limite diário configurável. ([Meta — Cloud API overview](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/))
- Bloqueios, denúncias, baixa leitura e feedback negativo afetam qualidade e podem pausar/desabilitar templates ou limitar a conta. Enviar apenas alertas esperados, úteis e personalizados; nunca “testar” produção em terceiros sem consentimento. ([Meta — Messages](https://developers.facebook.com/docs/whatsapp/conversation-types/), [Meta — Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines))

## Custos e teto de R$150/mês

A Meta cobra por **template entregue**, conforme categoria e código de país do destinatário. Em 1º/8/2026, a rate card oficial em BRL para Brasil indica: Marketing **R$0,3217**, Utility **R$0,0350** e Authentication **R$0,0350** por entrega na faixa inicial. Mensagens livres e Utility dentro da janela estão gratuitas nessa data; a própria página anuncia mudanças para mensagens de serviço/Utility em **1º/10/2026**, portanto essa gratuidade não deve sustentar a viabilidade do MVP. ([Meta — Pricing e rate cards](https://developers.facebook.com/docs/whatsapp/pricing/))

| Cenário mensal | Entregas | Tarifa Meta estimada | Parcela do teto |
|---|---:|---:|---:|
| 1 alerta Utility/dia | 30 | R$1,05 | 0,7% |
| 10 alertas Utility/dia | 300 | R$10,50 | 7,0% |
| 30 alertas Utility/dia | 900 | R$31,50 | 21,0% |
| Limite teórico só WhatsApp/Utility | 4.285 | R$149,98 | ~100% |
| Pior caso: template recategorizado Marketing | 466 | R$149,94 | ~100% |

Cálculos: entregas × rate card, arredondados; não incluem impostos, número, backend, logs ou BSP. Como o teto é **operacional total**, a regra recomendada é reservar no máximo **R$50/mês** ao canal no piloto, limitar a aproximadamente 1.400 Utility entregues/mês (ou menos conforme impostos), alertar em 50/75/90% e desligar WhatsApp antes de ultrapassar a reserva. A tarifa efetiva e tributos só serão confirmados após criar WABA, método de pagamento e observar Billing/insights; este é um item obrigatório do teste de produção. ([Meta — Pricing](https://developers.facebook.com/docs/whatsapp/pricing/))

## Cloud API direta versus BSP (somente diferenças confirmadas)

| Dimensão | Cloud API direta | BSP (exemplo documentado: Twilio) |
|---|---|---|
| Suporte oficial | API oficial hospedada pela Meta e solução preferida. ([Meta](https://developers.facebook.com/docs/whatsapp/cloud-vs-onprem/)) | Acesso oficial à mesma WhatsApp Business Platform. ([Twilio](https://www.twilio.com/docs/whatsapp)) |
| Políticas/templates/limites Meta | Aplicam-se integralmente. | Também se aplicam; limites Meta continuam valendo. ([Twilio](https://www.twilio.com/docs/whatsapp/isv/tech-provider-program)) |
| Infraestrutura | Meta hospeda a API; NotifyFin ainda hospeda app, agenda e webhook. ([Meta](https://developers.facebook.com/docs/whatsapp/cloud-vs-onprem/)) | BSP oferece sua API/infra gerenciada e onboarding, mas NotifyFin ainda precisa receber callbacks e operar a aplicação. ([Twilio](https://www.twilio.com/docs/whatsapp)) |
| Cobrança confirmada | Acesso à Cloud API sem custo adicional; paga tarifas Meta por mensagem aplicável. ([Meta](https://developers.facebook.com/docs/whatsapp/solution-providers/get-started-for-solution-partners/)) | Twilio cobra **US$0,005 por mensagem inbound ou outbound**, além da tarifa Meta repassada; falhas podem ter US$0,001. ([Twilio Pricing](https://www.twilio.com/en-us/whatsapp/pricing)) |
| Teste | Test WABA e número de teste automáticos, limites relaxados e sem método de pagamento para templates de teste. ([Meta](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/)) | Sandbox oficial da Twilio; mensagens têm preço normal e trial inclui 100 mensagens, podendo haver restrição temporária para Brasil. ([Twilio Sandbox](https://www.twilio.com/docs/whatsapp/sandbox)) |
| App Review | Direct Developer nos próprios ativos não precisa Advanced Access/App Review. ([Meta](https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/)) | O cliente ainda precisa Meta Business Manager/WABA e sender; o BSP cuida da integração sob seu modelo. ([Twilio WABA](https://www.twilio.com/docs/whatsapp/tutorial/whatsapp-business-account)) |
| Lock-in/migração | Integração nativa Graph API. | API e recursos próprios do BSP acrescentam dependência; condições exatas de migração/SLA/suporte exigem proposta e teste. |

Não foi comparado “tempo de aprovação”, taxa de sucesso de templates, SLA ou suporte porque não há evidência oficial de que um BSP melhore decisões da Meta. A própria Meta não oferece SLA comercial público de uptime/latência da Cloud API; um eventual SLA do BSP precisa ser lido no contrato. ([Meta — Support](https://developers.facebook.com/docs/whatsapp/cloud-api/support/))

## Webhooks, segurança e operação

- Criar callback HTTPS com certificado válido, responder ao challenge usando verify token e inscrever `messages`; antes da produção, substituir o endpoint de teste por endpoint próprio. ([Meta — Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/))
- Persistir `wamid`, destinatário, template/versão, categoria, timestamps e estados; tornar o consumidor idempotente. A Meta tenta novamente webhooks não respondidos com HTTP 200 por até 7 dias, podendo gerar duplicatas. ([Meta — Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks/))
- Monitorar resposta síncrona da Graph API **e** erros/estados assíncronos; aplicar retry com backoff apenas a falhas transitórias, nunca duplicar um alerta já entregue. ([Meta — Error codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes/), [Meta — Webhook payloads](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components/))
- Guardar token permanente, app secret, verify token e PIN fora do repositório; limitar permissões, rotacionar segredos e não registrar conteúdo financeiro completo. Graph API e webhooks usam HTTPS/TLS, mas isso não elimina a responsabilidade do NotifyFin sobre seus dados e logs. ([Meta — Cloud API overview](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/))
- Assinar/validar autenticidade de callbacks conforme os mecanismos disponibilizados pela Meta, evitar exposição de segredos e aplicar autenticação/autorização interna. Monitorar status oficial e ter fallback, pois não há SLA comercial público. ([Meta — Webhooks](https://developers.facebook.com/docs/whatsapp/webhooks/), [Meta — Support](https://developers.facebook.com/docs/whatsapp/cloud-api/support/))

## Plano de teste e critérios de go/no-go

1. **Sandbox Meta:** criar app, test WABA/número, adicionar somente o telefone do dono, enviar `hello_world`, responder e validar mensagem livre na janela; validar webhooks `sent/delivered/read/failed`. ([Meta — Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started))
2. **Opt-in:** implementar tela com texto/versionamento, registrar prova, opt-out e teste de supressão antes de qualquer template customizado. ([Meta — Get opt-in](https://developers.facebook.com/docs/whatsapp/overview/getting-opt-in/))
3. **Template:** submeter a versão mínima em `pt_BR` como Utility, sem marketing; não avançar até `APPROVED`; registrar categoria efetiva e simular pausa/recategorização. ([Meta — Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines))
4. **Sender de produção:** adquirir/dedicar número, verificar SMS/voz, configurar PIN, método de pagamento, system user e endpoint Live. Confirmar que o número deixa de ser utilizável no WhatsApp comum antes da migração. ([Meta — Phone numbers](https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers))
5. **Entrega e resiliência:** testar duplicata de webhook, 5xx e retry, falha definitiva, TTL, backoff, idempotência e fallback; confirmar que só `delivered` encerra o evento.
6. **Custo real:** enviar pequeno lote para número +55 fora da janela, conferir categoria e valor no Billing/analytics, incluir impostos e custo de hospedagem; ativar hard cap. **Go** somente se custo total projetado ≤ R$150 e reserva WhatsApp ≤ R$50.
7. **Operação por 30 dias:** acompanhar opt-outs, bloqueios, qualidade, taxa de entrega/leitura, custo por entrega e incidentes; revisar tarifas antes de cada trimestre e obrigatoriamente antes da mudança anunciada de 1º/10/2026. ([Meta — Pricing](https://developers.facebook.com/docs/whatsapp/pricing/))

## Recomendação e fallback

**Recomendação:** implementar **Cloud API direta** como canal opcional, começando pelo próprio dono, com um único template Utility, opt-in explícito, número dedicado, webhook idempotente e orçamento de canal de R$50/mês. Ela é oficial, tem menor custo confirmado que o BSP e dispensa App Review para uso dos próprios ativos. O volume pessoal cabe folgadamente no tier inicial e no teto, desde que a categoria Utility seja mantida e a hospedagem total seja barata. ([Meta — App Review](https://developers.facebook.com/docs/whatsapp/embedded-signup/app-review/), [Meta — Messaging Limits](https://developers.facebook.com/docs/whatsapp/messaging-limits/), [Meta — Pricing](https://developers.facebook.com/docs/whatsapp/pricing/))

**Fallback operacional:** manter e-mail/push/in-app como canal primário de contingência quando sender/template estiver pendente, pausado, sem entrega, acima da reserva ou quando a Meta estiver indisponível. Não usar automação de WhatsApp Web, bibliotecas não oficiais nem conta pessoal.

**Fallback de integração:** se o onboarding direto ou a manutenção da Graph API/webhook consumir tempo excessivo, testar um BSP oficial com cobrança pay-as-you-go (Twilio é o comparável documentado), aceitando seu adicional por mensagem. Um BSP **não** é fallback para rejeição de política, falta de opt-in ou template reprovado: esses controles continuam sendo da Meta. ([Twilio — FAQs](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs), [Twilio — Pricing](https://www.twilio.com/en-us/whatsapp/pricing))

## Lacunas que exigem cadastro/teste

- Se “NotifyFin” e seu display name passarão nas verificações automáticas sem CNPJ/registro ou presença pública; a documentação permite começar sem business verification, mas não garante o resultado individual.
- Se o texto exato será aprovado e permanecerá em Utility; classificação é decidida/reavaliada pela Meta.
- Tarifa, tributos e forma de cobrança efetivos da WABA criada no Brasil, especialmente após a alteração anunciada para 1º/10/2026.
- Custo do número dedicado e da hospedagem do backend/webhook dentro da arquitetura ainda a escolher.
- Termos, suporte, SLA e custo total de qualquer BSP alternativo; exigem proposta/conta, não devem ser inferidos da Twilio.
- Requisitos jurídicos finais para tratar dados financeiros e compartilhar conteúdo de alerta com a Meta/WhatsApp; requer revisão de privacidade/LGPD antes de abrir o serviço a terceiros.
