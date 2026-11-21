import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, Ref } from 'react';
import { CaixaEntrada } from './v2/base';
import styles from './Fields.module.css';
export function Input({ type, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue'> & { value?: string | number; defaultValue?: string | number; ref?: Ref<HTMLInputElement> }) {
  if (type === 'checkbox' || type === 'radio' || type === 'range') return <input type={type} {...props} />;
  return <CaixaEntrada data-field-shell desabilitado={props.disabled} invalido={props['aria-invalid'] === true || props['aria-invalid'] === 'true'}><input type={type} {...props} /></CaixaEntrada>;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <CaixaEntrada data-field-shell desabilitado={props.disabled}><select {...props} className={[styles.select, props.className].filter(Boolean).join(' ')} /></CaixaEntrada>;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <CaixaEntrada data-field-shell multilinha desabilitado={props.disabled}><textarea {...props} /></CaixaEntrada>;
}
