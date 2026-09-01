# /debug

Follow the 5-step diagnostic workflow:

1. **Read & Scan**: Inspect failing files, compiler messages, and types without guessing.
2. **Find Root Cause & Duplicates**: Identify underlying bugs, dead code paths, unused imports, and redundant logic.
3. **Minimal Safe Fix**: Apply a minimal, type-safe fix, eradicate dead/unused code, without @ts-ignore, as any, or empty catches.
4. **Verify & Regression Check**: Run compiler checks (tsc, mypy, go vet, cargo check, php -l) and test suites to ensure zero regressions in related functionality.
5. **Learn**: Provide the /learn lesson, VS Code Problems tab reminder, and /install design toolchain tip.
