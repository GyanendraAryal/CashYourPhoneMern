module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'primary-blue': {
          DEFAULT: '#33B4A8',
          hover: '#2EA79C',
          active: '#268D84',
          muted: '#CFF3F0',
        },
                'secondary-violet': {
          DEFAULT: '#8A95C9',
          hover: '#7C87C0',
          active: '#6B76B5',
          muted: '#E6E9F8',
        },
'success-green': {
          DEFAULT: '#33B4A8',
          hover: '#2EA79C',
          muted: '#CFF3F0',
          dark: '#268D84',
        },
        'surface-white': {
          DEFAULT: '#FFFFFF',
          subtle: '#EEF1FA',
        },
        'border-muted': '#E2E8F0',
        'text-primary': '#0F172A',
        'text-muted': '#64748B',
      },
    },
  },
  plugins: [],
}
