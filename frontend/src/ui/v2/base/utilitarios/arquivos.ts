export type TipoArquivo =
  | 'pdf'
  | 'documento'
  | 'planilha'
  | 'apresentacao'
  | 'imagem'
  | 'audio'
  | 'video'
  | 'compactado'
  | 'codigo'
  | 'pasta'
  | 'link'
  | 'arquivo'

const EXTENSOES: Record<string, TipoArquivo> = {
  pdf: 'pdf',
  doc: 'documento',
  docx: 'documento',
  odt: 'documento',
  rtf: 'documento',
  txt: 'documento',
  md: 'documento',
  xls: 'planilha',
  xlsx: 'planilha',
  ods: 'planilha',
  csv: 'planilha',
  ppt: 'apresentacao',
  pptx: 'apresentacao',
  odp: 'apresentacao',
  key: 'apresentacao',
  png: 'imagem',
  jpg: 'imagem',
  jpeg: 'imagem',
  gif: 'imagem',
  webp: 'imagem',
  avif: 'imagem',
  svg: 'imagem',
  heic: 'imagem',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  oga: 'audio',
  m4a: 'audio',
  aac: 'audio',
  flac: 'audio',
  mp4: 'video',
  mov: 'video',
  mkv: 'video',
  avi: 'video',
  webm: 'video',
  zip: 'compactado',
  rar: 'compactado',
  '7z': 'compactado',
  tar: 'compactado',
  gz: 'compactado',
  js: 'codigo',
  ts: 'codigo',
  tsx: 'codigo',
  jsx: 'codigo',
  json: 'codigo',
  html: 'codigo',
  css: 'codigo',
  py: 'codigo',
  sql: 'codigo',
}

const ROTULOS: Record<TipoArquivo, string> = {
  pdf: 'PDF',
  documento: 'Documento',
  planilha: 'Planilha',
  apresentacao: 'Apresentação',
  imagem: 'Imagem',
  audio: 'Áudio',
  video: 'Vídeo',
  compactado: 'Compactado',
  codigo: 'Código',
  pasta: 'Pasta',
  link: 'Link',
  arquivo: 'Arquivo',
}

export function detectarTipoArquivo(nome: string, mime?: string): TipoArquivo {
  if (mime?.startsWith('image/')) return 'imagem'
  if (mime?.startsWith('audio/')) return 'audio'
  if (mime?.startsWith('video/')) return 'video'
  if (mime === 'application/pdf') return 'pdf'
  const partes = nome.toLowerCase().split('.')
  if (partes.length < 2) return 'arquivo'
  return EXTENSOES[partes[partes.length - 1]] ?? 'arquivo'
}

export function rotuloDoTipo(tipo: TipoArquivo) {
  return ROTULOS[tipo]
}

const UNIDADES = ['B', 'KB', 'MB', 'GB', 'TB']

export function formatarTamanho(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  let valor = bytes
  let unidade = 0
  while (valor >= 1024 && unidade < UNIDADES.length - 1) {
    valor /= 1024
    unidade++
  }
  const casas = unidade === 0 || valor >= 100 ? 0 : 1
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })} ${UNIDADES[unidade]}`
}
