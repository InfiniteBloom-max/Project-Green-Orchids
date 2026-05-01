/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Sora', 'system-ui', 'sans-serif'],
      },
      colors: {
        green: {
          50: '#E8F9F1',
          100: '#C8F2DF',
          200: '#94E6C2',
          300: '#5FD6A2',
          400: '#33C588',
          500: '#12B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#053D2E',
          950: '#022C22',
        },
        orchid: {
          50: '#FFF1F8',
          100: '#FFE0EF',
          200: '#FFBADD',
          300: '#FF85C2',
          400: '#FB4FA3',
          500: '#EC2588',
          600: '#D2156F',
          700: '#AE0F5B',
          800: '#8C0E4A',
          900: '#74103F',
          950: '#470022',
        },
        plum: {
          400: '#A855B8',
          500: '#8B2C9E',
          600: '#6E1F80',
          700: '#551763',
          800: '#3D1048',
          900: '#280A30',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(18,185,129,0.18), 0 18px 40px -16px rgba(18,185,129,0.45)',
        'glow-pink': '0 0 0 1px rgba(236,37,136,0.18), 0 18px 40px -16px rgba(236,37,136,0.45)',
        card: '0 1px 2px rgba(2,44,34,0.04), 0 12px 32px -12px rgba(2,44,34,0.16)',
        'card-lg': '0 2px 4px rgba(2,44,34,0.05), 0 24px 60px -20px rgba(2,44,34,0.28)',
        pop: '0 24px 60px -24px rgba(2,44,34,0.45)',
      },
      backgroundImage: {
        'mesh-light':
          'radial-gradient(circle at 12% 0%, rgba(236,37,136,0.16), transparent 30rem), radial-gradient(circle at 88% 8%, rgba(18,185,129,0.22), transparent 32rem), linear-gradient(135deg, #F6FBF8 0%, #EEF8F1 50%, #FFF6FB 100%)',
        'brand-gradient': 'linear-gradient(120deg, #047857 0%, #12B981 38%, #EC2588 100%)',
        'brand-dark': 'linear-gradient(150deg, #022C22 0%, #053D2E 36%, #3D1048 78%, #470022 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(24px,-20px) scale(1.08)' },
          '66%': { transform: 'translate(-18px,14px) scale(0.95)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gradient-x': {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(18,185,129,0.5)' },
          '70%': { boxShadow: '0 0 0 12px rgba(18,185,129,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(18,185,129,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        float: 'float 6s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
