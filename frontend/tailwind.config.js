/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Enables dark mode based on system preference
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
          },
        },
      },
      colors: {
        brand: {
          // Primary colors
          primary: '#0047AB',    // Nexus Blue
          secondary: '#3498db',  // Bright Blue
          accent: '#FF6B35',     // Nexus Accent
          success: '#2ecc71',    // Success Green
          
          // Neutral colors
          neutral: {
            DEFAULT: '#F7FAFC',  // Light gray background
            dark: '#2c3e50',     // Dark navy (#2c3e50)
            medium: '#7f8c8d',   // Medium gray (#7f8c8d)
            light: '#bdc3c7',    // Light gray (#bdc3c7)
            white: '#ffffff',    // White (#ffffff)
          }
        },
      },
      boxShadow: {
        card: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        dropdown: '0 4px 6px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        xl: '1rem',
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      fontFamily: {
        'serif': ['"Playfair Display"', 'serif'],
        'tech': ['"Chakra Petch"', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}; 