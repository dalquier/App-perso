import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vitest';

const sourceRoot = path.resolve(import.meta.dirname, '..');
const generatedTokens = path.join(sourceRoot, 'generated/tokens.css');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const file = path.join(directory, entry);
    if (file === generatedTokens) return [];
    return statSync(file).isDirectory() ? sourceFiles(file) : [file];
  });
}

function variables(source: string): Set<string> {
  return new Set(source.match(/--pos-[a-z0-9-]+/g) ?? []);
}

test('every ProjectOS CSS variable reference exists in generated tokens', () => {
  const defined = variables(readFileSync(generatedTokens, 'utf8'));
  const used = new Set(
    sourceFiles(sourceRoot).flatMap((file) => [...variables(readFileSync(file, 'utf8'))]),
  );
  const missing = [...used].filter((variable) => !defined.has(variable)).sort();

  expect(missing, `Missing generated token variables: ${missing.join(', ')}`).toEqual([]);
});
