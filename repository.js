import { spawnSync } from 'child_process'
import { Octokit } from '@octokit/rest'
import { join } from 'path'
import { statSync, mkdirSync, readdirSync } from 'fs'

const DATA_BRANCH = 'contents'

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

export async function loadContentBranch() {
  if (!process.env['GITHUB_WORKSPACE']) {
    return
  }
  const workspace = (process.env['GITHUB_WORKSPACE'] || '').split('/') ?? []
  const root = workspace.slice(0, workspace.length - 1).join('/')

  const token = process.env['GITHUB_TOKEN']
  const octokit = new Octokit({
    auth: token,
  })
  const [owner, repo] = (process.env['GITHUB_REPOSITORY'] || '').split('/')
  const response = await octokit.repos.listBranches({
    owner,
    repo,
  })
  const isBranchExist = response.data
    .map((item) => item.name)
    .includes(DATA_BRANCH)
  const checkoutBranch = isBranchExist ? DATA_BRANCH : 'main'
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
      DATA_BRANCH,
    ],
    root
  )
  if (cloneResult.error) {
    throw new Error('Fail to clone repository')
  }

  if (!isBranchExist) {
    console.log(`Create content branch ${DATA_BRANCH}`)
    const pushUrl = `https://${user}:${token}@github.com/${owner}/${repo}`
    runCommand(
      ['git', 'config', '--global', 'user.email', 'bot@llun.dev'],
      join(root, DATA_BRANCH)
    )
    runCommand(
      ['git', 'config', '--global', 'user.name', '"Rain bots"'],
      join(root, DATA_BRANCH)
    )
    const branchResult = runCommand(
      ['git', 'checkout', '-B', DATA_BRANCH],
      join(root, DATA_BRANCH)
    )
    if (branchResult.error) {
      throw new Error('Fail to switch branch')
    }

    runCommand(
      ['rm', '-rf'].concat(
        readdirSync(join(root, DATA_BRANCH)).filter((item) => item !== '.git')
      ),
      join(root, DATA_BRANCH)
    )
    runCommand(['git', 'add', '-f', '-A'], join(root, DATA_BRANCH))
    runCommand(
      ['git', 'commit', '-m', 'Remove all files'],
      join(root, DATA_BRANCH)
    )
    runCommand(
      ['git', 'push', '-f', pushUrl, `HEAD:${DATA_BRANCH}`],
      join(root, DATA_BRANCH)
    )
    console.log('Push empty branch')
  }
}

export async function pushContentBranch() {
  if (!process.env['GITHUB_WORKSPACE']) {
    return
  }

  const user = process.env['GITHUB_ACTOR']
  const token = process.env['GITHUB_TOKEN']
  const [owner, repo] = (process.env['GITHUB_REPOSITORY'] || '').split('/')
  const workspace = (process.env['GITHUB_WORKSPACE'] || '').split('/') ?? []
  const root = workspace.slice(0, workspace.length - 1).join('/')
  const pushUrl = `https://${user}:${token}@github.com/${owner}/${repo}`
  runCommand(['git', 'config', '--global', 'user.email', 'bot@llun.dev'])
  runCommand(['git', 'config', '--global', 'user.name', '"Rain bots"'])
  runCommand(['git', 'add', '-f', '-A'], join(root, DATA_BRANCH))
  runCommand(
    ['git', 'commit', '-m', 'Update contents'],
    join(root, DATA_BRANCH)
  )
  runCommand(
    ['git', 'push', '-f', pushUrl, `HEAD:${DATA_BRANCH}`],
    join(root, DATA_BRANCH)
  )
}

/**
 *
 * @param {string} path
 */
export function makeSureDirectoryExist(path) {
  try {
    statSync(path)
  } catch (error) {
    mkdirSync(path, { recursive: true })
  }
  return path
}

/**
 * Get rain images content path
 * @returns {string}
 */
export function getDataPath() {
  if (process.env['GITHUB_WORKSPACE']) {
    const workspace = (process.env['GITHUB_WORKSPACE'] || '').split('/') ?? []
    const root = workspace.slice(0, workspace.length - 1).join('/')
    return join(root, DATA_BRANCH)
  }

  const rains = join('/tmp', 'rains')
  makeSureDirectoryExist(rains)
  return rains
}

/**
 * Wait time in milliseconds
 *
 * @param {number} ms
 */
export async function sleep(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
