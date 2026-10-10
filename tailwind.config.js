/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Food Safety / HACCP Theme Colors
        haccp: {
          // Primary - Fresh Greens (Food Safety, Compliance, Growth)
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          
          // Secondary - Teal/Cyan (Water, Hygiene, Processing)
          teal: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
            950: '#042f2e',
          },
          
          // Accent - Warm Amber/Orange (Temperature, Heat Processing, Alerts)
          warm: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
          },
          
          // Critical - Rose/Red (Breaches, Critical Limits, Danger)
          critical: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            800: '#9f1239',
            900: '#881337',
            950: '#4c0519',
          },
          
          // Surface - Dark slate with green undertones
          surface: {
            50: '#f8faf8',
            100: '#eef1ee',
            200: '#dce1db',
            300: '#c3cbbf',
            400: '#9aa994',
            500: '#778770',
            600: '#5e6d58',
            700: '#4a5545',
            800: '#3e4639',
            900: '#353c31',
            950: '#1e231a',
          },
          
          // Glass/Overlay
          glass: {
            light: 'rgba(248, 250, 248, 0.8)',
            dark: 'rgba(30, 35, 26, 0.85)',
            border: 'rgba(154, 169, 148, 0.2)',
            borderDark: 'rgba(74, 85, 69, 0.3)',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'haccp-mesh': 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2322c55e\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        'food-pattern': 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2314b8a6\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M40 10c16.5 0 30 13.5 30 30s-13.5 30-30 30-30-13.5-30-30 13.5-30 30-30zm0-10C18.3 0 0 18.3 0 40s18.3 40 40 40 40-18.3 40-40S61.8 0 40 0zm0 72c-17.7 0-32-14.3-32-32S22.3 8 40 8s32 14.3 32 32-14.3 32-32 32z\'/%3E%3C/g%3E%3C/svg%3E")',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-down': 'slideDown 0.4s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(20, 184, 166, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(34, 197, 94, 0.5)' },
        },
      },
      boxShadow: {
        'glow-green': '0 0 30px rgba(34, 197, 94, 0.4)',
        'glow-teal': '0 0 30px rgba(20, 184, 166, 0.4)',
        'glow-warm': '0 0 30px rgba(245, 158, 11, 0.4)',
        'glow-critical': '0 0 30px rgba(244, 63, 94, 0.4)',
        'inner-glow': 'inset 0 2px 10px rgba(34, 197, 94, 0.1)',
        'card': '0 10px 40px -10px rgba(0, 0, 0, 0.4), 0 2px 10px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 20px 60px -15px rgba(0, 0, 0, 0.5), 0 4px 20px -4px rgba(34, 197, 94, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}