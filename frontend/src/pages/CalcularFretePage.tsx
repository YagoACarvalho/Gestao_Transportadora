import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Badge, Button, Card, EmptyState, PageHeader } from '../ui';
import { CampoEndereco } from '../features/fretes/CampoEndereco';
import { MapaRota } from '../features/fretes/MapaRota';
import { fretesApi } from '../features/fretes/fretesApi';
import { codificarSimulacao, custosValidos } from '../features/fretes/simulacao';
import { decodificarSimulacao, entradaInicial, guardarCustos, lerCustos, linkGoogleMaps, precoFrete, validarEntrada } from '../features/fretes/simulacao';
import type { Cenario, CustosFrete, EntradaFrete, OpcoesFrete, ResultadoFrete } from '../features/fretes/types';
import { dataCivil, km, moeda } from '../features/fretes/types';
import styles from '../features/fretes/Fretes.module.css';

function inicio() {
  const parametro = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('simulacao');
  if (parametro) {
    try { return { ...decodificarSimulacao(parametro), aviso: 'Simulação carregada do link. Confira os dados e clique em Calcular frete para atualizar os valores.' }; }
    catch (e) { return { entrada: entradaInicial(''), custos: lerCustos(), aviso: e instanceof Error ? e.message : 'Link inválido.' }; }
  }
  return { entrada: entradaInicial(''), custos: lerCustos(), aviso: '' };
}
function Preco({ resultado, custos }: { resultado: ResultadoFrete; custos: CustosFrete }) {
  try {
    const preco = precoFrete(resultado, custos);
    return <><p className={styles.total}>{moeda(preco.sugerido)}</p><p>{resultado.pedagio === null ? 'Preço parcial: falta informar o pedágio.' : 'Preço sugerido para negociação.'}</p>
      <div className={styles.totals}><div>Custo próprio<strong>{moeda(preco.custo)}</strong></div><div>Combustível<strong>{moeda(preco.combustivel)}</strong></div></div>
      <p className={styles.caption}>Maior valor entre piso com adicionais e custo próprio acrescido de {custos.margem}% sobre o custo. Não representa margem líquida.</p></>;
  } catch (e) { return <p>{e instanceof Error ? e.message : 'Revise os custos.'}</p>; }
}
function Folha({ cenario }: { cenario: Cenario }) {
  const { entrada: e, resultado: r, custos } = cenario;
  return createPortal(<article className={styles.printSheet} aria-label="Folha de simulação de frete">
    <h1>Simulação de frete</h1><p>Referência: {dataCivil(e.dataReferencia)} · {r.norma} · Vigência: {dataCivil(r.vigencia)}</p>
    <section><h2>Trajeto</h2><ol>{r.enderecos.map((p, i) => <li key={i}>{p.texto}{i < r.trechosKm.length && ` — próximo trecho: ${km(r.trechosKm[i])}`}</li>)}</ol>
      <p>Ida: {km(r.distanciaKm)} · Retorno vazio: {km(r.distanciaRetornoKm)}</p></section>
    <section><h2>Carga e contratação</h2><p>{e.eixos} eixos · {e.contratacao === 'tracao' ? 'Unidade de tração' : 'Composição veicular'} · Tabela {r.coeficientes.tabela} · Tipo de carga {e.tipoCarga}</p>
      <p>CCD: {r.coeficientes.ccd.toLocaleString('pt-BR', { minimumFractionDigits: 4 })} R$/km · CC: {moeda(r.coeficientes.cc)}</p>
      <p>Altura: {e.altura ?? 'não informada'} m; largura: {e.largura ?? 'não informada'} m; comprimento: {e.comprimento ?? 'não informado'} m; peso: {e.peso ?? 'não informado'} t.</p></section>
    <section><h2>Valores</h2><table><tbody>{[['Piso de ida', moeda(r.pisoIda)], ['Retorno vazio', moeda(r.retornoVazio)], ['Piso ANTT total', moeda(r.pisoTotal)], ['Pedágio', r.pedagio === null ? 'Pendente' : moeda(r.pedagio)], ['Adicionais', moeda(r.adicionais)], ['Total da operação', moeda(r.totalOperacao)]].map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
      <h2>Preço sugerido</h2><Preco resultado={r} custos={custos} /><p>Consumo: {custos.consumo} km/l; diesel: {moeda(custos.diesel)}/l; outros custos: {moeda(custos.outrosPorKm)}/km; fixos: {moeda(custos.fixos)}.</p></section>
    <section><h2>Observações</h2>{r.avisos.map(a => <p key={a}>{a}</p>)}<p>Fonte: {r.fonte}</p><p>Simulação sem reserva ou registro financeiro. Confira as condições reais da operação.</p></section>
  </article>, document.body);
}

export function CalcularFretePage() {
  const [inicial] = useState(inicio);
  const [entrada, setEntrada] = useState(inicial.entrada);
  const [custos, setCustos] = useState(inicial.custos);
  const [opcoes, setOpcoes] = useState<OpcoesFrete | null>(null);
  const [resultado, setResultado] = useState<ResultadoFrete | null>(null);
  const [cenarios, setCenarios] = useState<Cenario[]>([]);
  const [erro, setErro] = useState('');
  const [erroOpcoes, setErroOpcoes] = useState('');
  const [mensagem, setMensagem] = useState(inicial.aviso);
  const [busy, setBusy] = useState(false);
  const [revisao, setRevisao] = useState(0);
  const [avancado, setAvancado] = useState(false);
  const request = useRef<AbortController | null>(null);
  const resultadoRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const controller = new AbortController(); setErroOpcoes('');
    fretesApi.opcoes(controller.signal).then(o => {
      if (!controller.signal.aborted) { setOpcoes(o); setEntrada(e => e.dataReferencia ? e : { ...e, dataReferencia: o.hoje }); }
    }).catch(e => { if (!controller.signal.aborted) setErroOpcoes(e instanceof Error ? e.message : 'Não foi possível carregar as opções.'); });
    return () => controller.abort();
  }, [revisao]);
  useEffect(() => { guardarCustos(custos); }, [custos]);
  useEffect(() => () => { request.current?.abort(); document.body.classList.remove('imprimindo-frete'); }, []);
  useEffect(() => {
    const limpar = () => document.body.classList.remove('imprimindo-frete'); window.addEventListener('afterprint', limpar);
    return () => window.removeEventListener('afterprint', limpar);
  }, []);
  function mudar(patch: Partial<EntradaFrete>) { request.current?.abort(); setEntrada(e => ({ ...e, ...patch })); setResultado(null); setErro(''); setMensagem(''); }
  async function calcular(event: FormEvent) {
    event.preventDefault(); setErro(''); setMensagem(''); setResultado(null);
    try {
      validarEntrada(entrada);
      if (opcoes && (entrada.dataReferencia < opcoes.primeiraVigencia || entrada.dataReferencia > opcoes.hoje)) throw new Error('Escolha uma data entre a primeira vigência disponível e hoje.');
      request.current?.abort(); const controller = new AbortController(); request.current = controller; setBusy(true);
      try { const r = await fretesApi.calcular(entrada, controller.signal); if (!controller.signal.aborted) { setResultado(r); window.setTimeout(() => resultadoRef.current?.focus(), 0); } }
      finally { if (request.current === controller) setBusy(false); }
    } catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) { setErro(e instanceof Error ? e.message : 'Não foi possível calcular o frete.'); setAvancado(true); } }
  }
  const cenarioAtual = (): Cenario => ({ entrada: structuredClone(entrada), resultado: structuredClone(resultado!), custos: { ...custos }, criadoEm: new Date().toISOString() });
  async function copiar() {
    try {
      const url = new URL(window.location.href); url.search = ''; url.hash = `/calcular-frete?simulacao=${codificarSimulacao(entrada, custos)}`;
      await navigator.clipboard.writeText(url.toString()); setMensagem('Link copiado. Ele contém os endereços e os parâmetros da simulação; o destinatário precisa entrar no sistema e recalcular.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível copiar o link.'); }
  }
  function imprimir() { document.body.classList.add('imprimindo-frete'); try { window.print(); } finally { document.body.classList.remove('imprimindo-frete'); } }
  const numero = (campo: 'eixos' | 'altura' | 'largura' | 'comprimento' | 'peso' | 'pedagio' | 'adicionais', label: string, max: number, step = '.01') => <div className={styles.field}>
    <label htmlFor={`frete-${campo}`}>{label}</label><input id={`frete-${campo}`} type="number" min={campo === 'eixos' ? 2 : ['altura', 'largura', 'comprimento', 'peso'].includes(campo) ? .1 : 0} max={max} step={step} required={campo === 'eixos' || campo === 'adicionais'} value={entrada[campo] ?? ''} onChange={e => mudar({ [campo]: e.target.value === '' ? null : Number(e.target.value) })} />
  </div>;
  const custoCampo = (campo: keyof CustosFrete, label: string, max: number, min = 0) => <div className={styles.field}>
    <label htmlFor={`custo-${campo}`}>{label}</label><input id={`custo-${campo}`} type="number" min={min} max={max} step=".01" value={custos[campo]} onChange={e => setCustos(c => ({ ...c, [campo]: Number(e.target.value) }))} />
  </div>;
  return <>
    <PageHeader title="Calcular frete" subtitle="Planeje o trajeto e compare o piso ANTT com os custos da sua operação." />
    <div className={styles.surface}>
      {mensagem && <p role="status" className={styles.notice}>{mensagem}</p>}
      {erroOpcoes && <div role="alert"><p className={styles.error}>{erroOpcoes}</p><Button onClick={() => setRevisao(r => r + 1)}>Tentar novamente</Button></div>}
      {!opcoes && !erroOpcoes && <p role="status">Carregando opções da calculadora…</p>}
      {opcoes && !opcoes.mapasConfigurados && <p className={styles.notice} role="status">O serviço de rotas precisa ser configurado pelo responsável pelo sistema antes de calcular. Você já pode preparar os dados da simulação.</p>}
      <div className={styles.layout}>
        <form className={styles.stack} onSubmit={calcular} onInvalidCapture={() => setAvancado(true)}>
          <Card title="Coleta, paradas e entrega" span={12}>
            <fieldset disabled={busy} className={`${styles.stack} ${styles.fieldset}`}><legend className={styles.caption}>Endereços da operação no Brasil</legend>
              <CampoEndereco label="Coleta" value={entrada.origem} onChange={origem => mudar({ origem })} disabled={busy} buscar={!!opcoes?.mapasConfigurados} />
              {entrada.paradas.map((p, i) => <div key={i} className={styles.stack}><CampoEndereco label={`Parada ${i + 1}`} value={p} onChange={v => mudar({ paradas: entrada.paradas.map((p, j) => i === j ? v : p) })} disabled={busy} buscar={!!opcoes?.mapasConfigurados} /><Button variant="secondary" onClick={() => mudar({ paradas: entrada.paradas.filter((_, j) => i !== j) })}>Remover parada {i + 1}</Button></div>)}
              <Button variant="secondary" disabled={entrada.paradas.length >= 5} onClick={() => mudar({ paradas: [...entrada.paradas, { texto: '' }] })}>＋ Adicionar parada ({entrada.paradas.length}/5)</Button>
              <CampoEndereco label="Entrega" value={entrada.destino} onChange={destino => mudar({ destino })} disabled={busy} buscar={!!opcoes?.mapasConfigurados} />
            </fieldset><p className={styles.caption}>Distâncias calculadas pela rota de caminhão. O retorno vazio usa uma consulta própria, da entrega à coleta.</p>
          </Card>
          <Card title="Carga e contratação" span={12}>
            <fieldset disabled={busy} className={`${styles.fields} ${styles.fieldset}`}><legend className={styles.caption}>Dados para selecionar a tabela ANTT</legend>
              <div className={styles.field}><label htmlFor="tipo-carga">Tipo de carga</label><select id="tipo-carga" value={entrada.tipoCarga} onChange={e => mudar({ tipoCarga: Number(e.target.value) })}>{opcoes?.tiposCarga.map(t => <option value={t.id} key={t.id}>{t.nome}</option>)}</select></div>
              {numero('eixos', 'Eixos da composição (inclua suspensos)', 20, '1')}
              <div className={styles.field}><label htmlFor="contratacao">Contratação</label><select id="contratacao" value={entrada.contratacao} onChange={e => mudar({ contratacao: e.target.value as EntradaFrete['contratacao'] })}><option value="composicao">Composição veicular / caminhão simples</option><option value="tracao">Somente unidade de tração</option></select></div>
              <div className={styles.field}><label htmlFor="referencia">Data de referência</label><input id="referencia" required type="date" min={opcoes?.primeiraVigencia} max={opcoes?.hoje} value={entrada.dataReferencia} onChange={e => mudar({ dataReferencia: e.target.value })} /></div>
            </fieldset>
            <details className={styles.details} open={avancado} onToggle={e => setAvancado(e.currentTarget.open)}><summary>Enquadramento e medidas do veículo</summary>
              <fieldset disabled={busy} className={styles.fieldset}><legend className={styles.caption}>Parâmetros opcionais</legend>
                <label className={styles.check}><input type="checkbox" checked={entrada.altoDesempenho} onChange={e => mudar({ altoDesempenho: e.target.checked })} />Operação de alto desempenho</label><p className={styles.caption}>Use apenas quando a operação cumprir os critérios da ANTT e houver comprovação do enquadramento.</p>
                <label className={styles.check}><input type="checkbox" checked={entrada.retornoEspecial} onChange={e => mudar({ retornoEspecial: e.target.checked })} />Frota específica, dedicada ou fidelizada com retorno vazio obrigatório</label><p className={styles.caption}>Por razões sanitárias ou certificações que delimitem o produto transportado. Para contêineres, o retorno é incluído automaticamente.</p>
                <div className={styles.fields}>{numero('altura', 'Altura (m)', 6)}{numero('largura', 'Largura (m)', 4)}{numero('comprimento', 'Comprimento (m)', 40)}{numero('peso', 'Peso bruto (t)', 100)}</div>
              </fieldset>
            </details>
          </Card>
          <Card title="Pedágio e adicionais" span={12}><fieldset disabled={busy} className={`${styles.fields} ${styles.fieldset}`}><legend className={styles.caption}>Valores da operação completa</legend>{numero('pedagio', 'Pedágio total (R$, opcional)', 1000000)}{numero('adicionais', 'Adicionais negociados (R$)', 1000000)}</fieldset><p className={styles.caption}>Inclua ida e retorno, quando houver. Deixe o pedágio vazio enquanto não souber; informe zero somente se confirmar que não há cobrança.</p></Card>
          {erro && <p role="alert" className={styles.error}>{erro}</p>}
          <div className={styles.actions}><Button type="submit" disabled={busy || !opcoes?.mapasConfigurados}>{busy ? 'Calculando rota e piso…' : 'Calcular frete'}</Button>{busy && <Button variant="secondary" onClick={() => { request.current?.abort(); setBusy(false); }}>Cancelar cálculo</Button>}</div>
          <p className={styles.caption}>Os endereços são enviados ao provedor para calcular a rota. A simulação não cria viagens ou lançamentos financeiros.</p>
        </form>
        <div className={styles.stack}>
          {resultado ? <>
            <Card span={12} variant="navy"><h2 ref={resultadoRef} tabIndex={-1}>Piso mínimo ANTT</h2><p className={styles.total}>{moeda(resultado.pisoTotal)}</p><p>Ida {km(resultado.distanciaKm)}{resultado.distanciaRetornoKm > 0 && ` + retorno vazio ${km(resultado.distanciaRetornoKm)}`}</p><Badge>Tabela {resultado.coeficientes.tabela} · {resultado.coeficientes.eixosReferencia} eixos</Badge></Card>
            <Card title="Composição da operação" span={12}><div className={styles.totals}><div>Piso de ida<strong>{moeda(resultado.pisoIda)}</strong></div><div>Retorno vazio<strong>{moeda(resultado.retornoVazio)}</strong></div><div>Pedágio<strong>{resultado.pedagio === null ? 'Pendente' : moeda(resultado.pedagio)}</strong></div><div>Adicionais<strong>{moeda(resultado.adicionais)}</strong></div></div><p>Total {resultado.pedagio === null ? 'parcial' : 'da operação'}: <strong>{moeda(resultado.totalOperacao)}</strong></p>
              <details className={styles.details}><summary>Norma e coeficientes usados</summary><dl><div><dt>Norma / vigência</dt><dd>{resultado.norma} / {dataCivil(resultado.vigencia)}</dd></div><div><dt>CCD (R$/km)</dt><dd>{resultado.coeficientes.ccd.toLocaleString('pt-BR', { minimumFractionDigits: 4 })}</dd></div><div><dt>CC (carga e descarga)</dt><dd>{moeda(resultado.coeficientes.cc)}</dd></div></dl><a href={resultado.fonte} target="_blank" rel="noreferrer">Consultar fonte ANTT</a><p>Ida = km × CCD + CC. Retorno vazio = 0,92 × CCD × km de retorno.</p></details>
              {resultado.avisos.map(a => <p key={a} className={styles.notice}>{a}</p>)}
            </Card>
            <Card title="Trajeto encontrado" span={12}><MapaRota resultado={resultado} /><ol className={styles.route}>{resultado.enderecos.map((e, i) => <li key={i}>{e.texto}{i < resultado.trechosKm.length && <small>Próximo trecho: {km(resultado.trechosKm[i])}</small>}</li>)}</ol><p><a href={linkGoogleMaps(entrada)} target="_blank" rel="noreferrer">Abrir endereços no Google Maps</a></p><p className={styles.caption}>O Google Maps pode sugerir outro trajeto e não garante restrições para caminhões.</p></Card>
          </> : <Card span={12}><EmptyState title="Quanto custa esta operação?" description="Informe coleta, entrega e carga. Ao calcular, você verá o trajeto, o piso ANTT e os valores para negociar." /></Card>}
          <Card title="Custos próprios e preço sugerido" span={12}><div className={styles.fields}>{custoCampo('consumo', 'Consumo médio (km/l)', 100, .1)}{custoCampo('diesel', 'Preço do diesel (R$/l)', 100)}{custoCampo('outrosPorKm', 'Outros custos (R$/km)', 10000)}{custoCampo('fixos', 'Custos fixos da operação (R$)', 1000000)}{custoCampo('margem', 'Acréscimo sobre o custo (%)', 1000)}</div><p className={styles.caption}>Inclua manutenção, motorista, seguros e demais custos próprios, sem repetir combustível, pedágio e adicionais. As preferências de custo ficam apenas neste navegador.</p>{resultado && <Preco resultado={resultado} custos={custos} />}</Card>
          {resultado && <div className={styles.actions}><Button disabled={cenarios.length >= 4 || !custosValidos(custos)} onClick={() => { setCenarios(c => [...c, cenarioAtual()]); setMensagem('Cenário adicionado à comparação desta sessão.'); }}>Comparar cenário ({cenarios.length}/4)</Button><Button variant="secondary" onClick={copiar}>Copiar link</Button><Button variant="secondary" onClick={imprimir}>Imprimir / salvar PDF</Button></div>}
        </div>
      </div>
      {cenarios.length > 0 && <Card title="Comparação de cenários" span={12}><div className={styles.tableWrap}><table className={styles.table}><caption>Cenários calculados nesta sessão; não são salvos no sistema.</caption><thead><tr><th>Indicador</th>{cenarios.map((c, i) => <th key={i}>Cenário {i + 1}<p>{c.entrada.origem.texto} → {c.entrada.destino.texto}</p><Button variant="secondary" onClick={() => setCenarios(cs => cs.filter((_, j) => i !== j))}>Remover cenário {i + 1}</Button></th>)}</tr></thead><tbody>{['Ida', 'Retorno', 'Piso ANTT', 'Pedágio', 'Total da operação', 'Preço sugerido'].map((nome, linha) => <tr key={nome}><th>{nome}</th>{cenarios.map((c, i) => { const r = c.resultado; let preco = 'Custos incompletos'; try { preco = moeda(precoFrete(r, c.custos).sugerido); } catch { /* Não inventar preço. */ } return <td key={i}>{[km(r.distanciaKm), km(r.distanciaRetornoKm), moeda(r.pisoTotal), r.pedagio === null ? 'Pendente' : moeda(r.pedagio), moeda(r.totalOperacao), preco][linha]}{r.pedagio === null && linha >= 4 ? ' (parcial)' : ''}</td>; })}</tr>)}</tbody></table></div></Card>}
    </div>
    {resultado && <Folha cenario={cenarioAtual()} />}
  </>;
}
