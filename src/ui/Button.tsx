import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors ' +
  'disabled:opacity-55 disabled:cursor-not-allowed select-none whitespace-nowrap';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-[color-mix(in_oklab,var(--c-primary)_88%,var(--c-ink))]',
  secondary: 'bg-secondary text-ink hover:bg-[color-mix(in_oklab,var(--c-secondary)_85%,var(--c-ink))]',
  ghost: 'bg-transparent text-ink hover:bg-secondary',
  danger: 'bg-danger text-[var(--c-surface)] hover:bg-[color-mix(in_oklab,var(--c-danger)_88%,var(--c-ink))]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[0.95rem]',
  lg: 'h-12 px-6 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function LinkButton({ variant = 'primary', size = 'md', className = '', ...rest }: LinkButtonProps) {
  return <a className={buttonClass(variant, size, className)} {...rest} />;
}
