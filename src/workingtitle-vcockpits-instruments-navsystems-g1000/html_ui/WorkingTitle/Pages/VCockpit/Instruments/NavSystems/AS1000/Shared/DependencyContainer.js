class WT_Dependency_Missing_Error extends Error {

};

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
        this._proxy = new Proxy(this, handler);
    }
    _get(name, useCache = true) {
        const dependency = this._dependencies[name];
        if (!dependency)
            throw new WT_Dependency_Missing_Error(`Factory not found for "${name}"`);

        if (this._values[name] && useCache) {
            return this._values[name];
        }

        const instance = dependency.factory(this._proxy);
        if (dependency.scope == "singleton") {
            this._values[name] = instance;
        }

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
            get: function (target, prop, receiver) {
                return target._get(prop);
            }
        };
        return new Proxy(this, handler);
    }
}