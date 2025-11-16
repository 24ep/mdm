declare module 'ssh2-sftp-client' {
  export class Client {
    connect(config: any): Promise<void>
    list(path: string): Promise<any[]>
    get(path: string, dst?: any): Promise<any>
    put(src: any, path: string): Promise<void>
    mkdir(path: string, recursive?: boolean): Promise<void>
    rmdir(path: string, recursive?: boolean): Promise<void>
    delete(path: string): Promise<void>
    exists(path: string): Promise<boolean>
    exec(command: string): Promise<string>
    createReadStream(path: string): Promise<any>
    rename(oldPath: string, newPath: string): Promise<void>
    end(): Promise<void>
  }
}
