import { PageHeader as UiPageHeader } from '../ui';
import type { ReactNode } from 'react';

export function PageHeader({ title = 'Motoristas', description = 'Os profissionais que movimentam sua operação.', action }: { title?: string; description?: string; action?: ReactNode }) {
  return <UiPageHeader title={title} subtitle={description} actions={action} />;
}
