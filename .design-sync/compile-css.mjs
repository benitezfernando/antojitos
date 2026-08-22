import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import { readFileSync, writeFileSync } from 'node:fs';

const input = readFileSync('src/app/globals.css', 'utf8');
const result = await postcss([tailwindcss({ base: process.cwd() })]).process(input, {
  from: 'src/app/globals.css',
  to: '.design-sync/.cache/compiled.css',
});
writeFileSync('.design-sync/.cache/compiled.css', result.css);
console.log('wrote', result.css.length, 'bytes');
