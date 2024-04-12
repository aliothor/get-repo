import { program } from 'commander'
import fs from 'node:fs/promises'
import path from 'node:path'
import { ensureFileSync, pathExists } from 'fs-extra/esm'

interface Option {
  show: boolean
  path?: string
  proxy?: string
}

program
  .name('config tool')
  .description('修改工具默认配置')
  .option('-s, --show', '查看当前配置', true)
  .option('-path, --path <char>', '设置默认下载地址')
  .option('-proxy, --proxy <char>', '设置默认代理')

program.parse()

const options = program.opts<Option>()

const config_file_path = path.join(path.dirname(process.argv[1]), '../config.json')

try {
  const stat = await fs.stat(config_file_path)
} catch (error) {
  ensureFileSync(config_file_path)
  await setConfigFile('path', './', false)
  await setConfigFile('proxy', 'http://127.0.0.1:7890', false)
}

if (options.show) {
  await logConfigFile()
}

async function logConfigFile() {
  const config_text = await fs.readFile(config_file_path, { encoding: 'utf-8' })
  config_text && console.table(JSON.parse(config_text))
}

async function setConfigFile(key: 'path' | 'proxy', value: string, log = true) {
  const config_text = await fs.readFile(config_file_path, { encoding: 'utf-8' })
  const obj: Option = config_text ? JSON.parse(config_text) : {}
  obj[key] = value
  await fs.writeFile(config_file_path, JSON.stringify(obj, null, 2))
  log && console.table(obj)
}

if (options.path) {
  await setConfigFile('path', options.path)
}

if (options.proxy) {
  await setConfigFile('proxy', options.proxy)
}

// console.log(options)
