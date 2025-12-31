/**
 * Animation System - Nukleo ERP
 * 
 * Système d'animations cohérent pour toute l'application
 * Basé sur les principes de Material Design et Framer Motion
 */

// Timing functions (easing)
export const easing = {
  // Standard easing - Pour la plupart des animations
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Deceleration - Pour les éléments qui entrent
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  
  // Acceleration - Pour les éléments qui sortent
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  
  // Sharp - Pour les transitions rapides
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  
  // Bounce - Pour les effets ludiques
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Durées d'animation (en ms)
export const duration = {
  fastest: 100,
  faster: 150,
  fast: 200,
  normal: 300,
  slow: 400,
  slower: 500,
  slowest: 600,
};

// Variants Framer Motion
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.normal / 1000, ease: easing.standard },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: duration.fast / 1000, ease: easing.decelerate },
};

export const scaleUp = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.1 },
  transition: { duration: duration.normal / 1000, ease: easing.bounce },
};

export const slideInUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

export const slideInDown = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

export const slideInLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

export const slideInRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

// Stagger animations (pour listes)
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.fast / 1000, ease: easing.decelerate },
};

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: duration.normal / 1000, ease: easing.standard },
};

// Modal/Dialog animations
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration.fast / 1000 },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { duration: duration.normal / 1000, ease: easing.decelerate },
};

// Hover animations
export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
  transition: { duration: duration.faster / 1000, ease: easing.standard },
};

export const hoverLift = {
  whileHover: { y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' },
  whileTap: { y: 0 },
  transition: { duration: duration.fast / 1000, ease: easing.decelerate },
};

export const hoverGlow = {
  whileHover: { 
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
    borderColor: 'rgb(59, 130, 246)',
  },
  transition: { duration: duration.fast / 1000, ease: easing.standard },
};

// Loading animations
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: easing.standard,
  },
};

export const spin = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

// Utility function pour créer des animations personnalisées
export const createAnimation = (
  initial: any,
  animate: any,
  exit?: any,
  transitionDuration = duration.normal,
  transitionEasing = easing.standard
) => ({
  initial,
  animate,
  exit: exit || initial,
  transition: { duration: transitionDuration / 1000, ease: transitionEasing },
});
