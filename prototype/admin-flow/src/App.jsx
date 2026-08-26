// PROTÓTIPO THROWAWAY: três variantes do painel, alternáveis por ?variant=A|B|C.
// Estado sintético e somente em memória; nenhuma ação chama serviços reais.
import { useEffect, useMemo, useState } from 'react'

const VARIANTS = {
  A: 'Roteiro guiado',
  B: 'Central de operação',
  C: 'Fila de atenção',
}

const INITIAL_CATEGORIES = [
  { id: 'alimentacao', name: 'Alimentação', limit: 1200, spent: 930 },
  { id: 'moradia', name: 'Moradia', limit: 2500, spent: 2100 },
  { id: 'transporte', name: 'Transporte', limit: 700, spent: 610 },
]

const INITIAL_PENDING = [
  { id: 1, description: 'PADARIA CENTRAL', amount: 48.9, date: '18/03/2026' },
  { id: 2, description: 'PIX ENVIADO', amount: 180, date: '17/03/2026' },
  { id: 3, description: 'LOJA ONLINE', amount: 129.9, date: '16/03/2026' },
]

const CONNECTION_LABELS = {
  desconectada: 'Desconectada',
  consentimento: 'Aguardando consentimento',
  sincronizando: 'Sincronizando',
  atualizada: 'Atualizada',
  requerAcao: 'Requer ação do Titular',
  indisponivel: 'Indisponível temporariamente',
}

const money = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function usePrototypeState() {
  const [authenticated, setAuthenticated] = useState(false)
  const [connection, setConnection] = useState('desconectada')
  const [lastSync, setLastSync] = useState('Ainda não sincronizada')
  const [manualImport, setManualImport] = useState('vazio')
  const [cycleStart, setCycleStart] = useState(5)
  const [income, setIncome] = useState(7500)
  const [reserve, setReserve] = useState(1200)
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [channels, setChannels] = useState({ email: true, whatsapp: false })
  const [pending, setPending] = useState(INITIAL_PENDING)
  const [classified, setClassified] = useState([])
  const [notice, setNotice] = useState('Entre com a credencial previamente criada.')

  const login = () => {
    setAuthenticated(true)
    setNotice('Sessão do Titular iniciada neste protótipo.')
  }

  const connect = () => {
    setConnection('consentimento')
    setNotice('Connect Token efêmero simulado. Autorize o Banco Inter no Pluggy Connect.')
  }

  const authorize = () => {
    setConnection('sincronizando')
    setNotice('Consentimento confirmado. A primeira sincronização foi iniciada.')
  }

  const completeSync = () => {
    setConnection('atualizada')
    setLastSync('18/03/2026 às 10:42')
    setNotice('Conta-corrente e cartão reconciliados. Dados sintéticos atualizados.')
  }

  const expireConsent = () => {
    setConnection('requerAcao')
    setNotice('O consentimento expirou. A sincronização foi interrompida até a renovação.')
  }

  const failConnection = () => {
    setConnection('indisponivel')
    setNotice('A origem está indisponível. O histórico permanece e a importação manual está disponível.')
  }

  const selectCsv = () => {
    setManualImport('validando')
    setNotice('CSV canônico de exemplo selecionado; nenhuma linha foi publicada ainda.')
  }

  const validateCsv = () => {
    setManualImport('pronto')
    setNotice('12 linhas válidas. O Lote de importação está pronto para publicação integral.')
  }

  const publishCsv = () => {
    setManualImport('publicado')
    setLastSync('18/03/2026 às 10:47 (importação manual)')
    setNotice('Lote de importação publicado: 12 Observações financeiras, sem duplicatas.')
  }

  const classify = (expense, categoryId) => {
    const category = categories.find((item) => item.id === categoryId)
    if (!category) return
    setPending((current) => current.filter((item) => item.id !== expense.id))
    setClassified((current) => [...current, { ...expense, category: category.name }])
    setCategories((current) =>
      current.map((item) =>
        item.id === categoryId ? { ...item, spent: item.spent + expense.amount } : item,
      ),
    )
    setNotice(`${money(expense.amount)} classificado em ${category.name}; cálculos atualizados.`)
  }

  return {
    authenticated,
    connection,
    lastSync,
    manualImport,
    cycleStart,
    income,
    reserve,
    categories,
    channels,
    pending,
    classified,
    notice,
    login,
    logout: () => setAuthenticated(false),
    connect,
    authorize,
    completeSync,
    expireConsent,
    failConnection,
    renewConsent: connect,
    selectCsv,
    validateCsv,
    publishCsv,
    setCycleStart,
    setIncome,
    setReserve,
    setCategories,
    setChannels,
    classify,
  }
}

