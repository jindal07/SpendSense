/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1200px' },
    },
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Full brand palette
        'lavender-blush': {
          50: '#faeaed',
          100: '#f6d5db',
          200: '#edabb6',
          300: '#e38292',
          400: '#da586d',
          500: '#d12e49',
          600: '#a7253a',
          700: '#7d1c2c',
          800: '#54121d',
          900: '#2a090f',
          950: '#1d060a',
        },
        'cotton-rose': {
          50: '#f7edee',
          100: '#efdcde',
          200: '#e0b8bd',
          300: '#d0959c',
          400: '#c1717b',
          500: '#b14e59',
          600: '#8e3e48',
          700: '#6a2f36',
          800: '#471f24',
          900: '#231012',
          950: '#190b0d',
        },
        lilac: {
          50: '#f6eef6',
          100: '#eedded',
          200: '#dcbcdc',
          300: '#cb9aca',
          400: '#ba78b9',
          500: '#a857a7',
          600: '#874586',
          700: '#653464',
          800: '#432343',
          900: '#221121',
          950: '#180c17',
        },
        'deep-twilight': {
          50: '#e9e6ff',
          100: '#d2cdfe',
          200: '#a69afe',
          300: '#7968fd',
          400: '#4c35fd',
          500: '#2003fc',
          600: '#1902ca',
          700: '#130297',
          800: '#0d0165',
          900: '#060132',
          950: '#040023',
        },

        // Semantic tokens (HSL-driven for alpha support)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#4c35fd', // deep-twilight-400
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#a857a7', // lilac-500
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#d12e49', // lavender-blush-500
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      fontFamily: {
        sans: [
          '"Exo 2"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #d12e49 0%, #a857a7 50%, #4c35fd 100%)',
        'brand-gradient-soft':
          'linear-gradient(135deg, rgba(209,46,73,0.18) 0%, rgba(168,87,167,0.18) 50%, rgba(76,53,253,0.22) 100%)',
        'card-gradient':
          'linear-gradient(180deg, rgba(76,53,253,0.08) 0%, rgba(6,1,50,0) 60%)',
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(2,0,35,0.7)',
        glow: '0 0 0 6px rgba(76,53,253,0.18)',
        'glow-pink': '0 10px 40px -10px rgba(209,46,73,0.55)',
        'glow-indigo': '0 10px 40px -10px rgba(76,53,253,0.55)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-up': 'slide-up 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
