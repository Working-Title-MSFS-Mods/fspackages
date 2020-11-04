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

declare const g_modDebugMgr: {
    AddConsole(obj: any): void
}

declare enum Aircraft {
    CJ4,
    A320_NEO,
    B747_8,
    AS01B,
    AS02A
}

declare enum AutopilotMode {
    MANAGED,
    SELECTED,
    HOLD
}

declare enum EInputStatus {
    idle,
    pressed,
    down,
    released
}

declare enum EngineType {
    ENGINE_TYPE_PISTON,
    ENGINE_TYPE_JET,
    ENGINE_TYPE_NONE,
    ENGINE_TYPE_HELO_TURBINE,
    ENGINE_TYPE_ROCKET,
    ENGINE_TYPE_TURBOPROP
}

declare enum FlightPhase {
    FLIGHT_PHASE_PREFLIGHT,
    FLIGHT_PHASE_TAXI,
    FLIGHT_PHASE_TAKEOFF,
    FLIGHT_PHASE_CLIMB,
    FLIGHT_PHASE_CRUISE,
    FLIGHT_PHASE_DESCENT,
    FLIGHT_PHASE_APPROACH,
    FLIGHT_PHASE_GOAROUND
}

declare enum ThrottleMode {
    UNKNOWN,
    REVERSE,
    IDLE,
    AUTO,
    CLIMB,
    FLEX_MCT,
    TOGA,
    HOLD
}

declare enum WorldRegion {
    NORTH_AMERICA,
    AUSTRALIA,
    OTHER
}
