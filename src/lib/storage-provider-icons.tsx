import { 
  Cloud, 
  Server, 
  Database,
  HardDrive,
  Wifi
} from 'lucide-react'

export type StorageProvider = 'aws' | 's3' | 'supabase' | 'cloudflare' | 'minio' | 'sftp' | 'ftp' | 'custom'

export function getStorageProviderIcon(provider: string, className?: string) {
  const iconProps = { className: className || "h-4 w-4" }
  
  switch (provider.toLowerCase()) {
    case 'aws':
    case 's3':
      return <Cloud {...iconProps} className={`${iconProps.className} text-orange-500`} />
    case 'supabase':
      return <Server {...iconProps} className={`${iconProps.className} text-green-500`} />
    case 'cloudflare':
      return <Cloud {...iconProps} className={`${iconProps.className} text-orange-500`} />
    case 'minio':
      return <Database {...iconProps} className={`${iconProps.className} text-blue-500`} />
    case 'sftp':
      return <Wifi {...iconProps} className={`${iconProps.className} text-purple-500`} />
    case 'ftp':
      return <HardDrive {...iconProps} className={`${iconProps.className} text-gray-500`} />
    default:
      return <Server {...iconProps} className={`${iconProps.className} text-gray-500`} />
  }
}

export function getStorageProviderLabel(provider: string): string {
  switch (provider.toLowerCase()) {
    case 'aws':
    case 's3':
      return 'AWS S3'
    case 'supabase':
      return 'Supabase Storage'
    case 'cloudflare':
      return 'Cloudflare R2'
    case 'minio':
      return 'MinIO'
    case 'sftp':
      return 'SFTP'
    case 'ftp':
      return 'FTP'
    default:
      return provider.charAt(0).toUpperCase() + provider.slice(1)
  }
}
