/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'slate-750': '#1e293b',
        'slate-850': '#0f172a',
      },
    },
  },
  safelist: [
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'text-green-500',
    'text-yellow-500',
    'text-red-500',
    'bg-green-500/10',
    'bg-yellow-500/10',
    'bg-red-500/10',
    'text-green-400',
    'text-yellow-400',
    'text-red-400',
  ],
  plugins: [],
};