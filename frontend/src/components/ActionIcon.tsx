import { EyeIcon } from '@phosphor-icons/react/dist/csr/Eye';
import { PencilSimpleIcon } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { PowerIcon } from '@phosphor-icons/react/dist/csr/Power';
import { PlayIcon } from '@phosphor-icons/react/dist/csr/Play';
import { PauseIcon } from '@phosphor-icons/react/dist/csr/Pause';
import { CheckIcon } from '@phosphor-icons/react/dist/csr/Check';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { ReceiptIcon } from '@phosphor-icons/react/dist/csr/Receipt';
import { TrashIcon } from '@phosphor-icons/react/dist/csr/Trash';
import { ChartBarIcon } from '@phosphor-icons/react/dist/csr/ChartBar';
const icons = { detalhes: EyeIcon, editar: PencilSimpleIcon, reativar: ArrowClockwiseIcon, desativar: PowerIcon, iniciar: PlayIcon, pausar: PauseIcon, concluir: CheckIcon, cancelar: XIcon, despesa: ReceiptIcon, excluir: TrashIcon, financeiro: ChartBarIcon };
export function ActionIcon({ acao }: { acao: keyof typeof icons }) { const Icon = icons[acao]; return <Icon size={16} weight="regular" aria-hidden="true" focusable="false" />; }
