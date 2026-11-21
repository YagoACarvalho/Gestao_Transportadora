import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fretesApi } from './fretesApi';
import type { ResultadoFrete } from './types';
import styles from './Fretes.module.css';

export function MapaRota({ resultado }: { resultado: ResultadoFrete }) {
  const container = useRef<HTMLDivElement>(null);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let dispose = false; let map: Leaflet.Map | undefined;
    const controllers = new Set<AbortController>();
    setErro('');
    import('leaflet').then(L => {
      if (dispose || !container.current) return;
      map = L.map(container.current, { scrollWheelZoom: false, preferCanvas: true });
      class TilesAutenticados extends L.GridLayer {
      createTile(coords: Leaflet.Coords, done: Leaflet.DoneCallback) {
        const img = document.createElement('img'); img.alt = ''; img.width = 256; img.height = 256;
        const controller = new AbortController(); controllers.add(controller);
        img.addEventListener('load', () => done(undefined, img), { once: true });
        fretesApi.tile(coords.z, coords.x, coords.y, controller.signal).then(blob => {
          if (dispose || controller.signal.aborted) return;
          // data: já é permitido pela CSP existente; não liberar blob: ou hosts externos.
          const reader = new FileReader();
          reader.onload = () => { if (!dispose && !controller.signal.aborted) img.src = String(reader.result); };
          reader.onerror = () => done(new Error('Imagem inválida'), img);
          reader.readAsDataURL(blob);
        }).catch(() => { if (!dispose && !controller.signal.aborted) { setErro('Fundo do mapa indisponível. O trajeto e as distâncias continuam disponíveis.'); done(new Error('Mapa indisponível'), img); } }).finally(() => controllers.delete(controller));
        return img;
      }
      }
      const tiles = new TilesAutenticados({ attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19, keepBuffer: 0, updateWhenIdle: true });
      tiles.addTo(map);
      const cor = (token: string) => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      const ida = L.polyline(resultado.trajetoIda.map(p => [p.lat, p.lon] as Leaflet.LatLngTuple), { color: cor('--aleph-azul'), weight: 5 }).addTo(map);
      if (resultado.trajetoRetorno.length) L.polyline(resultado.trajetoRetorno.map(p => [p.lat, p.lon] as Leaflet.LatLngTuple), { color: cor('--app-sucesso-texto'), weight: 4, dashArray: '8 8' }).addTo(map);
      resultado.enderecos.forEach((e, i) => {
        if (!e.ponto) return;
        // Tooltip usa nó de texto, nunca HTML retornado pelo geocodificador.
        const tooltip = document.createElement('span'); tooltip.textContent = `${i + 1}. ${e.texto}`;
        L.circleMarker([e.ponto.lat, e.ponto.lon], { radius: 7, color: cor('--aleph-escuro'), fillColor: cor('--aleph-superficie'), fillOpacity: 1 }).bindTooltip(tooltip).addTo(map!);
      });
      if (ida.getBounds().isValid()) map.fitBounds(ida.getBounds().extend(resultado.trajetoRetorno.map(p => [p.lat, p.lon] as Leaflet.LatLngTuple)), { padding: [24, 24], maxZoom: 14 });
      const observer = new ResizeObserver(() => map?.invalidateSize()); observer.observe(container.current);
      map.on('unload', () => observer.disconnect());
    }).catch(() => { if (!dispose) setErro('Não foi possível carregar o mapa. Consulte os trechos abaixo.'); });
    return () => { dispose = true; controllers.forEach(c => c.abort()); map?.remove(); };
  }, [resultado]);
  return <><div ref={container} className={styles.map} aria-label="Mapa do trajeto: ida contínua e retorno tracejado" />{erro && <p role="status">{erro}</p>}<p className={styles.caption}>Ida em linha contínua; retorno em linha tracejada. Roteamento © openrouteservice / HeiGIT, dados © OpenStreetMap.</p></>;
}
