/**
 * Types communs pour les composants UI
 * Ce fichier définit les types de base utilisés par tous les composants
 * pour assurer la cohérence et la réutilisabilité.
 */

import { ReactNode, HTMLAttributes } from 'react';

/**
 * Variants de couleur communs pour les composants
 * Utilisés par Alert, Badge, et autres composants de feedback
 */
export type ColorVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/**
 * Variants de style pour les boutons
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Tailles communes pour les composants
 */
export type Size = 'sm' | 'md' | 'lg';

/**
 * Props de base communes à tous les composants
 */
export interface BaseComponentProps extends HTMLAttributes<HTMLElement> {
  /** Classes CSS supplémentaires */
  className?: string;
  /** Contenu enfant */
  children?: ReactNode;
}

/**
 * Props pour les composants avec variants de couleur
 */
export interface ColorVariantProps {
  /** Variant de couleur du composant */
  variant?: ColorVariant;
}

/**
 * Props pour les composants avec taille
 */
export interface SizeProps {
  /** Taille du composant */
  size?: Size;
}

/**
 * Props pour les composants avec label
 */
export interface LabelProps {
  /** Label du composant */
  label?: string;
}

/**
 * Props pour les composants avec état d'erreur
 */
export interface ErrorProps {
  /** Message d'erreur à afficher */
  error?: string;
  /** Texte d'aide supplémentaire */
  helperText?: string;
}

/**
 * Props pour les composants avec icône
 */
export interface IconProps {
  /** Icône à afficher à gauche */
  leftIcon?: ReactNode;
  /** Icône à afficher à droite */
  rightIcon?: ReactNode;
  /** Icône personnalisée */
  icon?: ReactNode;
}

/**
 * Props pour les composants avec état de chargement
 */
export interface LoadingProps {
  /** Indique si le composant est en état de chargement */
  loading?: boolean;
}

/**
 * Props pour les composants avec état désactivé
 */
export interface DisabledProps {
  /** Indique si le composant est désactivé */
  disabled?: boolean;
}

/**
 * Props pour les composants avec largeur complète
 */
export interface FullWidthProps {
  /** Indique si le composant doit prendre toute la largeur disponible */
  fullWidth?: boolean;
}

/**
 * Props pour les composants avec titre
 */
export interface TitleProps {
  /** Titre du composant */
  title?: string;
}

/**
 * Props pour les composants avec action de fermeture
 */
export interface ClosableProps {
  /** Callback appelé lors de la fermeture */
  onClose?: () => void;
}

/**
 * Mapping des couleurs pour les variants
 * Utilisé pour générer les classes Tailwind de manière cohérente
 */
export const colorVariantMap: Record<ColorVariant, {
  bg: string;
  text: string;
  border: string;
  darkBg: string;
  darkText: string;
  darkBorder: string;
}> = {
  default: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    darkBg: 'dark:bg-gray-700',
    darkText: 'dark:text-gray-200',
    darkBorder: 'dark:border-gray-600',
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-300',
    darkBorder: 'dark:border-green-700',
  },
  warning: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-300',
    darkBorder: 'dark:border-yellow-700',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-300',
    darkBorder: 'dark:border-red-700',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    darkBg: 'dark:bg-blue-900/30',
    darkText: 'dark:text-blue-300',
    darkBorder: 'dark:border-blue-700',
  },
};

/**
 * Mapping des tailles pour les composants
 */
export const sizeMap: Record<Size, {
  padding: string;
  text: string;
}> = {
  sm: {
    padding: 'px-3 py-1.5',
    text: 'text-sm',
  },
  md: {
    padding: 'px-4 py-2',
    text: 'text-base',
  },
  lg: {
    padding: 'px-6 py-3',
    text: 'text-lg',
  },
};

