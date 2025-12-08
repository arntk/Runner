/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                midnight: '#0f172a', // Main background
                surface: '#1e293b',  // Card background
                primary: '#3b82f6',  // Blue brand
                secondary: '#06b6d4', // Cyan brand
                accent: '#f97316',   // Orange accent
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
