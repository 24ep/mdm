import { Client as MinioClient } from 'minio'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Client as SftpClient } from 'ssh2-sftp-client'
import { Client as FtpClient } from 'ftp'
import { Readable } from 'stream'

export interface AttachmentStorageConfig {
  provider: 'minio' | 's3' | 'sftp' | 'ftp'
  config: {
    minio: {
      endpoint: string
      access_key: string
      secret_key: string
      bucket: string
      region: string
      use_ssl: boolean
    }
    s3: {
      access_key_id: string
      secret_access_key: string
      bucket: string
      region: string
    }
    sftp: {
      host: string
      port: number
      username: string
      password: string
      path: string
    }
    ftp: {
      host: string
      port: number
      username: string
      password: string
      path: string
      passive: boolean
    }
  }
}

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface DownloadResult {
  success: boolean
  stream?: Readable
  error?: string
}

export class AttachmentStorageService {
  private config: AttachmentStorageConfig

  constructor(config: AttachmentStorageConfig) {
    this.config = config
  }

  async uploadFile(fileName: string, fileBuffer: Buffer, contentType?: string): Promise<UploadResult> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.uploadToMinIO(fileName, fileBuffer, contentType)
        case 's3':
          return await this.uploadToS3(fileName, fileBuffer, contentType)
        case 'sftp':
          return await this.uploadToSFTP(fileName, fileBuffer)
        case 'ftp':
          return await this.uploadToFTP(fileName, fileBuffer)
        default:
          return { success: false, error: `Unsupported provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async downloadFile(fileName: string): Promise<DownloadResult> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.downloadFromMinIO(fileName)
        case 's3':
          return await this.downloadFromS3(fileName)
        case 'sftp':
          return await this.downloadFromSFTP(fileName)
        case 'ftp':
          return await this.downloadFromFTP(fileName)
        default:
          return { success: false, error: `Unsupported provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      }
    }
  }

  async deleteFile(fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      switch (this.config.provider) {
        case 'minio':
          return await this.deleteFromMinIO(fileName)
        case 's3':
          return await this.deleteFromS3(fileName)
        case 'sftp':
          return await this.deleteFromSFTP(fileName)
        case 'ftp':
          return await this.deleteFromFTP(fileName)
        default:
          return { success: false, error: `Unsupported provider: ${this.config.provider}` }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      }
    }
  }

  private async uploadToMinIO(fileName: string, fileBuffer: Buffer, contentType?: string): Promise<UploadResult> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const objectName = `attachments/${fileName}`
    await minioClient.putObject(config.bucket, objectName, fileBuffer, {
      'Content-Type': contentType || 'application/octet-stream'
    })

    const url = `${config.endpoint}/${config.bucket}/${objectName}`
    return { success: true, url, path: objectName }
  }

  private async uploadToS3(fileName: string, fileBuffer: Buffer, contentType?: string): Promise<UploadResult> {
    const config = this.config.config.s3
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key
      }
    })

    const objectName = `attachments/${fileName}`
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectName,
      Body: fileBuffer,
      ContentType: contentType || 'application/octet-stream'
    })

    await s3Client.send(command)

    const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${objectName}`
    return { success: true, url, path: objectName }
  }

  private async uploadToSFTP(fileName: string, fileBuffer: Buffer): Promise<UploadResult> {
    const config = this.config.config.sftp
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password
      })

      const remotePath = `${config.path}/attachments/${fileName}`
      await sftp.put(fileBuffer, remotePath)

      return { success: true, path: remotePath }
    } finally {
      await sftp.end()
    }
  }

  private async uploadToFTP(fileName: string, fileBuffer: Buffer): Promise<UploadResult> {
    const config = this.config.config.ftp

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', () => {
        const remotePath = `${config.path}/attachments/${fileName}`
        ftp.put(fileBuffer, remotePath, (err) => {
          ftp.end()
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true, path: remotePath })
          }
        })
      })

      ftp.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      ftp.connect({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        passive: config.passive
      })
    })
  }

  private async downloadFromMinIO(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const objectName = `attachments/${fileName}`
    const stream = await minioClient.getObject(config.bucket, objectName)
    return { success: true, stream }
  }

  private async downloadFromS3(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.s3
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key
      }
    })

    const objectName = `attachments/${fileName}`
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: objectName
    })

    const response = await s3Client.send(command)
    return { success: true, stream: response.Body as Readable }
  }

  private async downloadFromSFTP(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.sftp
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password
      })

      const remotePath = `${config.path}/attachments/${fileName}`
      const stream = await sftp.createReadStream(remotePath)
      return { success: true, stream }
    } finally {
      await sftp.end()
    }
  }

  private async downloadFromFTP(fileName: string): Promise<DownloadResult> {
    const config = this.config.config.ftp

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', () => {
        const remotePath = `${config.path}/attachments/${fileName}`
        ftp.get(remotePath, (err, stream) => {
          ftp.end()
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true, stream })
          }
        })
      })

      ftp.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      ftp.connect({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        passive: config.passive
      })
    })
  }

  private async deleteFromMinIO(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.minio
    const endpoint = new URL(config.endpoint)
    const port = endpoint.port ? parseInt(endpoint.port) : (endpoint.protocol === 'https:' ? 443 : 80)
    const useSSL = endpoint.protocol === 'https:' || config.use_ssl

    const minioClient = new MinioClient({
      endPoint: endpoint.hostname,
      port: port,
      useSSL: useSSL,
      accessKey: config.access_key,
      secretKey: config.secret_key,
      region: config.region
    })

    const objectName = `attachments/${fileName}`
    await minioClient.removeObject(config.bucket, objectName)
    return { success: true }
  }

  private async deleteFromS3(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.s3
    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.access_key_id,
        secretAccessKey: config.secret_access_key
      }
    })

    const objectName = `attachments/${fileName}`
    const command = new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectName
    })

    await s3Client.send(command)
    return { success: true }
  }

  private async deleteFromSFTP(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.sftp
    const sftp = new SftpClient()

    try {
      await sftp.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password
      })

      const remotePath = `${config.path}/attachments/${fileName}`
      await sftp.delete(remotePath)
      return { success: true }
    } finally {
      await sftp.end()
    }
  }

  private async deleteFromFTP(fileName: string): Promise<{ success: boolean; error?: string }> {
    const config = this.config.config.ftp

    return new Promise((resolve) => {
      const ftp = new FtpClient()

      ftp.on('ready', () => {
        const remotePath = `${config.path}/attachments/${fileName}`
        ftp.delete(remotePath, (err) => {
          ftp.end()
          if (err) {
            resolve({ success: false, error: err.message })
          } else {
            resolve({ success: true })
          }
        })
      })

      ftp.on('error', (err) => {
        resolve({ success: false, error: err.message })
      })

      ftp.connect({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        passive: config.passive
      })
    })
  }
}
