import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

export function Button({
  variant = 'primary',
  size = 'standard',
  loading = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: 'compact' | 'standard';
  loading?: boolean;
}) {
  return (
    <button className={`button ${variant} ${size}`} aria-busy={loading} {...props}>
      <span className={loading ? 'button-label hidden' : ''}>{children}</span>
      {loading && <span className="spinner" aria-label="Chargement" />}
    </button>
  );
}

export function IconButton({
  variant = 'rest-soft',
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'rest-soft' | 'active-solid' | 'destructive';
  label: string;
}) {
  return (
    <button className={`icon-button ${variant}`} aria-label={label} {...props}>
      {children}
    </button>
  );
}

export function Card({
  variant = 'standard',
  children,
  onClick,
}: HTMLAttributes<HTMLElement> & {
  variant?: 'standard' | 'interactive' | 'status' | 'highlight';
}) {
  if (variant === 'interactive') {
    return (
      <button type="button" className="card interactive" onClick={onClick}>
        {children}
      </button>
    );
  }

  return <section className={`card ${variant}`}>{children}</section>;
}

type ListRowProps = {
  variant: 'navigation' | 'selection' | 'toggle' | 'value' | 'status';
  title: string;
  detail?: string;
  onActivate?: () => void;
  checked?: boolean;
};

export function ListRow({
  variant,
  title,
  detail,
  onActivate,
  checked = false,
}: ListRowProps) {
  const content = (
    <>
      <span>
        <strong>{title}</strong>
        {variant === 'status' && <small>● Statut opérationnel</small>}
      </span>
      <span className="row-detail">
        {detail}
        {variant === 'navigation' && <span aria-hidden>›</span>}
        {variant === 'selection' && checked && <span aria-label="Sélectionné">✓</span>}
        {variant === 'toggle' && <span className="toggle" aria-hidden />}
      </span>
    </>
  );

  if (variant === 'toggle') {
    return (
      <button
        type="button"
        className="list-row toggle-row"
        role="switch"
        aria-checked={checked}
        onClick={onActivate}
      >
        {content}
      </button>
    );
  }

  if (variant === 'navigation' || variant === 'selection') {
    return (
      <button
        type="button"
        className={`list-row ${variant}`}
        aria-pressed={variant === 'selection' ? checked : undefined}
        onClick={onActivate}
      >
        {content}
      </button>
    );
  }

  return <div className={`list-row ${variant}`}>{content}</div>;
}

type FieldProps = {
  label: string;
  message?: string;
  status?: 'default' | 'error' | 'success';
  multiline?: boolean;
} & InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Field({
  label,
  message,
  status = 'default',
  multiline = false,
  id = 'field',
  ...props
}: FieldProps) {
  const described = message ? `${id}-message` : undefined;
  const commonAccessibility = {
    'aria-describedby': described,
    'aria-invalid': (status === 'error') as boolean,
  };

  return (
    <div className={`field ${status}`}>
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} {...commonAccessibility} {...props} />
      ) : (
        <input id={id} {...commonAccessibility} {...props} />
      )}
      {message && (
        <small id={described}>
          {status === 'error' ? '⚠ ' : status === 'success' ? '✓ ' : ''}
          {message}
        </small>
      )}
    </div>
  );
}

export function Badge({
  variant = 'neutral',
  children,
}: {
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  children: ReactNode;
}) {
  return <span className={`badge ${variant}`}>{children}</span>;
}

export function Chip({
  selected = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button className="chip" aria-pressed={selected} {...props}>
      {selected && <span aria-hidden>✓ </span>}
      {children}
    </button>
  );
}
