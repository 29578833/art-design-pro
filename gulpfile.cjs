const gulp = require('gulp')
const SftpClient = require('ssh2-sftp-client')
const path = require('path')
const fs = require('fs')
const deployConfig = require('./deploy.config.cjs')

const LOCAL_DIST = path.resolve(__dirname, 'dist')
const VALID_ENVS = ['prod', 'test']

/** 解析部署环境：--env prod|test 或 DEPLOY_ENV */
function resolveDeployEnv() {
  const envArg = process.argv.find((arg) => arg.startsWith('--env='))
  if (envArg) return envArg.split('=')[1]

  const envIdx = process.argv.indexOf('--env')
  if (envIdx !== -1 && process.argv[envIdx + 1]) return process.argv[envIdx + 1]

  return process.env.DEPLOY_ENV || 'prod'
}

function getEnvConfig(env) {
  if (!VALID_ENVS.includes(env)) {
    throw new Error(`无效部署环境 "${env}"，可选: ${VALID_ENVS.join(', ')}`)
  }

  const config = deployConfig[env]
  if (!config) {
    throw new Error(`deploy.config.cjs 缺少 ${env} 配置`)
  }

  return config
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatTimestamp(date = new Date()) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}_${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
}

/** 部署日志用的可读时间，例如 2026-09-04 16:18:05 */
function formatDateTime(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

/** 远程执行 shell 命令 */
function execRemote(client, command) {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, stream) => {
      if (err) return reject(err)

      let stdout = ''
      let stderr = ''

      stream.on('data', (data) => {
        stdout += data.toString()
      })
      stream.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      stream.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`远程命令失败 (${code}): ${command}\n${stderr || stdout}`))
          return
        }
        resolve(stdout.trim())
      })
    })
  })
}

/** 备份远程目录并清理超出保留份数的旧备份 */
async function backupRemoteDir(sftp, config) {
  const { remotePath, keepBackups = 3 } = config
  const parentDir = path.posix.dirname(remotePath)
  const baseName = path.posix.basename(remotePath)
  const backupRoot = path.posix.join(parentDir, `${baseName}_backups`)

  const exists = await sftp.exists(remotePath)
  if (!exists) {
    console.log('远程目录不存在，跳过备份')
    return
  }

  const timestamp = formatTimestamp()
  const backupDir = path.posix.join(backupRoot, timestamp)

  console.log(`备份远程目录: ${remotePath} -> ${backupDir}`)
  await execRemote(
    sftp.client,
    `mkdir -p "${backupRoot}" && cp -a "${remotePath}/." "${backupDir}/"`
  )

  const list = await sftp.list(backupRoot)
  const backups = list
    .filter((item) => item.type === 'd')
    .map((item) => item.name)
    .sort()
    .reverse()

  const toRemove = backups.slice(keepBackups)
  for (const name of toRemove) {
    const oldBackup = path.posix.join(backupRoot, name)
    console.log(`删除旧备份: ${oldBackup}`)
    await sftp.rmdir(oldBackup, true)
  }
}

/** 部署后验证站点可访问 */
async function verifyDeployment(config) {
  const { siteUrl, verifyStrict = true } = config
  if (!siteUrl) {
    console.warn('未配置 siteUrl，跳过部署验证')
    return
  }

  console.log(`验证站点: ${siteUrl}`)

  try {
    const res = await fetch(siteUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000)
    })

    if (res.ok) {
      console.log(`站点验证通过 (${res.status})`)
      return
    }

    const msg = `站点验证失败: HTTP ${res.status}`
    if (verifyStrict) throw new Error(msg)
    console.warn(`[告警] ${msg}（verifyStrict=false，部署继续）`)
  } catch (err) {
    const msg = `站点验证异常: ${err.message}`
    if (verifyStrict) throw new Error(msg)
    console.warn(`[告警] ${msg}（verifyStrict=false，部署继续）`)
  }
}

/** 上传 dist 到远程服务器 */
async function deploy() {
  const env = resolveDeployEnv()
  const config = getEnvConfig(env)
  const { host, port, user, pass, remotePath, cleanRemote } = config

  const startedAt = new Date()
  console.log(`\n========== 部署环境: ${env} ==========`)
  console.log(`开始时间: ${formatDateTime(startedAt)}`)
  console.log(`目标: ${host}:${port} -> ${remotePath}`)
  if (config.siteUrl) console.log(`站点: ${config.siteUrl}`)

  if (!fs.existsSync(LOCAL_DIST)) {
    throw new Error('dist 目录不存在，请先执行 pnpm build')
  }

  const sftp = new SftpClient()

  try {
    console.log(`连接服务器 ${host}:${port} ...`)
    await sftp.connect({
      host,
      port,
      username: user,
      password: pass,
      readyTimeout: 20000
    })

    if (cleanRemote) {
      await backupRemoteDir(sftp, config)
      if (await sftp.exists(remotePath)) {
        console.log(`清空远程目录: ${remotePath}`)
        await sftp.rmdir(remotePath, true)
      }
    }

    if (!(await sftp.exists(remotePath))) {
      console.log(`创建远程目录: ${remotePath}`)
      await sftp.mkdir(remotePath, true)
    }

    console.log(`上传 ${LOCAL_DIST} -> ${remotePath}`)
    await sftp.uploadDir(LOCAL_DIST, remotePath)

    console.log('文件上传完成')
    await verifyDeployment(config)
    const finishedAt = new Date()
    const elapsedSec = ((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1)
    console.log(`\n[${env}] 部署成功  ${formatDateTime(finishedAt)}  耗时 ${elapsedSec}s`)
  } finally {
    await sftp.end()
  }
}

gulp.task('deploy', deploy)

module.exports = {
  deploy,
  resolveDeployEnv,
  getEnvConfig
}
