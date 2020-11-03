declare const Coherent: {
    events: Array<any>,
    forceEnableMocking: boolean,
    isAttached: boolean,
    IsAttached: boolean,
    isViewLoaded: boolean,
    onEventsReplayed: any,

    call(id: string, ...other: any): Promise
    merge(emitter: any): void
    on(name: string, callback: Function, context: any): object
    off(name: string, handler: Function, context: any): void
    reloadLocalization(): void
    trigger(name: string , ...other: any): void
}
