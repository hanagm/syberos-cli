import * as path from 'path'
import * as fs from 'fs-extra'
import chalk from 'chalk'
import * as inquirer from 'inquirer'
import * as semver from 'semver'

import Creator from './creator'

import { shouldUseYarn, shouldUseCnpm, getPkgVersion } from '../util'
import CONFIG from '../config'

interface IProjectConf {
  projectName: string
  projectDir: string
  sopid: string
  template: 'default' | 'mobx' | 'redux'
  description?: string
  typescript?: boolean
  css: 'none' | 'sass' | 'stylus' | 'less'
  date?: string
  src?: string
}

export default class Project extends Creator {
  public rootPath: string
  public conf: IProjectConf

  constructor(options: IProjectConf) {
    super()
    const unSupportedVer = semver.lt(process.version, 'v7.6.0')
    if (unSupportedVer) {
      throw new Error('Node.js 版本过低，推荐升级 Node.js 至 v8.0.0+')
    }
    this.rootPath = this._rootPath

    this.conf = Object.assign(
      {
        typescript: false,
        projectName: '',
        projectDir: '',
        template: 'default',
        sopid: 'com.syberos.demo',
        description: ''
      },
      options
    )
  }

  init() {
    console.log(chalk.green(`SYBEROS-CLI 即将创建一个新项目!`))
    console.log(
      'Need help? Go and open issue: https://github.com/syberos-team/syberos-hybrid'
    )
    console.log()
  }

  create() {
    this.ask().then(answers => {
      if (!answers.sopid) {
        answers.sopid = this.conf.sopid
      }
      const date = new Date()
      this.conf = Object.assign(this.conf, answers)
      this.conf.date = `${date.getFullYear()}-${date.getMonth() +
        1}-${date.getDate()}`
      this.write()
    })
  }

  ask() {
    const prompts: object[] = []
    const conf = this.conf
    if (typeof conf.projectName !== 'string') {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称:',
        validate(input) {
          if (!input) {
            return '项目名不能为空！'
          }
          if (fs.existsSync(input)) {
            return '当前目录已经存在同名项目，请换一个项目名！'
          }
          return true
        }
      })
    } else if (fs.existsSync(conf.projectName)) {
      prompts.push({
        type: 'input',
        name: 'projectName',
        message: '当前目录已经存在同名项目，请换一个项目名！',
        validate(input) {
          if (!input) {
            return '项目名不能为空！'
          }
          if (fs.existsSync(input)) {
            return '项目名依然重复！'
          }
          return true
        }
      })
    }

    if (conf.sopid === 'com.syberos.demo') {
      prompts.push({
        type: 'input',
        name: 'sopid',
        message: '请输入sopid,如【com.syber.myapp】:',
        validate(input) {
          if (!input) {
            return 'sopid不能为空！'
          }
          const re = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi
          if (re.test(input)) {
            return 'sopid不能含有中文！'
          }

          return true
        }
      })
    }

    if (typeof conf.description !== 'string') {
      prompts.push({
        type: 'input',
        name: 'description',
        message: '请输入项目介绍:'
      })
    }

    // 隐藏模板选择
    // const templateChoices = [{
    //   name: '默认模板',
    //   value: 'default'
    // }]

    // if (typeof conf.template !== 'string') {
    //   prompts.push({
    //     type: 'list',
    //     name: 'template',
    //     message: '请选择模板',
    //     choices: templateChoices
    //   })
    // } else {
    //   let isTemplateExist = false
    //   templateChoices.forEach(item => {
    //     if (item.value === conf.template) {
    //       isTemplateExist = true
    //     }
    //   })
    //   if (!isTemplateExist) {
    //     console.log(chalk.red('你选择的模板不存在!'))
    //     console.log(chalk.red('目前提供了以下模板以供使用:'))
    //     console.log()
    //     templateChoices.forEach(item => {
    //       console.log(chalk.green(`- ${item.name}`))
    //     })
    //     process.exit(1)
    //   }
    // }

    return inquirer.prompt(prompts)
  }

  write(cb?: () => void) {
    const { template } = this.conf
    this.conf.src = CONFIG.SOURCE_DIR
    const { createApp } = require(path.join(
      this.templatePath(),
      template,
      'index.js'
    ))
    createApp(
      this,
      this.conf,
      {
        shouldUseYarn,
        shouldUseCnpm,
        getPkgVersion
      },
      cb
    )
  }
}
