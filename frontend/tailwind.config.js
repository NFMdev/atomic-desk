/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atomic: {
          canvas: '#dfdac4',
          surface: '#f7f3e7',
          surfaceAlt: '#c9c1a7',
          border: '#b0a384',
          accent: '#a39170',
          accentDark: '#948363',
          ink: '#2f2a20',
          muted: '#685f4c',
          success: '#48623f',
          danger: '#8f4b3f',
          white: '#fffdf7',
        },
      },
      borderRadius: {
        card: '1.5rem',
        control: '0.875rem',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(47, 42, 32, 0.10)',
        lift: '0 24px 70px rgba(47, 42, 32, 0.16)',
        insetWarm: 'inset 0 1px 0 rgba(255, 253, 247, 0.65)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
