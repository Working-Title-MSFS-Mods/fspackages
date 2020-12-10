class WT_Dependency_Missing_Error extends Error { };
class WT_Dependency_Cyclic_Dependency_Error extends Error { };

class WT_Dependency {
    constructor(factory, options) {
        this.factory = factory;
        this.scope = options.scope || "singleton";
    }
}

class WT_Dependency_Container {
    constructor() {
        this._dependencies = {};
        this._values = {};

        const handler = {
            get: function (target, prop, receiver) {
                return target._get(prop);
            }
        };
        this.factoryCalled = "";
        this.factoriesCalled = {};
        this._proxy = new Proxy(this, handler);
    }
    _get(name, useCache = true) {
        if (name in this.factoriesCalled) {
            throw new WT_Dependency_Cyclic_Dependency_Error(`Cyclic dependency detected when creating "${this.factoryCalled}" (${Object.keys(this.factoriesCalled).join(" -> ")})`);
        }
        this.factoriesCalled[name] = true;

        const dependency = this._dependencies[name];
        if (!dependency)
            throw new WT_Dependency_Missing_Error(`Factory not found for "${name}"`);

        if (this._values[name] && useCache) {
            delete this.factoriesCalled[name];
            return this._values[name];
        }

        const instance = dependency.factory(this._proxy);
        if (dependency.scope == "singleton") {
            this._values[name] = instance;
        }

        delete this.factoriesCalled[name];
        return instance;
    }
    create(name) {
        return this._get(name, false);
    }
    register(name, factory, options = {}) {
        this._dependencies[name] = new WT_Dependency(factory, options);
    }
    getDependencies() {
        const handler = {
            get: (target, prop, receiver) => {
                this.factoryCalled = prop;
                this.factoriesCalled = {};
                return target._get(prop);
            }
        };
        return new Proxy(this, handler);
    }
}

