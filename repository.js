import { spawnSync } from 'child_process'
import { Octokit } from '@octokit/rest'
import { join } from 'path'

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

export async function loadDataBranch() {
  const dataBranch = 'data'
  const workspace = (process.env['GITHUB_WORKSPACE'] || '').split('/') ?? []
  const root = workspace.slice(0, workspace.length - 1).join('/')
  console.log(root)
  runCommand(['ls', root])

  const octokit = new Octokit({
    auth: process.env['GITHUB_TOKEN'],
  })
  const [owner, repo] = (process.env['GITHUB_REPOSITORY'] || '').split('/')
  const response = await octokit.repos.listBranches({
    owner,
    repo,
  })
  const isBranchExist = response.data
    .map((item) => item.name)
    .includes(dataBranch)
  const checkoutBranch = isBranchExist ? dataBranch : 'main'
  const user = process.env['GITHUB_ACTOR']
  const cloneUrl = `https://${user}:${token}@github.com/${owner}/${repo}`
  const cloneResult = runCommand(
    [
      'git',
      'clone',
      '-b',
      checkoutBranch,
      '--depth',
      '1',
      cloneUrl,
      dataBranch,
    ],
    root
  )
  if (cloneResult.error) {
    throw new Error('Fail to clone repository')
  }

  if (!isBranchExist) {
    console.log(`Create content branch ${branch}`)
    const branchResult = runCommand(
      ['git', 'checkout', '-B', dataBranch],
      join(root, dataBranch)
    )
    if (branchResult.error) {
      throw new Error('Fail to switch branch')
    }
  }

  runCommand(['ls', root])
}
