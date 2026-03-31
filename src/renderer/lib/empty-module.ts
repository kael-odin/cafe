/**
 * Empty module stub for Capacitor builds.
 *
 * Electron-specific modules (like electron-log) are replaced with this
 * empty module when building for mobile. This allows the same renderer
 * code to run on both Electron and Capacitor without conditional imports.
 */

export default {}
export const log = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  verbose: () => {},
  silly: () => {}
}
