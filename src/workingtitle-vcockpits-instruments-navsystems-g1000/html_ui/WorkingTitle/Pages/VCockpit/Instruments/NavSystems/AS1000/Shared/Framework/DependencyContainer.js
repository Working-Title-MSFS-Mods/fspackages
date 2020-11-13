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
        d.register("inputStack", d => new Input_Stack());
        d.register("planeConfig", d => new WT_Plane_Config());
        d.register("planeState", d => new WT_Plane_State());
        d.register("radioAltimeter", d => new WT_Radio_Altimeter(d.planeConfig));
        d.register("sound", d => new WT_Sound());
        d.register("softKeyController", d => navSystem.querySelector("g1000-soft-key-menu"));
        d.register("settings", d => {
            const settings = new WT_Settings("g36", WT_Default_Settings.base);
            navSystem.updatables.push(settings);
            return settings;
        });
        d.register("modSettings", d => {
            const settings = new WT_Settings("mod", WT_Default_Settings.modBase);
            navSystem.updatables.push(settings);
            Selectables_Input_Layer.SCROLL_DIRECTION = settings.getValue("navigation_knob")
            settings.addListener(value => Selectables_Input_Layer.SCROLL_DIRECTION = value, "navigation_knob");
            return settings;
        });
        d.register("unitChooser", d => new WT_Unit_Chooser(d.settings));
        d.register("flightPlanManager", d => navSystem.currFlightPlanManager);
        d.register("facilityLoader", d => navSystem.facilityLoader);
        d.register("waypointRepository", d => new WT_Waypoint_Repository(d.facilityLoader));
        d.register("nearestWaypoints", d => {
            const repository = new WT_Nearest_Waypoints_Repository(navSystem);
            navSystem.updatables.push(repository);
            return repository;
        });
        d.register("waypointQuickSelect", d => new WT_Waypoint_Quick_Select(navSystem, d.flightPlanManager));

        d.register("airportDatabase", d => new WT_Airport_Database());

        d.register("procedures", d => new Procedures(d.flightPlanManager));
        d.register("brightnessSettings", d => new WT_Brightness_Settings());
        d.register("barometricPressure", d => {
            const pressure = new WT_Barometric_Pressure();
            navSystem.updatables.push(pressure);
            return pressure;
        });
        d.register("minimums", d => {
            const minimums = new WT_Minimums(d.planeConfig);
            navSystem.updatables.push(minimums);
            return minimums;
        });

        d.register("directToModel", d => new WT_Direct_To_Model(navSystem, null, d.waypointRepository, d.directToHandler));
        d.register("flightPlanModel", d => new WT_Flight_Plan_Page_Model(d.flightPlanManager, d.procedures, null));

        d.register("approachPageView", d => new WT_Approach_Page_View());
        d.register("departurePageView", d => new WT_Departure_Page_View());
        d.register("arrivalPageView", d => new WT_Arrival_Page_View());
        d.register("procedureFacilityRepository", d => new WT_Procedure_Facility_Repository(d.facilityLoader));

        d.register("comFrequenciesModel", d => new WT_Com_Frequencies_Model());
        d.register("navFrequenciesModel", d => new WT_Nav_Frequencies_Model());
    }
}