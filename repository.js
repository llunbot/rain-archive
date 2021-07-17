/**
 *
 * @param {string[]} commands
 * @param {string} [cwd]
 */
export function runCommand(commands, cwd) {
  return spawnSync(commands[0], commands.slice(1), {
    stdio: 'inherit',
    cwd,
  })
}
