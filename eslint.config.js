export default [
    {
        ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**']
    },
    {
        files: ['js/**/*.js', 'test/**/*.js', 'playwright.config.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                window: 'readonly',
                document: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                FileReader: 'readonly',
                process: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'error',
            'no-undef': 'error',
            'no-console': 'off',
            'prefer-const': 'error'
        }
    }
];
