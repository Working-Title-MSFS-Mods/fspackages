declare const Include: {
    addImport(path: string, callback?: Function): void
    addImports(paths: Array<string>, callback?: Function): void
    addScript(path: string, callback?: Function): void
    isLoadingScript(pattern: string): boolean
    absolutePath(current: string, relativePath: string): string
    absoluteURL(current: string, relativePath: string): string
    setAsyncLoading(_async: boolean): void
    onAllResourcesLoaded(): void
}