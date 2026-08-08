import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Workaround for a rolldown 1.2.1 codegen bug that silently breaks every multi-letter
// TeX command in the app.
//
// KaTeX's lexer builds its token regex from string literals containing lone surrogates:
//
//   "|[\uD800-\uDBFF][\uDC00-\uDFFF]"   ← the surrogate-pair branch
//   "\\\\[^\uD800-\uDFFF]"              ← the control-symbol branch
//
// The katex sources on disk are clean — they write those as ASCII \uXXXX escape sequences.
// But rolldown parses them into real lone surrogates and re-emits them raw. A lone surrogate
// has no valid UTF-8 encoding, so it reaches the browser as U+FFFD and the class decays to
// [� d 8 0 0 - � d b f f]. That now contains the range 0-�, which matches
// very nearly any character, and the two-character branch sits *before* the control-word
// branch in the alternation — so it shadows it.
//
// Result: "J = F\Delta t" tokenises as ["J"," ","="," ","F","\D","e","l","t","a"," ","t"].
// KaTeX never throws (no .katex-error spans, and the MathML <annotation> still echoes the
// correct input), it just renders "\D elta" as literal text. Affects dev and production
// builds alike.
//
// Rebuilding the same literals via String.fromCharCode yields a byte-identical string at
// runtime while leaving no lone surrogate in the source for rolldown to mangle.
// verified: "[\uD800-\uDBFF][\uDC00-\uDFFF]" === "[" + String.fromCharCode(0xD800) + "-" + ...
//
// Remove this plugin once rolldown escapes lone surrogates on output; the correctness
// check below will not fail if it becomes redundant, only if the literals move.
function katexSurrogateFix() {
  // react-katex is CJS and require()s katex, so the file that actually gets bundled is the
  // CJS build. Match both so a future direct `import katex from 'katex'` is covered too.
  const KATEX_ENTRY = /katex[/\\]dist[/\\]katex\.m?js/

  // [source literal, replacement expression] — written with String.raw so the \uXXXX here
  // stay as the six ASCII characters that actually appear in the katex source.
  const targets = [
    [
      String.raw`"\\\\[^\uD800-\uDFFF]"`,
      '("\\\\\\\\[^" + String.fromCharCode(0xD800) + "-" + String.fromCharCode(0xDFFF) + "]")',
    ],
    [
      String.raw`"|[\uD800-\uDBFF][\uDC00-\uDFFF]"`,
      '("|[" + String.fromCharCode(0xD800) + "-" + String.fromCharCode(0xDBFF) + "][" +' +
        ' String.fromCharCode(0xDC00) + "-" + String.fromCharCode(0xDFFF) + "]")',
    ],
  ]

  return {
    name: 'katex-surrogate-fix',
    enforce: 'pre',
    transform(code, id) {
      if (!KATEX_ENTRY.test(id)) return null
      let out = code
      for (const [from, to] of targets) {
        // Fail loudly rather than silently shipping broken maths if a KaTeX upgrade
        // rewrites these literals.
        if (!out.includes(from)) {
          throw new Error(
            `katex-surrogate-fix: expected literal not found in ${id}: ${from}\n` +
              'KaTeX may have changed its lexer. Re-check whether this workaround is still needed.',
          )
        }
        out = out.replaceAll(from, to)
      }
      return { code: out, map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), katexSurrogateFix()],
  // The FastAPI backend runs separately on :8000. Proxying keeps the frontend
  // same-origin in dev, so ChatPanel can fetch the relative path '/api/chat'
  // and the CORS config in backend/main.py is only exercised in production.
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  // The dependency pre-bundler runs its own rolldown pass and does not pick up `plugins`,
  // so the same fix has to be registered there for the dev server.
  optimizeDeps: {
    rolldownOptions: { plugins: [katexSurrogateFix()] },
  },
})
