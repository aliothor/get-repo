import { program } from 'commander'

interface Option {
  name: string
}

program
  .name('get-repo')
  .description('github 仓库源码下载工具')
  .option('-n, --name <char>', '用户名称和仓库名称')
  .option('-b, --brance <char>', '按分支下载', 'master')
  .option('-t, --tag <char>', '按标签下载')
  .option('-p, --path <char>', '下载文件保存路径', './')

program.parse()

const options = program.opts<Option>()