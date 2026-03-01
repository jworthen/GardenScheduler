/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        garden: {
          50: '#f0faf4',
          100: '#dcf5e6',
          200: '#baeacf',
          300: '#8fd9b0',
          400: '#5ec18d',
          500: '#3da870',
          600: '#2d8759',
          700: '#266b48',
          800: '#20543a',
          900: '#1b4530',
          950: '#0d2619',
        },
        soil: {
          50: '#faf6f1',
          100: '#f3ebe0',
          200: '#e6d4bc',
          300: '#d4b490',
          400: '#c08e64',
          500: '#b07348',
          600: '#96593c',
          700: '#7c4534',
          800: '#663930',
          900: '#54302b',
          950: '#2d1714',
        },
        harvest: {
          50: '#fffbeb',
          100: '#fff3c6',
          200: '#ffe589',
          300: '#ffcf4c',
          400: '#ffb824',
          500: '#f99407',
          600: '#dd6d02',
          700: '#b74c06',
          800: '#943a0c',
          900: '#7a300d',
          950: '#461704',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
