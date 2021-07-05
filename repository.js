// @ts-check
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

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

export function getGithubActionPath() {
  const actionPath = '/home/runner/work/_actions/llun/rain-archive'
  try {
    const files = fs.readdirSync(actionPath)
    const version = files.filter((file) => {
      const stat = fs.statSync(path.join(actionPath, file))
      return stat.isDirectory()
    })
    return path.join(actionPath, version.pop() || 'main')
  } catch (error) {
    return path.join(actionPath, 'main')
  }
}

export async function setup() {
  console.log('Action: ', process.env['GITHUB_ACTION'])
  if (process.env['GITHUB_ACTION'] === '__llun_rain-archive') {
    const result = runCommand(['yarn', 'install'], getGithubActionPath())
    if (result.error) {
      throw new Error('Fail to run setup')
    }
  }

  const workSpace = process.env['GITHUB_WORKSPACE']
  if (workSpace) {
    const core = require('@actions/core')
    const github = require('@actions/github')
    const { Octokit } = require('@octokit/rest')
    const user = process.env['GITHUB_ACTOR']
    const token = core.getInput('token', { required: true })
    const branch = core.getInput('branch', { required: true })

    const octokit = new Octokit({
      auth: token,
    })
    const response = await octokit.repos.listBranches({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    })
    const isBranchExist = response.data
      .map((item) => item.name)
      .includes(branch)
    const checkoutBranch = isBranchExist
      ? branch
      : github.context.ref.substring('refs/heads/'.length)
    const cloneUrl = `https://${user}:${token}@github.com/${github.context.repo.owner}/${github.context.repo.repo}`
    const cloneResult = runCommand([
      'git',
      'clone',
      '-b',
      checkoutBranch,
      '--depth',
      '1',
      cloneUrl,
      workSpace,
    ])
    if (cloneResult.error) {
      throw new Error('Fail to clone repository')
    }

    if (!isBranchExist) {
      console.log(`Create content branch ${branch}`)
      const branchResult = runCommand(['git', 'checkout', '-B', branch])
      if (branchResult.error) {
        throw new Error('Fail to switch branch')
      }
    }
  }
}
