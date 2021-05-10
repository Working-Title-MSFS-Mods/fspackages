class WT_G3x5_BaseInstrument extends BaseInstrument {
    constructor() {
        super();

        this._isModConfigLoaded = false;

        this._icaoWaypointFactory = new WT_ICAOWaypointFactory();
        this._unitsSettingModel = new WT_G3x5_UnitsSettingModel();
        this._avionicsSystemSettingModel = new WT_G3x5_AvionicsSystemSettingModel();
    }

    /**
     * @readonly
     */
    get gameState() {
        return this._gameState;
    }

    /**
     * @readonly
     * @type {WT_g3000_ModConfig}
     */
    get modConfig() {
        return this._modConfig;
    }

    /**
     * @readonly
     * @type {WT_TimeReadOnly}
     */
    get time() {
        return this._time.readonly();
    }

    /**
     * @readonly
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }

    /**
     * @readonly
     * @type {WT_ICAOWaypointFactory}
     */
    get icaoWaypointFactory() {
        return this._icaoWaypointFactory;
    }

    /**
     * @readonly
     * @type {{airport:WT_ICAOSearcher, vor:WT_ICAOSearcher, ndb:WT_ICAOSearcher, int:WT_ICAOSearcher}}
     */
    get icaoSearchers() {
        return this._icaoSearchers;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanManager}
     */
    get flightPlanManagerWT() {
        return this._fpm;
    }

    /**
     * @readonly
     * @type {WT_G3x5_AvionicsSystemSettingModel}
     */
    get avionicsSystemSettingModel() {
        return this._avionicsSystemSettingModel;
    }

    /**
     * @readonly
     * @type {WT_G3x5_UnitsSettingModel}
     */
    get unitsSettingModel() {
        return this._unitsSettingModel;
    }

    async _loadModConfig() {
        this._modConfig = await WT_g3000_ModConfig.initialize();
        this._isModConfigLoaded = true;
    }

    connectedCallback() {
        super.connectedCallback();

        this._loadModConfig();
    }

    createMainLoop() {
        if (this._isConnected) {
            return;
        }
        this._lastTime = Date.now();
        let updateLoop = () => {
            if (!this._isConnected) {
                console.log("Exiting MainLoop...");
                return;
            }
            try {
                if (BaseInstrument.allInstrumentsLoaded && !this.xmlConfigLoading && this._isModConfigLoaded && SimVar.IsReady()) {
                    if (!this._isInitialized)
                        this.Init();
                    this.doUpdate();
                }
            } catch (e) {
                console.error(this.instrumentIdentifier + " : " + e, e.stack);
            }
            requestAnimationFrame(updateLoop);
        };
        this._isConnected = true;
        console.log("MainLoop created");
        requestAnimationFrame(updateLoop);
    }

    _initTime() {
        this._time = new WT_Time(WT_Time.absoluteTimeToUnix(SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds")));
    }

    _createAirplane() {
        switch (WT_PlayerAirplane.getAircraftType()) {
            case WT_PlayerAirplane.Type.TBM930:
                return new WT_TBM930Airplane();
            case WT_PlayerAirplane.Type.CITATION_LONGITUDE:
                return new WT_CitationLongitudeAirplane();
        }
    }

    _initAirplane() {
        this._airplane = this._createAirplane();
    }

    async _loadATCFlightPlan() {
        // this pulls the flight plan that was set in the world map (if one exists) into the sim's built-in flight plan
        await Coherent.call("LOAD_CURRENT_GAME_FLIGHT");
        await Coherent.call("LOAD_CURRENT_ATC_FLIGHTPLAN");
        await WT_Wait.awaitCallback(() => this.gameState === GameState.ingame, this);
        this._needSyncEnrouteFromAsobo = true;
    }

    _initFlightPlanManager() {
        this._fpm = new WT_FlightPlanManager(this.instrumentIdentifier, this.airplane, this.icaoWaypointFactory);
        this.airplane.fms.setFlightPlanManager(this._fpm);
        this._needSyncEnrouteFromAsobo = false;
        this._loadATCFlightPlan();
    }

    _initICAOSearchers() {
        this._icaoSearchers = {
            airport: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.AIRPORT),
            vor: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.VOR),
            ndb: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.NDB),
            int: new WT_ICAOSearcher(this.instrumentIdentifier, WT_ICAOSearcher.Keys.INT)
        };
    }

    Init() {
        super.Init();

        this._initTime();
        this._initAirplane();
        this._initFlightPlanManager();
        this._initICAOSearchers();
    }

    _updateTime() {
        this._time.set(WT_Time.absoluteTimeToUnix(SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds")));
    }

    _updateICAOWaypointFactory(currentTime) {
        this.icaoWaypointFactory.update();
    }

    async _syncFlightPlanManagerFromAsobo() {
        try {
            // we need to sync the enroute segment from the sim's built-in flight plan once so that the system correctly
            // loads in flight plans imported from the world map
            await this.flightPlanManagerWT.syncActiveFromGame(this._needSyncEnrouteFromAsobo);
            this._needSyncEnrouteFromAsobo = false;
        } catch (e) {
            console.log(e);
        }
    }

    _updateFlightPlanManager(currentTime) {
        if (currentTime - this.flightPlanManagerWT.lastActiveSyncTime >= WT_G3x5_BaseInstrument.FLIGHT_PLAN_SYNC_INTERVAL) {
            this._syncFlightPlanManagerFromAsobo();
        }
    }

    _doUpdates(currentTime) {
        this._updateTime();
        this._updateICAOWaypointFactory(currentTime);
        this._updateFlightPlanManager(currentTime);
    }

    onUpdate(deltaTime) {
        let currentTime = Date.now();
        this._doUpdates(currentTime);
    }
}
WT_G3x5_BaseInstrument.FLIGHT_PLAN_SYNC_INTERVAL = 2000; // ms