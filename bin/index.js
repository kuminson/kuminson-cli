#!/usr/bin/env node
const program = require('commander')
const version = require('../package').version

program.version(version, '-v, --version')

program.command('tag')
  .description('打tag号')
  .option('-p, --push', '打完tag号后，推送至远程服务器')
  .option('-r, --remote <remote>', '远程服务器名，默认名为origin', 'origin')
  .action((name) => {
    const Tag = require('../lib/tag')
    Tag({
      push: name.push,
      remote: name.remote
    })
})

program.parse(process.argv)