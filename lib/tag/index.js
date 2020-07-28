'use strict'
const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')
const spawn = require("cross-spawn")
const inquirer = require('inquirer')
const moment = require('moment')

const child_process = require('child_process')

const fontWarning = [
  '██╗    ██╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗',
  '██║    ██║██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝',
  '██║ █╗ ██║███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗',
  '██║███╗██║██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║',
  '╚███╔███╔╝██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝',
  '╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝'
]

const styles = {
  'bold'          : ['\x1B[1m',  '\x1B[22m'],
  'italic'        : ['\x1B[3m',  '\x1B[23m'],
  'underline'     : ['\x1B[4m',  '\x1B[24m'],
  'inverse'       : ['\x1B[7m',  '\x1B[27m'],
  'strikethrough' : ['\x1B[9m',  '\x1B[29m'],
  'white'         : ['\x1B[37m', '\x1B[39m'],
  'grey'          : ['\x1B[90m', '\x1B[39m'],
  'black'         : ['\x1B[30m', '\x1B[39m'],
  'blue'          : ['\x1B[34m', '\x1B[39m'],
  'cyan'          : ['\x1B[36m', '\x1B[39m'],
  'green'         : ['\x1B[32m', '\x1B[39m'],
  'magenta'       : ['\x1B[35m', '\x1B[39m'],
  'red'           : ['\x1B[31m', '\x1B[39m'],
  'yellow'        : ['\x1B[33m', '\x1B[39m'],
  'whiteBG'       : ['\x1B[47m', '\x1B[49m'],
  'greyBG'        : ['\x1B[49;5;8m', '\x1B[49m'],
  'blackBG'       : ['\x1B[40m', '\x1B[49m'],
  'blueBG'        : ['\x1B[44m', '\x1B[49m'],
  'cyanBG'        : ['\x1B[46m', '\x1B[49m'],
  'greenBG'       : ['\x1B[42m', '\x1B[49m'],
  'magentaBG'     : ['\x1B[45m', '\x1B[49m'],
  'redBG'         : ['\x1B[41m', '\x1B[49m'],
  'yellowBG'      : ['\x1B[43m', '\x1B[49m']
}


module.exports = function (para) {
  // 检查package.json文件是否有未提交变更
  const changed = child_process.execSync('git status package.json -s', { 'encoding': 'utf8' });
  if (changed.indexOf('package.json') !== -1) {
    console.info(styles.yellow[0] + '%s\x1b[0m', 'package.json 文件有改变还没提交 请先提交后再试')
    console.info(styles.yellow[0] + '%s\x1b[0m', fontWarning.join('\n'))
    return
  }
  // 如果要一并推送功能
  if (para.push !== undefined && para.push) {
    // 检查是否有远程服务器
    const remote = child_process.execSync('git remote', { 'encoding': 'utf8' });
    if (remote === '') {
      console.info(styles.yellow[0] + '%s\x1b[0m', '当前git没有远程库 请先添加远程库')
      console.info(styles.yellow[0] + '%s\x1b[0m', fontWarning.join('\n'))
        return
    }
  }
  // 获取当前版本号
  const packageInfo = require(path.join(process.cwd(), './package.json'))
  const nowVersion = packageInfo.version
  // 询问要增加版本号的类型
  const nowVersionList = nowVersion.split('.')
  inquirer.prompt([
    {
      type: 'list',
      name: 'version',
      message: `当前版本为${nowVersion},请选择要增加的版本级别`,
      choices: [
        [Number(nowVersionList[0]), Number(nowVersionList[1]), Number(nowVersionList[2]) + 1].join('.'),
        [Number(nowVersionList[0]), Number(nowVersionList[1]) + 1, Number(nowVersionList[2])].join('.'),
        [Number(nowVersionList[0]) + 1, Number(nowVersionList[1]), Number(nowVersionList[2])].join('.')
      ]
    }
  ]).then(answers => {
    console.log('answers', answers)
    packageInfo.version = answers.version
    fs.writeFile(path.join(process.cwd(), './package.json'), JSON.stringify(packageInfo, null, 2), function (err) {
      if (err) console.log('err', err)
      const newChanged = child_process.execSync('git status package.json -s', { 'encoding': 'utf8' });
      if (newChanged.indexOf('package.json') !== -1) {
        const commit = child_process.execSync('git commit package.json -m "add tag"', { 'encoding': 'utf8' });
        const commitHash = commit.match(/ [a-z0-9A-Z]+(?=])/)[0].replace(' ', '')
        console.log('commitHash >>>>', commitHash)
        const tag = `${packageInfo.name}-${moment().format('YYYY-MM-DD')}-v${answers.version}`
        child_process.execSync(`git tag -a ${tag} -m 'add tag' ${commitHash}`, { 'encoding': 'utf8' });
        console.log('tag >>>>', tag)

        if (para.push !== undefined && para.push) {
          const pushTag = child_process.execSync(`git push ${para.remote} ${tag}`, { 'encoding': 'utf8' });
          console.log('pushTag >>>', pushTag)
        }
      }
    })
  })
}