'use strict'
const util = require('util')
const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')
const spawn = require("cross-spawn")
const inquirer = require('inquirer')
const moment = require('moment')
const ora = require('ora')
const semver = require("semver")

const child_process = require('child_process')

const pExec = util.promisify(child_process.exec)
const pWriteFile = util.promisify(fs.writeFile)

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

const ALPHA = 'alpha'
const ERROR = 'error'

// 步骤拆分
// 以当前代码新建 新的分支
// 修改package.json version
// 推送commit
// 分支合并到当前分支
// 删除分支
// push 修改


module.exports = async function (para) {
  // 检查package.json文件是否有未提交变更
  const {stdout: changed} = await pExec('git status package.json -s', { 'encoding': 'utf8' });
  if (changed.indexOf('package.json') !== -1) {
    console.info(styles.yellow[0] + '%s\x1b[0m', 'package.json 文件有改变还没提交 请先提交后再试')
    console.info(styles.yellow[0] + '%s\x1b[0m', fontWarning.join('\n'))
    return
  }
  // 如果要一并推送功能
  if (para.push !== undefined && para.push) {
    // 检查是否有远程服务器
    const {stdout: remote} = await pExec('git remote', { 'encoding': 'utf8' });
    if (remote === '') {
      console.info(styles.yellow[0] + '%s\x1b[0m', '当前git没有远程库 请先添加远程库')
      console.info(styles.yellow[0] + '%s\x1b[0m', fontWarning.join('\n'))
      return
    }
  }
  // 获取当前版本号
  const packageInfo = require(path.join(process.cwd(), './package.json'))
  const nowVersion = packageInfo.version
  // const nowVersion = '1.0.20'
  const parseVersion =  semver.parse(nowVersion)
  let pre = ALPHA
  if (parseVersion.prerelease.length !== 0) {
    pre = ''
  }
  const patch = semver.inc(nowVersion, "patch");
  const minor = semver.inc(nowVersion, "minor");
  const major = semver.inc(nowVersion, "major");
  const prerelease = semver.inc(nowVersion, "prerelease", pre);

  // 询问要增加版本号的类型
  const nowVersionList = nowVersion.split('.')
  let userVersion = ''
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'version',
      message: `当前版本为${nowVersion},请选择要增加的版本级别`,
      choices: [
        {value: patch, name: `Patch (${patch})`},
        {value: minor, name: `Minor (${minor})`},
        {value: major, name: `Major (${major})`},
        {value: prerelease, name: `Prerelease (${prerelease})`},
        { value: 'PRERELEASE', name: "自定义预发布号" },
        { value: 'CUSTOM', name: "自定义版本号" },
      ]
    }
  ])
  if (answers.version === 'PRERELEASE') {
    const answerPrerelease = await inquirer.prompt([{
      type: 'input',
      name: 'version',
      message: `请输入自定义预发布号`,
      default: ALPHA,
      filter: val => semver.inc(nowVersion, "prerelease", val)
    }])
    userVersion = answerPrerelease.version
  } else if (answers.version === 'CUSTOM') {
    const answerCustom = await inquirer.prompt([{
      type: 'input',
      name: 'version',
      message: `请输入自定义版本号`,
      filter: val => {
        // 如果返回null 会在validate里判断null时报错
        const res = semver.valid(val)
        if (res === null) {
          return ERROR
        }
        return res
      },
      validate: val => {
        // 如果返回null 会在validate里判断null时报错
        if (val === ERROR) {
          return '必须是一个有效的semver版本号'
        }
        return true
      }
    }])
    userVersion = answerCustom.version
  } else {
    userVersion = answers.version
  }
  console.info(styles.cyan[0] + '%s\x1b[0m', `变更: ${nowVersion} => ${userVersion}`)
  const confirm = await inquirer.prompt([{
    type: 'confirm',
    name: 'boolean',
    message: '确定要增加这个tag号吗？',
    default: false
  }])
  if (!confirm.boolean) {
    return
  }
  packageInfo.version = userVersion
  await pWriteFile(path.join(process.cwd(), './package.json'), JSON.stringify(packageInfo, null, 2))

  const {stdout: newChanged} = await pExec('git status package.json -s', { 'encoding': 'utf8' });
  if (newChanged.indexOf('package.json') !== -1) {
    console.info(styles.green[0] + '%s\x1b[0m', '已成功修改package.json文件')
    const {stdout: commit} = await pExec('git commit package.json -m "change version"', { 'encoding': 'utf8' });
    const commitHash = commit.match(/ [a-z0-9A-Z]+(?=])/)[0].replace(' ', '')
    console.info(styles.green[0] + '%s\x1b[0m', `已成功提交package.json文件，HASH为->${commitHash}`)
    const tag = `${packageInfo.name}-${moment().format('YYYY-MM-DD')}-v${userVersion}`
    await pExec(`git tag -a ${tag} -m '${para.message}' ${commitHash}`, { 'encoding': 'utf8' });
    console.info(styles.green[0] + '%s\x1b[0m', `已成功增加Tag，Tag为->${tag}`)

    if (para.push !== undefined && para.push) {
      const spinner = ora(`Loading... 推送Tag至${para.remote}`).start()
      await pExec(`git push ${para.remote} ${tag}`, { 'encoding': 'utf8' });
      spinner.text = 'Loading... 检查Tag是否推送成功'
      const {stdout: remoteTag} = await pExec(`git ls-remote --tags ${para.remote}`, { 'encoding': 'utf8' });
      if (remoteTag.indexOf(tag) !== -1) {
        spinner.succeed(`已成功将Tag号push至${para.remote}`)
      } else {
        spinner.fail(`push失败`)
      }
    }
  }
}