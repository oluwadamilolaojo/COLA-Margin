/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream:        '#F5F0E8',
        card:         '#FEFCF6',
        warm:         '#DDD5C4',
        ink:          '#1A1A1A',
        gold:         '#F5C518',
        'gold-dark':  '#C9A800',
        'amber-hugo': '#7B5800',
        panel:        '#1C1C1C',
        'panel-bd':   '#2A2A2A',
      },
    },
  },
  plugins: [],
}
