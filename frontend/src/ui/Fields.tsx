import styled from '@emotion/styled';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, Ref } from 'react';
import { Input as LeangeInput } from './leange/src/components/ui/input';
import { fieldMetrics, focusRing, disabledState } from './leange/src/components/ui/styles';

const CheckControl = styled.input`
  accent-color: var(--color-accent);
  width: 1.125rem; height: 1.125rem; flex-shrink: 0;
  ${focusRing}
`;
export function Input({ type, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue'> & { value?: string | number; defaultValue?: string | number; ref?: Ref<HTMLInputElement> }) {
  if (type === 'checkbox' || type === 'radio' || type === 'range') return <CheckControl type={type} {...props} />;
  return <LeangeInput type={type} {...props} />;
}

// Adaptação nativa do seletor Leange: preserva opções/validação e a navegação por teclado já usadas nos formulários.
const SelectControl = styled.select`
  ${fieldMetrics('md')}
  ${focusRing}
  ${disabledState}
  min-width: 0; width: 100%; color: var(--color-label);
  font: inherit; font-size: var(--text-subheadline);
  background: var(--color-bg-grouped-secondary);
  border: 1px solid var(--color-control-border); border-radius: var(--control-radius-md);
  padding-inline: var(--space-3); cursor: pointer;
  &[aria-invalid='true'] { border-color: var(--color-danger); }
`;
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <SelectControl {...props} />; }
const AreaControl = styled.textarea`
  ${focusRing}
  font: inherit; color: var(--color-label); background: var(--color-bg-grouped-secondary);
  border: 1px solid var(--color-control-border); border-radius: var(--radius-md);
  padding: var(--space-3); min-height: calc(var(--control-height-md) * 2); width: 100%; resize: vertical;
`;
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <AreaControl {...props} />; }
