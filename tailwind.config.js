/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
        secondary: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          green: '#10B981',
          orange: '#F59E0B',
          pink: '#EC4899',
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
        'gradient-primary': 'linear-gradient(135deg, #F472B6 0%, #EC4899 50%, #DB2777 100%)',
        'gradient-rose': 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
        'gradient-sunset': 'linear-gradient(90deg, #F9A8D4 0%, #EC4899 50%, #DB2777 100%)',
      },
      boxShadow: {
        'primary': '0 4px 14px rgba(236, 72, 153, 0.25)',
        'primary-lg': '0 8px 24px rgba(236, 72, 153, 0.3)',
        'rose': '0 6px 16px rgba(219, 39, 119, 0.3)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(236, 72, 153, 0.08)',
      },
    },
  },
  plugins: [],
};
