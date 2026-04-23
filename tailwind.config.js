/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.js', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0F1C',
          elevated: '#0F1522',
        },
        surface: {
          DEFAULT: '#121826',
          hover: '#1A2233',
          muted: '#0E1420',
        },
        border: {
          DEFAULT: '#1F2A3C',
          subtle: '#151D2B',
          strong: '#2B3952',
        },
        fg: {
          DEFAULT: '#F4F6FB',
          muted: '#9CA7BE',
          subtle: '#5F6B82',
        },
        brand: {
          DEFAULT: '#F97316',
          hover: '#FB923C',
          muted: '#7C2D12',
        },
        success: '#22C55E',
        danger: '#EF4444',
        info: '#3B82F6',
        highlight: '#FACC15',
        zone: {
          ucl: '#3B82F6',
          uel: '#F59E0B',
          uec: '#22C55E',
          relegate: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};
