import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Визуальный вариант кнопки */
  variant?: ButtonVariant;
  /** Содержимое кнопки */
  children: React.ReactNode;
}

/**
 * Базовый компонент кнопки UI-кита.
 *
 * По умолчанию — primary: фиолетовая, на всю ширину,
 * со стейтами hover / active / disabled.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className,
  ...rest
}) => {
  const cls = [
    styles.button,
    styles[`button--${variant}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
};
