import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolveTheme, THEME_INIT_SCRIPT } from '../../src/components/theme/theme';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { MainNav } from '../../src/components/nav/MainNav';

test('button defaults to a non-submit button and loading is natively disabled', () => {
  const normal = renderToStaticMarkup(createElement(Button, null, 'Continue'));
  assert.match(normal, /type="button"/);
  assert.doesNotMatch(normal, /disabled/);
  const pending = renderToStaticMarkup(createElement(Button, { loading: true, type: 'submit' }, 'Saving'));
  assert.match(pending, /type="submit"/);
  assert.match(pending, /disabled=""/);
  assert.match(pending, /aria-busy="true"/);
});

test('input links label, hint and error, preserves descriptions and escapes content', () => {
  const html = renderToStaticMarkup(createElement(Input, { id: 'field', label: 'Career field', hint: 'Try a field', error: '<script>invalid</script>', 'aria-describedby': 'external-help' }));
  assert.match(html, /for="field"/);
  assert.match(html, /aria-describedby="external-help field-hint field-error"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /<script>/);
});

test('navigation marks nested current routes and only shows employer link on request', () => {
  const student = renderToStaticMarkup(createElement(MainNav, { currentPath: '/jobs/fictional' }));
  assert.match(student, /href="\/jobs" aria-current="page"/);
  assert.doesNotMatch(student, /href="\/employer\/jobs"/);
  const employer = renderToStaticMarkup(createElement(MainNav, { currentPath: '/employer/jobs', showEmployer: true }));
  assert.match(employer, /href="\/employer\/jobs" aria-current="page"/);
});

test('theme resolves valid saved values, otherwise follows system preference', () => {
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('light', true), 'light');
  for (const value of [null, '', 'invalid', 'DARK']) {
    assert.equal(resolveTheme(value, true), 'dark');
    assert.equal(resolveTheme(value, false), 'light');
  }
});

test('startup sets the theme before React, even when storage is unavailable', () => {
  for (const saved of [null, 'dark', 'light', 'invalid', 'blocked']) {
    for (const systemDark of [false, true]) {
      const document = { documentElement: { dataset: {}, style: {} } };
      runInNewContext(THEME_INIT_SCRIPT, {
        document,
        window: { matchMedia: () => ({ matches: systemDark }) },
        localStorage: { getItem: () => {
          if (saved === 'blocked') throw new Error('Storage denied');
          return saved;
        } },
      });
      const expected = resolveTheme(saved === 'blocked' ? null : saved, systemDark);
      assert.equal((document.documentElement.dataset as { theme?: string }).theme, expected);
      assert.equal((document.documentElement.style as { colorScheme?: string }).colorScheme, expected);
    }
  }
});

function contrast(a: string, b: string) {
  const luminance = (hex: string) => {
    const values = hex.slice(1).match(/../g)!.map(value => {
      const n = Number.parseInt(value, 16) / 255;
      return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
    });
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

test('both themes define readable text, action, border, error and focus colors', () => {
  const path = 'src/styles/tokens.css';
  const css = existsSync(path) ? readFileSync(path, 'utf8') : '';
  for (const theme of ['light', 'dark']) {
    const block = css.match(new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([^}]+)`))?.[1] ?? '';
    const tokens = Object.fromEntries([...block.matchAll(/--cf-([\w-]+):\s*(#[\da-f]{6})/gi)].map(m => [m[1], m[2]]));
    for (const key of ['bg', 'surface', 'text', 'muted', 'accent', 'on-accent', 'border', 'focus', 'danger']) {
      assert.ok(tokens[key], `${theme} must define --cf-${key}`);
    }
    for (const surface of ['bg', 'surface']) {
      for (const text of ['text', 'muted', 'danger']) {
        assert.ok(contrast(tokens[text], tokens[surface]) >= 4.5, `${theme} ${text}/${surface} >= 4.5`);
      }
      for (const control of ['border', 'focus']) {
        assert.ok(contrast(tokens[control], tokens[surface]) >= 3, `${theme} ${control}/${surface} >= 3`);
      }
    }
    assert.ok(contrast(tokens['on-accent'], tokens.accent) >= 4.5, `${theme} CTA text >= 4.5`);
  }
});
