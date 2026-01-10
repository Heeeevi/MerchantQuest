/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Medieval theme colors - improved contrast
        'parchment': '#f5f0e1',
        'parchment-dark': '#e8dcc4',
        'ink': '#1a120d',
        'ink-light': '#2c1810',
        'gold': '#d4af37',
        'gold-dark': '#b8960c',
        'bronze': '#cd7f32',
        'silver': '#c0c0c0',
        'royal-blue': '#1a365d',
        'royal-purple': '#44337a',
        'forest': '#1a4731',
        'crimson': '#7c2d12',
      },
      fontFamily: {
        'medieval': ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        'fantasy': ['Luminari', 'Fantasy', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'parchment-texture': "url('/textures/parchment.png')",
        'map-texture': "url('/textures/map.png')",
      },
      boxShadow: {
        'medieval': '0 4px 6px -1px rgba(44, 24, 16, 0.3), 0 2px 4px -1px rgba(44, 24, 16, 0.2)',
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.5)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
