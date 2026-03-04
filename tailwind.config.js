/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: '#9362e3',
                blue: {
                    50: '#f4effc',
                    100: '#e9e0fa',
                    200: '#d2c1f5',
                    300: '#bc9fed',
                    400: '#a57ee6',
                    500: '#9362e3',
                    600: '#7d4bc9',
                    700: '#6739af',
                    800: '#512795',
                    900: '#3c187a',
                },
                indigo: {
                    50: '#f4effc',
                    100: '#e9e0fa',
                    200: '#d2c1f5',
                    300: '#bc9fed',
                    400: '#a57ee6',
                    500: '#9362e3',
                    600: '#7d4bc9',
                    700: '#6739af',
                    800: '#512795',
                    900: '#3c187a',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        }
    },
    plugins: [],
}
