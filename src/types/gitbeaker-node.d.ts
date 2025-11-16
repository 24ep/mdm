declare module '@gitbeaker/node' {
  export class GitLab {
    constructor(options?: any)
    Projects: {
      all: (options?: any) => Promise<any>
      show: (projectId: string | number, options?: any) => Promise<any>
      create: (options?: any) => Promise<any>
      edit: (projectId: string | number, options?: any) => Promise<any>
      remove: (projectId: string | number) => Promise<any>
    }
    RepositoryFiles: {
      show: (projectId: string | number, filePath: string, options?: any) => Promise<any>
      create: (projectId: string | number, filePath: string, options?: any) => Promise<any>
      edit: (projectId: string | number, options?: any) => Promise<any>
      remove: (projectId: string | number, filePath: string, options?: any) => Promise<any>
    }
    Issues: {
      all: (projectId: string | number, options?: any) => Promise<any>
      show: (projectId: string | number, issueIid: number, options?: any) => Promise<any>
      create: (projectId: string | number, options?: any) => Promise<any>
      edit: (projectId: string | number, issueIid: number, options?: any) => Promise<any>
    }
    MergeRequests: {
      all: (projectId: string | number, options?: any) => Promise<any>
      show: (projectId: string | number, mergerequestIid: number, options?: any) => Promise<any>
      create: (projectId: string | number, options?: any) => Promise<any>
    }
  }
}
