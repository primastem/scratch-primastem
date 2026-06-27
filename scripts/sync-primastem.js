// Copies the PrimaSTEM extension from the submodule into static/ so the build
// serves it at <site>/primastem.js (same-origin, trusted unsandboxed).
// Копирует расширение PrimaSTEM из submodule в static/, чтобы билд отдавал его
// по <site>/primastem.js (same-origin, доверенное unsandboxed).
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../vendor/primastem-blocks/primastem.js');
const destDir = path.resolve(__dirname, '../static');
const dest = path.join(destDir, 'primastem.js');

if (!fs.existsSync(src)) {
    console.error(`[sync-primastem] source not found: ${src}\n` +
        'Run: git submodule update --init --recursive');
    process.exit(1);
}

fs.mkdirSync(destDir, {recursive: true});
fs.copyFileSync(src, dest);
console.log(`[sync-primastem] ${src} -> ${dest}`);
