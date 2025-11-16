declare module 'ftp' {
  import { EventEmitter } from 'events'
  export class Client extends EventEmitter {
    connect(config: any): void
    list(path: string, callback: (err: any, list: any[]) => void): void
    get(path: string, callback: (err: any, stream: any) => void): void
    put(src: any, path: string, callback: (err: any) => void): void
    mkdir(path: string, recursive: boolean, callback: (err: any) => void): void
    rmdir(path: string, callback: (err: any) => void): void
    delete(path: string, callback: (err: any) => void): void
    rename(oldPath: string, newPath: string, callback: (err: any) => void): void
    end(): void
  }
}
