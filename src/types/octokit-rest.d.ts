declare module '@octokit/rest' {
  export class Octokit {
    constructor(options?: any)
    repos: {
      get: (params: any) => Promise<any>
      createOrUpdateFileContents: (params: any) => Promise<any>
      getContent: (params: any) => Promise<any>
      create: (params: any) => Promise<any>
      update: (params: any) => Promise<any>
      delete: (params: any) => Promise<any>
    }
    issues: {
      create: (params: any) => Promise<any>
      update: (params: any) => Promise<any>
      listForRepo: (params: any) => Promise<any>
    }
    pulls: {
      create: (params: any) => Promise<any>
      list: (params: any) => Promise<any>
      get: (params: any) => Promise<any>
    }
  }
}
