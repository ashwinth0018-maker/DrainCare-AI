/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a1628',
          900: '#0f1e36',
          800: '#152a4a',
          700: '#1e3a5f',
          600: '#2a4a73',
        },
        charcoal: {
          900: '#14181f',
          800: '#1a1f29',
          700: '#222936',
          600: '#2d3645',
          500: '#3a4458',
        },
        teal: {
          50: '#ecfdf7',
          100: '#d0faf0',
          200: '#a3f3e0',
          300: '#6de7cd',
          400: '#36d1b4',
          500: '#14b89c',
          600: '#08967f',
          700: '#087e8b',
          800: '#0a6f73',
          900: '#0d5a61',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
