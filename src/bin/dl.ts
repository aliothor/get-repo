import got from 'got'
import ora from 'ora'
import { HttpsProxyAgent } from 'hpagent'
import { URL } from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'
import { program } from 'commander'
import { ensureFileSync } from 'fs-extra'

// const save_file_path = process.cwd()
const config_file_path = path.join(path.dirname(process.argv[1]), '../config.json')
ensureFileSync(config_file_path)

async function getConfigFormFile() {
  try {
    const text = await fs.readFile(config_file_path, { encoding: 'utf-8' })
    const obj: { proxy?: string; path?: string } = text ? JSON.parse(text) : {}
    console.table(obj)
    return obj
  } catch (error) {
    return {}
  }
}

/**
 * Downloads a file from the provided URL.
 *
 * @param urlStr - the URL to download the file from
 * @return
 */
async function download(urlStr: string, save_path?: string) {
  if (typeof urlStr !== 'string') {
    throw Error('下载链接格式错误' + urlStr)
  }

  let temp_url = ''
  if (!urlStr.includes('http')) {
    temp_url = `https://github.com/${urlStr}/archive/refs/heads/master.zip`
  } else {
    temp_url = urlStr
  }

  const { proxy, path: config_path } = await getConfigFormFile()

  const spinner = ora('开始下载').start()
  spinner.color = 'yellow'
  spinner.text = `正在下载: ${temp_url}`
  try {
    const info = handleUrl(temp_url)
    const buf = await got
      .get(temp_url, {
        agent: {
          https: new HttpsProxyAgent({
            //   keepAlive: true,
            //   keepAliveMsecs: 1000,
            //   maxSockets: 256,
            //   maxFreeSockets: 256,
            //   scheduling: 'lifo',
            proxy: proxy ?? 'http://127.0.0.1:7890',
          }),
        },
      })
      .buffer()

    const filename = `${info.repo}-${info.version}.zip`
    const filepath = path.join(save_path ?? config_path ?? './', filename)
    await fs.writeFile(filepath, buf)
    spinner.succeed(`下载完成: ${filepath}`)
  } catch (error) {
    console.error(error)
    spinner.fail(`下载失败: ${temp_url}`)
  }
}

/**
 * Parses the given URL string to extract user, repo, and version information.
 *
 * @param urlStr - The URL string to be parsed.
 * @return  An object containing user, repo, and version information.
 */
function handleUrl(urlStr: string) {
  const url = new URL(urlStr)
  const user = url.pathname.split('/')[1]
  const repo = url.pathname.split('/')[2]
  const version = url.pathname.split('/')[6].replace('.zip', '')
  return { user, repo, version }
}

// download(download_url);

interface Option {
  name: string
  brance?: string
  tag?: string
  path: string
}

program
  .name('download tool')
  .description('github 仓库源码下载工具')
  .option('-n, --name <char>', '用户名称和仓库名称')
  .option('-b, --brance <char>', '按分支下载', 'master')
  .option('-t, --tag <char>', '按标签下载')
  .option('-p, --path <char>', '下载文件保存路径', './')

program.parse()

const options = program.opts<Option>()

async function hadnlerOption(options: Option) {
  if (!options.brance && !options.tag) {
    throw Error('分支名称和标签名称不能同时为空')
  }
  let temp_url: string
  if (options.tag) {
    temp_url = `https://github.com/${options.name}/archive/refs/tags/v${options.tag}.zip`
  } else {
    temp_url = `https://github.com/${options.name}/archive/refs/heads/${options.brance}.zip`
  }
  let temp_path: string | undefined
  if (path.isAbsolute(options.path)) {
    temp_path = options.path
  } else {
    // temp_path = path.join(process.cwd(), options.path)
  }
  await download(temp_url, temp_path)
}

hadnlerOption(options)