function StatusPill({ tone = 'neutral', children }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

function Notice({ children }) {
  return (
    <div className="notice" role="status" aria-live="polite">
      <span>Estado atualizado</span>
      <strong>{children}</strong>
    </div>
  )
}

function Login({ onLogin }) {
  const [password, setPassword] = useState('frase-secreta-de-demonstracao')
  return (
    <main className="login-shell">
      <section className="login-copy">
        <p className="eyebrow">PROTÓTIPO THROWAWAY · DADOS SINTÉTICOS</p>
        <h1>Suas finanças, dentro do que foi planejado.</h1>
        <p>
          Uma área privada para o único Titular acompanhar sincronização financeira, limites e
          diagnósticos — sem movimentar dinheiro.
        </p>
      </section>
      <form
        className="login-box"
        onSubmit={(event) => {
          event.preventDefault()
          onLogin()
        }}
      >
        <div className="brand-mark">N</div>
        <div>
          <p className="eyebrow">NotifyFin</p>
          <h2>Entrar no painel</h2>
        </div>
        <label>
          E-mail autorizado
          <input value="titular@exemplo.com" readOnly />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={14}
          />
        </label>
        <button className="button primary" type="submit">
          Entrar com a credencial criada
        </button>
        <small>Simulação local: não existe cadastro nem recuperação pública de senha.</small>
      </form>
    </main>
  )
}

function ConnectionPanel({ state, compact = false }) {
  const tone =
    state.connection === 'atualizada'
      ? 'success'
      : ['requerAcao', 'indisponivel'].includes(state.connection)
        ? 'danger'
        : 'warning'
  return (
    <section className={`module ${compact ? 'compact' : ''}`}>
      <header className="module-header">
        <div>
          <p className="eyebrow">Conta monitorada</p>
          <h2>Banco Inter</h2>
        </div>
        <StatusPill tone={tone}>{CONNECTION_LABELS[state.connection]}</StatusPill>
      </header>
      <p className="muted">Conta-corrente e cartão · última atualização: {state.lastSync}</p>

      {state.connection === 'desconectada' && (
        <button className="button primary" onClick={state.connect}>Conectar com Pluggy</button>
      )}
      {state.connection === 'consentimento' && (
        <div className="action-box">
          <strong>Pluggy Connect (simulado)</strong>
          <p>O backend entregou um Connect Token efêmero. Autorize somente os produtos desejados.</p>
          <div className="button-row">
            <button className="button primary" onClick={state.authorize}>Autorizar Banco Inter</button>
            <button className="button ghost" onClick={state.failConnection}>Simular erro</button>
          </div>
        </div>
      )}
      {state.connection === 'sincronizando' && (
        <div className="action-box progress-box">
          <div><strong>Reconciliando dados</strong><p>Histórico de até 90 dias · página 3 de 4</p></div>
          <button className="button primary" onClick={state.completeSync}>Concluir simulação</button>
        </div>
      )}
      {state.connection === 'atualizada' && (
        <div className="button-row">
          <button className="button secondary" onClick={() => { state.authorize() }}>Sincronizar agora</button>
          <button className="button ghost" onClick={state.expireConsent}>Simular consentimento expirado</button>
          <button className="button ghost danger-text" onClick={state.failConnection}>Simular indisponibilidade</button>
        </div>
      )}
      {state.connection === 'requerAcao' && (
        <div className="action-box danger-box">
          <strong>Renove o consentimento para receber novas movimentações.</strong>
          <p>O histórico local foi mantido; nenhum dado novo será sincronizado até a renovação.</p>
          <button className="button primary" onClick={state.renewConsent}>Renovar consentimento</button>
        </div>
      )}
      {state.connection === 'indisponivel' && (
        <div className="action-box danger-box">
          <strong>A Pluggy não respondeu.</strong>
          <p>Tente a conexão novamente ou mantenha o MVP atualizado com o CSV canônico.</p>
          <div className="button-row">
            <button className="button secondary" onClick={state.connect}>Tentar novamente</button>
            <a className="button ghost" href="#manual">Usar importação manual</a>
          </div>
        </div>
      )}
    </section>
  )
}

function ManualImportPanel({ state }) {
  const labels = {
    vazio: 'Nenhum arquivo selecionado',
    validando: 'Arquivo selecionado',
    pronto: '12 linhas válidas',
    publicado: 'Lote publicado',
  }
  return (
    <section className="module" id="manual">
      <header className="module-header">
        <div><p className="eyebrow">Fallback do MVP</p><h2>Importação manual</h2></div>
        <StatusPill tone={state.manualImport === 'publicado' ? 'success' : 'neutral'}>
          {labels[state.manualImport]}
        </StatusPill>
      </header>
      <p className="muted">
        Use o CSV canônico do NotifyFin na Conta monitorada selecionada. O arquivo original não é
        armazenado neste protótipo.
      </p>
      {state.manualImport === 'vazio' && (
        <button className="button primary" onClick={state.selectCsv}>Selecionar CSV de exemplo</button>
      )}
      {state.manualImport === 'validando' && (
        <div className="file-preview">
          <div><strong>inter-marco.csv</strong><span>12 linhas · Conta monitorada: Banco Inter</span></div>
          <button className="button primary" onClick={state.validateCsv}>Pré-validar lote</button>
        </div>
      )}
      {state.manualImport === 'pronto' && (
        <div className="action-box">
          <strong>Pronto para publicação integral</strong>
          <p>12 linhas válidas, 0 inválidas, 0 possíveis duplicatas. Ausências não serão tratadas como exclusão.</p>
          <button className="button primary" onClick={state.publishCsv}>Publicar Lote de importação</button>
        </div>
      )}
      {state.manualImport === 'publicado' && (
        <div className="success-line">✓ 12 Observações financeiras publicadas de forma idempotente.</div>
      )}
    </section>
  )
}

function SetupPanel({ state }) {
  const updateLimit = (id, value) => {
    state.setCategories((current) =>
      current.map((item) => (item.id === id ? { ...item, limit: Number(value) } : item)),
    )
  }
  return (
    <section className="module setup-module">
      <header className="module-header">
        <div><p className="eyebrow">Planejamento</p><h2>Ciclo financeiro e Limites de gasto</h2></div>
        <StatusPill tone="success">Configurado</StatusPill>
      </header>
      <div className="form-grid">
        <label>Dia inicial do Ciclo financeiro<input type="number" min="1" max="31" value={state.cycleStart} onChange={(e) => state.setCycleStart(Number(e.target.value))} /></label>
        <label>Renda planejada<input type="number" min="0" value={state.income} onChange={(e) => state.setIncome(Number(e.target.value))} /></label>
        <label>Meta de reserva<input type="number" min="0" value={state.reserve} onChange={(e) => state.setReserve(Number(e.target.value))} /></label>
      </div>
      <div className="category-table">
        <div className="table-head"><span>Categoria de gasto</span><span>Gasto</span><span>Limite de gasto</span></div>
        {state.categories.map((category) => (
          <div className="table-row" key={category.id}>
            <strong>{category.name}</strong>
            <span>{money(category.spent)}</span>
            <label className="money-input"><span>R$</span><input aria-label={`Limite de gasto de ${category.name}`} type="number" value={category.limit} onChange={(e) => updateLimit(category.id, e.target.value)} /></label>
          </div>
        ))}
      </div>
      <fieldset className="channels">
        <legend>Canais</legend>
        <label><input type="checkbox" checked={state.channels.email} onChange={(e) => state.setChannels({ ...state.channels, email: e.target.checked })} /> E-mail</label>
        <label><input type="checkbox" checked={state.channels.whatsapp} onChange={(e) => state.setChannels({ ...state.channels, whatsapp: e.target.checked })} /> WhatsApp (consentimento próprio)</label>
      </fieldset>
      <p className="inline-feedback">Alterações ficam apenas em memória neste protótipo.</p>
    </section>
  )
}

function ClassificationPanel({ state }) {
  const [choices, setChoices] = useState({})
  return (
    <section className="module">
      <header className="module-header">
        <div><p className="eyebrow">Revisão</p><h2>Gastos pendentes de classificação</h2></div>
        <StatusPill tone={state.pending.length ? 'warning' : 'success'}>{state.pending.length} pendentes</StatusPill>
      </header>
      <p className="muted">Eles já compõem o gasto total, mas ainda não reduzem um Limite de gasto específico.</p>
      <div className="classification-list">
        {state.pending.map((expense) => (
          <div className="classification-item" key={expense.id}>
            <div><strong>{expense.description}</strong><span>{expense.date} · {money(expense.amount)}</span></div>
            <select aria-label={`Categoria de gasto para ${expense.description}`} value={choices[expense.id] || ''} onChange={(e) => setChoices({ ...choices, [expense.id]: e.target.value })}>
              <option value="">Escolha a Categoria de gasto</option>
              {state.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
            </select>
            <button className="button secondary" disabled={!choices[expense.id]} onClick={() => state.classify(expense, choices[expense.id])}>Classificar</button>
          </div>
        ))}
        {!state.pending.length && <div className="empty-state">✓ Nenhum Gasto pendente de classificação.</div>}
      </div>
      {!!state.classified.length && <p className="success-line">Última revisão: {state.classified.at(-1).description} → {state.classified.at(-1).category}</p>}
    </section>
  )
}

function ReportsPanel({ state }) {
  const spent = state.categories.reduce((total, category) => total + category.spent, 0) + state.pending.reduce((total, item) => total + item.amount, 0)
  const future = 980
  const committed = state.income - state.reserve - spent - future
  const projected = committed - 420
  const cycleStatus = committed < 0 ? 'Planejamento comprometido' : projected < 0 ? 'Em risco' : 'Dentro do planejado'
  return (
    <section className="module reports-module">
      <header className="module-header">
        <div><p className="eyebrow">Ciclo de 05/03 a 04/04</p><h2>Diagnóstico financeiro</h2></div>
        <StatusPill tone={cycleStatus === 'Dentro do planejado' ? 'success' : 'warning'}>{cycleStatus}</StatusPill>
      </header>
      <div className="metric-grid">
        <article><span>Sobra comprometida</span><strong>{money(committed)}</strong><small>após reserva, gastos e compromissos</small></article>
        <article><span>Sobra projetada</span><strong>{money(projected)}</strong><small>estimativa determinística</small></article>
        <article><span>Pendentes</span><strong>{state.pending.length}</strong><small>{money(state.pending.reduce((sum, item) => sum + item.amount, 0))}</small></article>
      </div>
      <div className="diagnosis-copy">
        <div className="ai-badge">Resumo validado</div>
        <h3>O Ciclo financeiro segue dentro do planejado, com atenção a Transporte.</h3>
        <p>
          A Categoria de gasto Transporte está próxima do Limite de gasto. Revise os {state.pending.length} gastos pendentes para completar a análise por categoria.
        </p>
        <small>Gerado a partir de agregados não identificáveis · última atualização: {state.lastSync}</small>
      </div>
      <div className="alerts">
        <h3>Alertas recentes</h3>
        <div><span className="alert-dot" /><p><strong>Marco de alerta de Transporte</strong><small>80% do Limite de gasto · e-mail enviado em 17/03</small></p></div>
        <div><span className="alert-dot neutral" /><p><strong>Diagnóstico semanal disponível</strong><small>Mesmos fatos no painel, e-mail e WhatsApp</small></p></div>
      </div>
    </section>
  )
}

const FLOW_STEPS = [
  ['origem', 'Conectar'],
  ['planejamento', 'Planejar'],
  ['revisao', 'Revisar'],
  ['diagnostico', 'Acompanhar'],
]

function VariantA({ state }) {
  const [step, setStep] = useState('origem')
  const current = FLOW_STEPS.findIndex(([id]) => id === step)
  return (
    <div className="variant-a">
      <Header state={state} subtitle="Configuração guiada" />
      <div className="wizard-shell">
        <aside className="stepper">
          <p className="eyebrow">Roteiro mínimo</p>
          {FLOW_STEPS.map(([id, label], index) => (
            <button className={step === id ? 'active' : ''} onClick={() => setStep(id)} key={id}>
              <span>{index + 1}</span><div><strong>{label}</strong><small>{index < current ? 'Concluído' : index === current ? 'Em andamento' : 'A seguir'}</small></div>
            </button>
          ))}
        </aside>
        <main className="wizard-content">
          <div className="page-intro"><p>Etapa {current + 1} de {FLOW_STEPS.length}</p><h1>{FLOW_STEPS[current][1]}</h1></div>
          {step === 'origem' && <div className="stack"><ConnectionPanel state={state} /><ManualImportPanel state={state} /></div>}
          {step === 'planejamento' && <SetupPanel state={state} />}
          {step === 'revisao' && <ClassificationPanel state={state} />}
          {step === 'diagnostico' && <ReportsPanel state={state} />}
          <div className="wizard-actions">
            <button className="button ghost" disabled={current === 0} onClick={() => setStep(FLOW_STEPS[current - 1]?.[0])}>Voltar</button>
            <button className="button primary" disabled={current === FLOW_STEPS.length - 1} onClick={() => setStep(FLOW_STEPS[current + 1]?.[0])}>Continuar</button>
          </div>
        </main>
      </div>
      <Notice>{state.notice}</Notice>
      <StateInspector state={state} />
    </div>
  )
}

const NAV_ITEMS = [
  ['visao', 'Visão geral'],
  ['origens', 'Contas monitoradas'],
  ['planejamento', 'Planejamento'],
  ['revisao', 'Classificações'],
  ['diagnosticos', 'Alertas e diagnósticos'],
]

function VariantB({ state }) {
  const [section, setSection] = useState('visao')
  return (
    <div className="variant-b">
      <aside className="sidebar">
        <div className="sidebar-brand"><span>N</span><strong>NotifyFin</strong></div>
        <nav>{NAV_ITEMS.map(([id, label]) => <button className={section === id ? 'active' : ''} onClick={() => setSection(id)} key={id}>{label}{id === 'revisao' && state.pending.length > 0 && <b>{state.pending.length}</b>}</button>)}</nav>
        <div className="sidebar-account"><span>TF</span><div><strong>Titular</strong><small>Sessão protegida</small></div></div>
      </aside>
      <main className="operations-main">
        <div className="operations-top"><div><p className="eyebrow">Central de operação</p><h1>{NAV_ITEMS.find(([id]) => id === section)[1]}</h1></div><StatusPill tone={state.connection === 'atualizada' ? 'success' : 'warning'}>{CONNECTION_LABELS[state.connection]}</StatusPill></div>
        <Notice>{state.notice}</Notice>
        {section === 'visao' && (
          <div className="dashboard-grid">
            <section className="hero-status"><p className="eyebrow">Situação do Ciclo financeiro</p><h2>Dentro do planejado</h2><strong>{money(state.income - state.reserve - 4840)}</strong><span>Sobra comprometida</span><button className="text-button" onClick={() => setSection('diagnosticos')}>Abrir diagnóstico →</button></section>
            <ConnectionPanel state={state} compact />
            <section className="queue-card"><p className="eyebrow">Ação prioritária</p><strong>{state.pending.length} Gastos pendentes de classificação</strong><p>Complete a análise por categoria.</p><button className="button primary" onClick={() => setSection('revisao')}>Revisar agora</button></section>
            <section className="limits-card"><p className="eyebrow">Limites de gasto</p>{state.categories.map((category) => <div key={category.id}><span>{category.name}<b>{Math.round((category.spent / category.limit) * 100)}%</b></span><progress max="100" value={(category.spent / category.limit) * 100} /></div>)}</section>
          </div>
        )}
        {section === 'origens' && <div className="two-column"><ConnectionPanel state={state} /><ManualImportPanel state={state} /></div>}
        {section === 'planejamento' && <SetupPanel state={state} />}
        {section === 'revisao' && <ClassificationPanel state={state} />}
        {section === 'diagnosticos' && <ReportsPanel state={state} />}
        <StateInspector state={state} />
      </main>
    </div>
  )
}

function taskItems(state) {
  return [
    { id: 'connection', priority: state.connection === 'atualizada' ? 'ok' : 'high', title: state.connection === 'atualizada' ? 'Dados financeiros atualizados' : 'Conectar ou recuperar Banco Inter', meta: CONNECTION_LABELS[state.connection] },
    { id: 'classification', priority: state.pending.length ? 'high' : 'ok', title: `${state.pending.length} Gastos pendentes de classificação`, meta: 'Completar análise por Categoria de gasto' },
    { id: 'planning', priority: 'normal', title: 'Revisar planejamento', meta: `Ciclo inicia dia ${state.cycleStart} · Meta de reserva ${money(state.reserve)}` },
    { id: 'reports', priority: 'normal', title: 'Ler diagnóstico semanal', meta: 'Alerta de Transporte incluído' },
    { id: 'manual', priority: 'normal', title: 'Importar CSV canônico', meta: 'Fallback independente da conexão' },
  ]
}

function VariantC({ state }) {
  const [selected, setSelected] = useState('connection')
  const tasks = taskItems(state)
  return (
    <div className="variant-c">
      <Header state={state} subtitle="Hoje" />
      <main className="inbox-shell">
        <section className="inbox-list">
          <div className="inbox-heading"><p className="eyebrow">Fila de atenção</p><h1>O que precisa de você</h1><p>A prioridade muda conforme o estado em memória.</p></div>
          {tasks.map((task) => (
            <button className={`task-row ${selected === task.id ? 'selected' : ''}`} onClick={() => setSelected(task.id)} key={task.id}>
              <span className={`task-priority ${task.priority}`} />
              <div><strong>{task.title}</strong><small>{task.meta}</small></div><span>›</span>
            </button>
          ))}
          <Notice>{state.notice}</Notice>
        </section>
        <section className="focus-pane">
          <div className="focus-kicker"><span>Detalhe da atenção</span><StatusPill>Estado local</StatusPill></div>
          {selected === 'connection' && <ConnectionPanel state={state} />}
          {selected === 'classification' && <ClassificationPanel state={state} />}
          {selected === 'planning' && <SetupPanel state={state} />}
          {selected === 'reports' && <ReportsPanel state={state} />}
          {selected === 'manual' && <ManualImportPanel state={state} />}
          <StateInspector state={state} />
        </section>
      </main>
    </div>
  )
}

function Header({ state, subtitle }) {
  return (
    <header className="app-header">
      <div className="header-brand"><span>N</span><div><strong>NotifyFin</strong><small>{subtitle}</small></div></div>
      <div className="header-status"><StatusPill tone={state.connection === 'atualizada' ? 'success' : 'warning'}>{CONNECTION_LABELS[state.connection]}</StatusPill><span className="avatar">TF</span></div>
    </header>
  )
}

function StateInspector({ state }) {
  const snapshot = useMemo(() => ({
    sessao: state.authenticated ? 'ativa' : 'encerrada',
    contaMonitorada: CONNECTION_LABELS[state.connection],
    ultimaAtualizacao: state.lastSync,
    loteImportacao: state.manualImport,
    cicloFinanceiro: `dia ${state.cycleStart}`,
    rendaPlanejada: money(state.income),
    metaReserva: money(state.reserve),
    canais: Object.entries(state.channels).filter(([, enabled]) => enabled).map(([name]) => name),
    gastosPendentes: state.pending.length,
    gastosClassificadosNestaSessao: state.classified.length,
  }), [state.authenticated, state.connection, state.lastSync, state.manualImport, state.cycleStart, state.income, state.reserve, state.channels, state.pending.length, state.classified.length])
  return (
    <details className="state-inspector">
      <summary>Ver estado completo deste protótipo</summary>
      <pre>{JSON.stringify(snapshot, null, 2)}</pre>
    </details>
  )
}

function PrototypeSwitcher({ current, onChange }) {
  const keys = Object.keys(VARIANTS)
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
      const tag = event.target.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target.isContentEditable) return
      event.preventDefault()
      const index = keys.indexOf(current)
      const next = event.key === 'ArrowRight' ? (index + 1) % keys.length : (index - 1 + keys.length) % keys.length
      onChange(keys[next])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [current, keys, onChange])

  if (import.meta.env.PROD) return null
  const index = keys.indexOf(current)
  return (
    <div className="prototype-switcher" aria-label="Alternar variante do protótipo">
      <button aria-label="Variante anterior" onClick={() => onChange(keys[(index - 1 + keys.length) % keys.length])}>←</button>
      <div><small>PROTÓTIPO</small><strong>{current} — {VARIANTS[current]}</strong></div>
      <button aria-label="Próxima variante" onClick={() => onChange(keys[(index + 1) % keys.length])}>→</button>
    </div>
  )
}

export default function App() {
  const initial = new URLSearchParams(window.location.search).get('variant')?.toUpperCase()
  const [variant, setVariant] = useState(VARIANTS[initial] ? initial : 'A')
  const state = usePrototypeState()

  const changeVariant = (next) => {
    const url = new URL(window.location.href)
    url.searchParams.set('variant', next)
    window.history.replaceState({}, '', url)
    setVariant(next)
  }

  return (
    <>
      {!state.authenticated && <Login onLogin={state.login} />}
      {state.authenticated && variant === 'A' && <VariantA state={state} />}
      {state.authenticated && variant === 'B' && <VariantB state={state} />}
      {state.authenticated && variant === 'C' && <VariantC state={state} />}
      <PrototypeSwitcher current={variant} onChange={changeVariant} />
    </>
  )
}
