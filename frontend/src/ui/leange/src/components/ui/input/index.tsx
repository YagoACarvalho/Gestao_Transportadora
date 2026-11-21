

import styled from "@emotion/styled";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode, Ref } from "react";
import { NumberFormatBase, patternFormatter } from "react-number-format";
import { formatNumeric, isNumericMask, numericAffix, patternOf, trimToNumeric, trimToPattern, type InputMask } from "../../../lib/masks";
import { FieldAdornment, FieldAffix, FieldShell } from "../field-shell";
import type { ControlSize } from "../styles";


export type InputProps = Omit<ComponentPropsWithoutRef<"input">, "size" | "value" | "defaultValue"> & {
  value?: string | number;
  defaultValue?: string | number;
  size?: ControlSize;
  invalid?: boolean;
  /** Dentro de um controle composto ou numa edição em linha, sem outro FieldShell. */
  appearance?: "field" | "plain";
  mask?: InputMask;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLInputElement>;
};

const Control = styled.input`
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 0;
  font: inherit;
  letter-spacing: var(--tracking-tight);
  color: inherit;
  background: transparent;
  border: 0;

  @media (hover: hover) {
    &:focus-visible {
      outline: none;
    }
  }
`;

type ControlProps = Omit<InputProps, "size" | "invalid" | "appearance" | "iconStart" | "iconEnd">;

// O elemento nativo também passa pelo Input quando o layout já fornece a superfície.
const PlainControl = styled.input``;

function MaskedControl({ mask, type: _type, appearance, ref, ...props }: ControlProps & { mask: InputMask; appearance?: "field" | "plain" }) {
  if (isNumericMask(mask)) {
    return (
      <NumberFormatBase
        customInput={appearance === "plain" ? PlainControl : Control}
        getInputRef={ref}
        type="text"
        inputMode="decimal"
        format={(value) => formatNumeric(mask, value)}
        removeFormatting={trimToNumeric}
        {...props}
      />
    );
  }

  return (
    <NumberFormatBase
      customInput={appearance === "plain" ? PlainControl : Control}
      getInputRef={ref}
      type={mask === "phone" || mask === "tel" ? "tel" : "text"}
      inputMode="numeric"
      format={(value) => patternFormatter(value, { format: patternOf(mask, value), patternChar: "#" })}
      removeFormatting={(value) => trimToPattern(mask, value)}
      {...props}
    />
  );
}

export function Input({
  size = "md",
  invalid = false,
  appearance = "field",
  mask,
  iconStart,
  iconEnd,
  className,
  style,
  ...props
}: InputProps) {
  const flagged = invalid || props["aria-invalid"] === true || props["aria-invalid"] === "true";
  const control = { ...props, "aria-invalid": flagged || undefined };
  const affix = mask && isNumericMask(mask) ? numericAffix[mask] : undefined;

  if (appearance === "plain") {
    return mask
      ? <MaskedControl mask={mask} appearance="plain" className={className} style={style} {...control} />
      : <PlainControl className={className} style={style} {...control} />;
  }

  return (
    <FieldShell size={size} invalid={flagged} className={className} style={style}>
      {iconStart && <FieldAdornment>{iconStart}</FieldAdornment>}
      {affix?.prefix && <FieldAffix>{affix.prefix}</FieldAffix>}
      {mask ? <MaskedControl mask={mask} {...control} /> : <Control {...control} />}
      {affix?.suffix && <FieldAffix>{affix.suffix}</FieldAffix>}
      {iconEnd && <FieldAdornment>{iconEnd}</FieldAdornment>}
    </FieldShell>
  );
}

/** O controle nativo do campo, para os campos compostos desta pasta (o telefone com país) não recriarem o `<input>`. */
export { Control as FieldControl };
