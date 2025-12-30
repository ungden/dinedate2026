/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF0F3',
          100: '#FFE0E6',
          200: '#FFC2CE',
          300: '#FF9AAD',
          400: '#FF7A91',
          500: '#F0516C',
          600: '#E63B5A',
          700: '#D62A4A',
          800: '#C41E3D',
          900: '#A11530',
        },
        secondary: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          green: '#10B981',
          orange: '#F59E0B',
          pink: '#F0516C',
          indigo: '#6366F1',
          coral: '#FF6B6B',
          magenta: '#E91E8C',
        },
        vip: {
          free: '#9CA3AF',
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          gold: '#FFD700',
          platinum: '#E5E4E2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF7A91 0%, #E63B5A 100%)',
        'gradient-rose': 'linear-gradient(135deg, #F0516C 0%, #D62A4A 100%)',
        'gradient-sunset': 'linear-gradient(90deg, #FF7A91 0%, #F0516C 50%, #E63B5A 100%)',
      },
      boxShadow: {
        'primary': '0 4px 12px rgba(240, 81, 108, 0.25)',
        'rose': '0 6px 16px rgba(230, 59, 90, 0.3)',
      },
    },
  },
  plugins: [],
};