class WT_Shared_Dependencies {
    static add(d, navSystem) {
        d.register("beforeUpdate$", d => new rxjs.Subject());
        d.register("afterUpdate$", d => new rxjs.Subject());
        d.register("update$", d => {
            const update$ = new rxjs.Subject();
            navSystem.updatables.push({
                update: dt => {
                    update$.next(dt);
                }
            });
            return update$;
        });
        d.register("frame$", d => {
            return d.update$.pipe(
                rxjs.operators.scan((total, dt) => (total + dt) % 100000, 0),
                rxjs.operators.map(v => v / 1000),
                WT_RX.shareReplay()
            );
        });

        // Data / Events
        d.register("sharedData", d => new WT_Shared_Instrument_Data());
        d.register("sharedEvents", d => new WT_Shared_Instrument_Events(navSystem));
        d.register("flightSimEvents", d => new WT_Flight_Sim_Events());
        d.register("sound", d => new WT_Sound());
        d.register("airportDatabase", d => new WT_Airport_Database());
        d.register("procedures", d => new Procedures(d.flightPlanManager));
        d.register("metarDownloader", d => new WT_Metar_Downloader());
        d.register("metarRepository", d => new WT_Metar_Repository(d.metarDownloader, d.update$));
        d.register("releaseRepository", d => new WT_Release_Repository("g1000"));
        d.register("activeLegInformation", d => new WT_Flight_Plan_Active_Leg_Information(d.sharedEvents));

        // Input
        d.register("inputStack", d => new Input_Stack(d.flightSimEvents));
        d.register("mapInputLayerFactory", d => new WT_Map_Input_Layer_Factory(d.modSettings));

        // Plane
        d.register("planeConfig", d => new WT_Plane_Config());
        d.register("planeState", d => new WT_Plane_State(d.update$, d.electricityAvailable));
        d.register("planeStatistics", d => new WT_Plane_Statistics(d.update$, d.planeState, d.clock));

        // Instrumentation
        d.register("anemometer", d => new WT_Anemometer(d.frame$, d.planeState));
        d.register("autoPilot", d => new WT_Auto_Pilot(d.update$));
        d.register("electricityAvailable", d => new Subject(navSystem.isElectricityAvailable()));
        d.register("fuelUsed", d => new WT_Fuel_Used(d.planeState, ["FUEL LEFT QUANTITY", "FUEL RIGHT QUANTITY"]));
        d.register("radioAltimeter", d => new WT_Radio_Altimeter(d.planeConfig, d.update$));
        d.register("thermometer", d => new WT_Thermometer(d.frame$));
        d.register("brightnessSettings", d => new WT_Brightness_Settings(d.clock));
        d.register("clock", d => new WT_Clock(d.update$, d.planeState));
        d.register("barometricPressure", d => new WT_Barometer(d.update$));
        d.register("minimums", d => new WT_Minimums(d.update$, d.radioAltimeter, d.planeState));

        // Components
        d.register("softKeyController", d => navSystem.querySelector("g1000-soft-key-menu"));

        // Settings
        d.register("settings", d => new WT_Settings("Settings", WT_Default_Settings.base));
        d.register("modSettings", d => {
            const settings = new WT_Settings("ModSettings", WT_Default_Settings.modBase);
            Selectables_Input_Layer.SCROLL_DIRECTION = settings.getValue("navigation_knob")
            settings.addListener(value => Selectables_Input_Layer.SCROLL_DIRECTION = value, "navigation_knob");
            return settings;
        });
        d.register("unitChooser", d => new WT_Unit_Chooser(d.settings));

        d.register("flightPlanManager", d => navSystem.currFlightPlanManager);
        d.register("facilityLoader", d => navSystem.facilityLoader);
        d.register("waypointRepository", d => new WT_Waypoint_Repository(d.facilityLoader));
        d.register("nearestWaypoints", d => new WT_Nearest_Waypoints_Repository(d.update$, navSystem, d.settings, d.planeState));
        d.register("waypointQuickSelect", d => new WT_Waypoint_Quick_Select(navSystem, d.flightPlanManager));

        // Models / Views
        d.register("directToModel", d => new WT_Direct_To_Model(navSystem, null, d.waypointRepository, d.directToHandler));
        d.register("flightPlanModel", d => new WT_Flight_Plan_Page_Model(d.flightPlanManager, d.procedures, null));

        d.register("approachPageView", d => new WT_Approach_Page_View());
        d.register("departurePageView", d => new WT_Departure_Page_View());
        d.register("arrivalPageView", d => new WT_Arrival_Page_View());
        d.register("procedureFacilityRepository", d => new WT_Procedure_Facility_Repository(d.facilityLoader));

        d.register("comFrequenciesModel", d => new WT_Com_Frequencies_Model(d.update$));
        d.register("navFrequenciesModel", d => new WT_Nav_Frequencies_Model(d.update$));

        d.register("showDuplicatesHandler", d => new WT_Show_Duplicates_Handler());
        d.register("icaoInputModel", d => new WT_Icao_Input_Model(d.showDuplicatesHandler, d.waypointQuickSelect), { scope: "transient" });
        d.register("waypointInputModel", d => new WT_Waypoint_Input_Model(d.icaoInputModel, d.waypointRepository), { scope: "transient" });

        // Debug
        d.register("debugConsole", d => new WT_Debug_Console(navSystem, d.update$, d.beforeUpdate$, d.afterUpdate$));
        d.register("debugConsoleView", d => new WT_Debug_Console_View(navSystem));

        d.register("debugConsoleMenu", d => new WT_Debug_Console_Menu(d.softKeyMenuHandler, d.debugConsole));
        d.register("debugDataStoreMenu", d => new WT_Debug_Data_Store_Menu(d.softKeyMenuHandler));

        d.register("debugMenu", d => new WT_Debug_Menu(d.softKeyMenuHandler, d.debugConsoleMenu, d.debugDataStoreMenu));
    }
}