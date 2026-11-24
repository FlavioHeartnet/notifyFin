import { Plus_Jakarta_Sans } from 'next/font/google';

export const plus = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});

const typography: any = {
  fontFamily: plus.style.fontFamily,
  h1: {
    fontWeight: 700,
    fontSize: '2.25rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontWeight: 700,
    fontSize: '2rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h3: {
    fontWeight: 700,
    fontSize: '1.5rem',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h4: {
    fontWeight: 700,
    fontSize: '1.25rem',
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 1.35,
    letterSpacing: '-0.02em',
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.4,
    letterSpacing: '-0.02em',
  },
  subtitle1: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.015em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '-0.015em',
  },
  body1: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.45,
    letterSpacing: '-0.01em',
  },
  body2: {
    fontSize: '0.8125rem',
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 700,
    lineHeight: 1.4,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  button: {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    letterSpacing: '-0.01em',
  },
};

export default typography;
