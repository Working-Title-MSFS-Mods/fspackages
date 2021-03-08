class WT_G3x5_BaseInstrument extends BaseInstrument {
    constructor() {
        super();

        this._isModConfigLoaded = false;
    }

    async _loadModConfig() {
        await WT_g3000_ModConfig.initialize();
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
                    this.beforeUpdate();
                    this.Update();
                    this.afterUpdate();
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
}