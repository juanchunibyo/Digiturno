import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        // Añadida la carpeta skills/** (y otras comunes) a la lista de ignorados
        ignores: ["skills/**", "vendor/**", "public/**", "bootstrap/**", "storage/**", ".github/**"]
    },
    {
        files: ["resources/js/**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn"
        }
    }
];
