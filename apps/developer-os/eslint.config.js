import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
export default [{ ignores: ['dist','coverage','playwright-report','test-results','**/*.d.ts'] }, js.configs.recommended, ...tseslint.configs.recommended, { files: ['**/*.{ts,tsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node } }, plugins: { 'react-hooks': hooks, 'react-refresh': refresh }, rules: { ...hooks.configs.recommended.rules, ...refresh.configs.vite.rules, 'no-undef': 'off' } },{files:['public/sw.js'],languageOptions:{globals:{...globals.serviceworker}}}];
