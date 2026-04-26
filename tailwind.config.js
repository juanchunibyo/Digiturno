import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                "on-secondary-fixed": "#001c38",
                "secondary-fixed": "#d3e4ff",
                "outline-variant": "#c1cab4",
                "on-tertiary": "#ffffff",
                "surface-container-high": "#e8e8e8",
                "tertiary-container": "#cfae00",
                "surface": "#f9f9f9",
                "on-secondary-container": "#00457b",
                "on-error-container": "#93000a",
                "error-container": "#ffdad6",
                "outline": "#727a67",
                "inverse-primary": "#94d955",
                "surface-variant": "#e2e2e2",
                "surface-container": "#eeeeee",
                "surface-bright": "#f9f9f9",
                "on-tertiary-fixed-variant": "#544600",
                "surface-container-highest": "#e2e2e2",
                "tertiary-fixed-dim": "#e9c400",
                "on-background": "#1a1c1c",
                "primary-fixed": "#aff66e",
                "tertiary-fixed": "#ffe16d",
                "surface-tint": "#39A900",
                "on-tertiary-fixed": "#221b00",
                "secondary-container": "#78b4fe",
                "primary-fixed-dim": "#94d955",
                "on-surface": "#1a1c1c",
                "on-primary-fixed-variant": "#295000",
                "on-surface-variant": "#424939",
                "error": "#ba1a1a",
                "on-primary": "#ffffff",
                "primary": "#39A900",
                "on-tertiary-container": "#504200",
                "background": "#f9f9f9",
                "tertiary": "#705d00",
                "on-error": "#ffffff",
                "on-secondary": "#ffffff",
                "secondary-fixed-dim": "#a2c9ff",
                "surface-dim": "#dadada",
                "primary-container": "#7fc241",
                "on-secondary-fixed-variant": "#004881",
                "on-primary-container": "#274c00",
                "surface-container-low": "#f3f3f3",
                "inverse-on-surface": "#f1f1f1",
                "on-primary-fixed": "#0d2000",
                "surface-container-lowest": "#ffffff",
                "inverse-surface": "#2f3131",
                "secondary": "#1260a5"
            },
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
                headline: ["Work Sans", "sans-serif"],
                body: ["Public Sans", "sans-serif"],
                label: ["Inter", "sans-serif"]
            },
        },
    },

    plugins: [forms],
}; // rebuild

