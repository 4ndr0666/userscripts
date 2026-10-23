/* ═══════════════════════════════════════════════════════════════════════════
 * tools/kernel-order.mjs — the single source of truth for kernel assembly
 * ----------------------------------------------------------------------------
 * WO-01 round-1 (F-01/F-06): build.mjs's KERNEL_ORDER and kernel-smoke.mjs's
 * harness order were two hand-maintained lists that had ALREADY diverged
 * (build inlined glass BEFORE store, so glass.js's module-eval capture of
 * Ψ.store bound to null and HUD position persistence silently died in every
 * shipped module build, while the smoke harness loaded store first and
 * never saw the defect). Both consumers now import THIS module — the two
 * orders can never diverge again.
 *
 * ORDER LAW: store must precede glass. glass.js destructures Ψ.brand and
 * Ψ.core at module-eval time (both precede it here) and resolves its store
 * facade lazily at first hud()/settingsConsole() call, so either order now
 * works — but this canonical order is the one the shipped bytes carry.
 *
 * KERNEL_DEPENDENCIES encodes the kernel-internal closure so selectKernel
 * can never ship a module whose eval-time prerequisites are missing: glass
 * needs brand (palette/fonts/transition), core ($new/debounce) and store
 * (persistence facades); hosts calls Ψ.core.uid at registration time.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const KERNEL_ORDER = ["brand", "core", "store", "glass", "hotkeys", "hosts"];

export const KERNEL_DEPENDENCIES = Object.freeze({
    glass: ["brand", "core", "store"],
    hosts: ["core"],
});

/** Complete the dependency closure of a referenced-module list.
 * @param {string[]} referenced modules directly referenced by a body
 * @returns {string[]} referenced set plus every transitively required module */
export function kernelClosure(referenced) {
    const needed = [...referenced];
    let grew = true;
    while (grew) {
        grew = false;
        for (const mod of needed.slice()) {
            for (const dep of KERNEL_DEPENDENCIES[mod] || []) {
                if (!needed.includes(dep)) { needed.push(dep); grew = true; }
            }
        }
    }
    return needed;
}
