/** Tailwind compilado para Perseus. Genera core/static/core/css/tailwind.css
 *  Ver README: "Tailwind compilado". */
module.exports = {
  content: [
    './core/templates/**/*.html',
    './core/templatetags/**/*.py',
    './core/contenido.py',
    './core/static/core/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a', bone: '#f5f5f0', paper: '#e9e9e2',
        acid: { DEFAULT: '#c6ff3d', soft: '#d8ff74', deep: '#4d6b00' },
        mute: '#8a8a84', body: '#b4b4ad', faint: '#6f6f69',
      },
      fontFamily: { sans: ['Geist', 'system-ui', 'sans-serif'], mono: ['"Geist Mono"', 'monospace'] },
      maxWidth: { site: '1440px' },
    },
  },
  plugins: [],
};
