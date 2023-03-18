import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' assert { type: 'json' };

const config = [
    {
        input: 'src/index.ts',
        output: {
            file: pkg.browser,
            format: 'esm',
        },
        plugins: [
            typescript(),
            commonjs(),
            babel({
                babelHelpers: 'runtime',
                exclude: ['node_modules/**'],
            }),
        ],
        external: ['mdast-util-find-and-replace'],
    },
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.main,
                format: 'cjs',
            },
            {
                file: pkg.module,
                format: 'es',
            },
        ],
        plugins: [
            typescript(),
            babel({
                babelHelpers: 'runtime',
                exclude: ['node_modules/**'],
            }),
        ],
        external: ['mdast-util-find-and-replace'],
    },
];

export default config;
