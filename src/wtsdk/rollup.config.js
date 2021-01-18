'use strict';

const babel = require('@rollup/plugin-babel').default;
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').default;
const replace = require('@rollup/plugin-replace');
const multiEntry = require("rollup-plugin-multi-entry");

const extensions = ['.js', '.ts'];
const outDir = "../workingtitle-vcockpits-instruments-cj4/html_ui/Pages/VCockpit/Instruments/Airliners/CJ4/WTLibs"

module.exports = {
    input: {
        include: [`${__dirname}\\src\\**\\*.ts`],
        exclude: [`${__dirname}\\src\\types\\**\\*.d.ts`]
    },
    treeshake: false,
    plugins: [
        replace({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
        commonjs(),
        multiEntry(),
        babel({
            presets: ['@babel/preset-typescript', ['@babel/preset-env', {
                targets: { browsers: ['safari 11'] },
            }]],
            plugins: [
                '@babel/plugin-proposal-class-properties',
            ],
            extensions,
        }),
        nodeResolve({
            extensions,
        }),
    ],
    external: ['MSFS', 'WorkingTitle'],
    output: {
        // sourcemap: 'inline',
        file: `${__dirname}\\${outDir}\\wtsdk.js`,
        extend: true,
        format: 'umd',
        name: 'window'
    },
};