class WT_G3x5_BaseInstrument extends BaseInstrument {
    constructor() {
        super();

        this._isModConfigLoaded = false;

        this._currentTimeStamp = 0;

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
     * The g3000 mod's config settings.
     * @readonly
     * @type {WT_g3000_ModConfig}
     */
    get modConfig() {
        return this._modConfig;
    }

    /**
     * The real-world time stamp of the current update cycle.
     * @readonly
     * @type {Number}
     */
    get currentTimeStamp() {
        return this._currentTimeStamp;
    }

    /**
     * The in-sim time at the beginning of the current update cycle.
     * @readonly
     * @type {WT_TimeReadOnly}
     */
    get time() {
        return this._time.readonly();
    }

    /**
     * The player airplane.
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
                return new WT_TBM930Airplane((() => this.currentTimeStamp).bind(this));
            case WT_PlayerAirplane.Type.CITATION_LONGITUDE:
                return new WT_CitationLongitudeAirplane((() => this.currentTimeStamp).bind(this));
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

        // On first load, force sync of enroute legs from the sim's built-in flight plan so we can grab any legs imported from the world map
        this._asoboEnrouteSyncCount = 0;
        this._forceSyncEnrouteFromAsobo = true;
        if (this.flightPlanManagerWT.isMaster) {
            // lock the active flight plan while attempting to sync enroute legs from the sim's built-in flight plan
            this.flightPlanManagerWT.lockActive();
        }
    }

    _isFlightPlanManagerMaster() {
        return false;
    }

    _initFlightPlanManager() {
        this._fpm = new WT_FlightPlanManager(this._isFlightPlanManagerMaster(), this.instrumentIdentifier, this.airplane, this.icaoWaypointFactory);
        this.airplane.fms.setFlightPlanManager(this._fpm);
        this._forceSyncEnrouteFromAsobo = false;
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

        this._currentTimeStamp = Date.now();
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
            // this needs to be in a try-catch block because for a period of time after loading a flight, Coherent has issues retrieving ICAO waypoint data
            // therefore we don't count forced enroute syncs that encounter errors as successful and will try again the next cycle
            await this.flightPlanManagerWT.syncActiveFromGame(!this.flightPlanManagerWT.activePlanHasManualEdit || this._forceSyncEnrouteFromAsobo);

            // need to force enroute sync multiple times because sometimes the game is late loading all fpln legs from the world map
            if (this._asoboEnrouteSyncCount < WT_G3x5_BaseInstrument.FLIGHT_PLAN_ENROUTE_SYNC_ATTEMPTS) {
                this._asoboEnrouteSyncCount++;
            } else if (this._forceSyncEnrouteFromAsobo) {
                this.flightPlanManagerWT.unlockActive();
                this._forceSyncEnrouteFromAsobo = false;
            }

            if (this.flightPlanManagerWT.isMaster) {
                await this.flightPlanManagerWT.tryAutoActivateApproach();
            }
        } catch (e) {
            console.log(e);
        }
    }

    _updateFlightPlanManager(currentTime) {
        if (currentTime - this.flightPlanManagerWT.lastActivePlanSyncTime >= WT_G3x5_BaseInstrument.FLIGHT_PLAN_SYNC_INTERVAL) {
            this._syncFlightPlanManagerFromAsobo();
        }
        this.flightPlanManagerWT.update(currentTime);
    }

    _doUpdates(currentTime) {
        this._updateTime();
        this._updateICAOWaypointFactory(currentTime);
        this._updateFlightPlanManager(currentTime);
    }

    onUpdate(deltaTime) {
        this._currentTimeStamp = Date.now();
        this._doUpdates(this._currentTimeStamp);
    }
}
WT_G3x5_BaseInstrument.FLIGHT_PLAN_SYNC_INTERVAL = 2000; // ms
WT_G3x5_BaseInstrument.FLIGHT_PLAN_ENROUTE_SYNC_ATTEMPTS = 5;