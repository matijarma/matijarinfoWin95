export function createSymbianShell({ root }) {
  function mount() {
    root.innerHTML = `
      <main class="mobile-shell" role="application" aria-label="Symbian mobile placeholder">
        <section class="mobile-shell__screen">
          <h1>Symbian Mode</h1>
          <p>Mobile branch placeholder is active.</p>
          <p>Desktop runtime is intentionally isolated from this path.</p>
        </section>
      </main>
    `;
  }

  function unmount() {
    root.innerHTML = "";
  }

  return {
    mount,
    unmount,
  };
}
