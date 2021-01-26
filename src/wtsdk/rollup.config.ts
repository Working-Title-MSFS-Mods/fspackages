'use strict';

import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import copy from 'rollup-plugin-copy'

const pkg = require('./package.json')

const libraryName = 'wtsdk'

export default {
    input: `./src/${libraryName}.ts`,
    output: [
        { file: `..\\workingtitle-vcockpits-instruments-cj4\\html_ui\\Pages\\VCockpit\\Instruments\\Airliners\\CJ4\\WTLibs\\${libraryName}.js`, format: 'umd', sourcemap: false, extend: true, name: 'window' }
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    // watch: {
    //     include: 'src/**',
    // },
    plugins: [
        // Allow json resolution
        json(),
        // Compile TypeScript files
        typescript({ useTsconfigDeclarationDir: true }),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs(),
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve(),

        // Resolve source maps to the original source
        sourceMaps(),
        copy({
            targets: [
                { src: 'src/utils/LzUtf8.js', dest: '..\\workingtitle-vcockpits-instruments-cj4\\html_ui\\Pages\\VCockpit\\Instruments\\Airliners\\CJ4\\WTLibs' }
            ]
        })
    ],
}