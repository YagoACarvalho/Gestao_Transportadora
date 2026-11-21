import { Input } from '../../ui';
import { useEffect, useId, useState } from 'react';
import { fretesApi } from './fretesApi';
import type { Endereco } from './types';
import styles from './Fretes.module.css';

export function CampoEndereco({ label, value, onChange, disabled, buscar = true }: { label: string; value: Endereco; onChange: (v: Endereco) => void; disabled: boolean; buscar?: boolean }) {
  const id = useId();
  const [sugestoes, setSugestoes] = useState<Endereco[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  useEffect(() => {
    setSugestoes([]); setAtivo(-1); setMensagem('');
    if (disabled || !buscar || value.ponto || value.texto.trim().length < 4) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setMensagem('Buscando endereços…');
      fretesApi.sugerir(value.texto, controller.signal).then(lista => {
        if (!controller.signal.aborted) { setSugestoes(lista); setMensagem(lista.length ? '' : 'Nenhuma sugestão. Detalhe cidade, estado e endereço.'); }
      }).catch(e => { if (!controller.signal.aborted) setMensagem(e instanceof Error ? e.message : 'Não foi possível buscar sugestões.'); });
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value.texto, value.ponto, disabled, buscar]);
  function escolher(v: Endereco) { onChange(v); setSugestoes([]); setAberto(false); }
  const visivel = aberto && sugestoes.length > 0;
  return <div className={styles.field} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setAberto(false); }}>
    <label htmlFor={id}>{label}</label>
    <Input id={id} role="combobox" autoComplete="off" required minLength={4} maxLength={250} value={value.texto} disabled={disabled}
      aria-autocomplete="list" aria-expanded={visivel} aria-controls={`${id}-opcoes`} aria-activedescendant={visivel && ativo >= 0 ? `${id}-${ativo}` : undefined} aria-describedby={`${id}-ajuda`}
      onFocus={() => setAberto(true)} onChange={e => { onChange({ texto: e.target.value }); setAberto(true); }}
      onKeyDown={e => {
        if (e.key === 'Escape') setAberto(false);
        if (visivel && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); setAtivo(i => e.key === 'ArrowDown' ? (i + 1) % sugestoes.length : i <= 0 ? sugestoes.length - 1 : i - 1); }
        if (visivel && e.key === 'Enter' && ativo >= 0) { e.preventDefault(); escolher(sugestoes[ativo]); }
      }} />
    <span id={`${id}-ajuda`} className={styles.caption} role="status">{value.ponto ? 'Endereço selecionado. Edite o texto para buscar outro.' : mensagem || 'Informe endereço, cidade e estado; escolha uma sugestão para maior precisão.'}</span>
    {visivel && <ul id={`${id}-opcoes`} role="listbox" aria-label={`Sugestões de ${label}`} className={styles.suggestions}>
      {sugestoes.map((s, i) => <li id={`${id}-${i}`} key={`${s.texto}-${i}`} role="option" aria-selected={ativo === i} onMouseDown={e => e.preventDefault()} onClick={() => escolher(s)}>{s.texto}</li>)}
    </ul>}
  </div>;
}
