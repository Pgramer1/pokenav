import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { transform } from 'esbuild';
import ts from 'typescript';

const DOCUMENTS = ['README.md', 'packages/pallet/README.md'];
const CHECK_EXTERNAL = process.argv.includes('--external');
const failures = [];
const externalUrls = new Set();

const addFailure = (file, detail) => failures.push(`${file}: ${detail}`);

for (const file of DOCUMENTS) {
  const markdown = readFileSync(file, 'utf8');

  for (const match of markdown.matchAll(/^```([^\r\n]*)\r?\n([\s\S]*?)^```[ \t]*$/gm)) {
    const language = match[1].trim().toLowerCase();
    const source = match[2];
    const line = markdown.slice(0, match.index).split(/\r?\n/).length;

    try {
      if (language === 'json') {
        JSON.parse(source);
      } else if (language === 'css') {
        await transform(source, { loader: 'css', logLevel: 'silent' });
      } else if (['js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx'].includes(language)) {
        const isJsx = language === 'jsx' || language === 'tsx';
        const compilerOptions = {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        };
        if (isJsx) compilerOptions.jsx = ts.JsxEmit.ReactJSX;
        const result = ts.transpileModule(source, {
          compilerOptions: {
            ...compilerOptions,
          },
          fileName: `${file}.${language}`,
          reportDiagnostics: true,
        });
        const diagnostics = result.diagnostics?.filter(
          (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
        );
        if (diagnostics?.length) {
          throw new Error(
            diagnostics
              .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '))
              .join('; '),
          );
        }
      }
    } catch (error) {
      addFailure(file, `invalid ${language || 'unlabelled'} fence near line ${line}: ${error.message}`);
    }
  }

  for (const match of markdown.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, '');
    const target = rawTarget.split(/\s+["']/u, 1)[0];

    if (/^https?:\/\//i.test(target)) {
      externalUrls.add(target);
      continue;
    }
    if (/^(?:#|mailto:|tel:)/i.test(target)) continue;

    const path = decodeURIComponent(target.split('#', 1)[0].split('?', 1)[0]);
    if (path && !existsSync(resolve(dirname(file), path))) {
      addFailure(file, `local link target does not exist: ${target}`);
    }
  }
}

if (CHECK_EXTERNAL) {
  const checkExternal = async (url) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'pokenav-docs-check/0.3.1' },
        redirect: 'follow',
        signal: controller.signal,
      });
      if (!response.ok && ![401, 403, 405, 429].includes(response.status)) {
        addFailure('external links', `${url} returned HTTP ${response.status}`);
      }
    } catch (error) {
      addFailure('external links', `${url}: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }
  };

  await Promise.all([...externalUrls].map(checkExternal));
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Documentation checks passed for ${DOCUMENTS.length} files` +
      (CHECK_EXTERNAL ? ` and ${externalUrls.size} external links.` : '.'),
  );
}
