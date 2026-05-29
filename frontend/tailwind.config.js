/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf8ff',
          100: '#f3f0ff',
          200: '#ebe5ff',
          300: '#ddd6fe',
          400: '#c4b5fd',
          500: '#a78bfa',
          600: '#9b7cf7',
          700: '#8b6cf0',
          800: '#7c5ce8',
          900: '#6d4ed6',
        },
        accent: {
          50: '#f0fdff',
          100: '#e0f9fe',
          200: '#baf0f8',
          300: '#7dd9ed',
          400: '#5ec9e3',
          500: '#4ab8d4',
          600: '#3da3bc',
          700: '#348da3',
          800: '#2d778a',
          900: '#266172',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        ios: '1.75rem',
        'ios-lg': '2.25rem',
        'ios-xl': '2.75rem',
      },
      backdropBlur: {
        ios: '28px',
        'ios-xl': '44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
