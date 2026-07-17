const gulp = require('gulp')
const SftpClient = require('ssh2-sftp-client')
const path = require('path')
const fs = require('fs')
const deployConfig = require('./deploy.config.cjs')

const LOCAL_DIST = path.resolve(__dirname, 'dist')

/** 上传 dist 到远程服务器 */
async function deploy() {
  if (!fs.existsSync(LOCAL_DIST)) {
    throw new Error('dist 目录不存在，请先执行 pnpm build')
  }

  const sftp = new SftpClient()
  const { host, port, user, pass, remotePath, cleanRemote } = deployConfig

  console.log(`连接服务器 ${host}:${port} ...`)

  try {
    await sftp.connect({
      host,
      port,
      username: user,
      password: pass,
      readyTimeout: 20000
    })

    const remoteExists = await sftp.exists(remotePath)

    if (cleanRemote && remoteExists) {
      console.log(`清空远程目录: ${remotePath}`)
      await sftp.rmdir(remotePath, true)
    }

    if (!(await sftp.exists(remotePath))) {
      console.log(`创建远程目录: ${remotePath}`)
      await sftp.mkdir(remotePath, true)
    }

    console.log(`上传 ${LOCAL_DIST} -> ${remotePath}`)
    await sftp.uploadDir(LOCAL_DIST, remotePath)

    console.log('部署完成')
  } finally {
    await sftp.end()
  }
}

gulp.task('deploy', deploy)

module.exports = {
  deploy
}
