class WT_Airspeed_Reference {
    constructor(id, name, defaultSpeed) {
        defaultSpeed = parseInt(defaultSpeed);
        this.id = id;
        this.name = name;
        this._speed = WTDataStore.get(`VSRef.${id}.DisplayedSpeed`, defaultSpeed);
        this.defaultSpeed = defaultSpeed;
        this._enabled = WTDataStore.get(`VSRef.${id}.IsDisplayed`, false);
    }
    isDefault(speed) {
        return speed == this.defaultSpeed;
    }
    get enabled() {
        return this._enabled;
    }
    set enabled(e) {
        this._enabled = e;
        WTDataStore.set(`VSRef.${this.id}.IsDisplayed`, this._enabled)
    }
    get speed() {
        return this._speed;
    }
    set speed(s) {
        this._speed = s;
        WTDataStore.set(`VSRef.${this.id}.DisplayedSpeed`, this._speed)
    }
}

class WT_Airspeed_References {
    constructor() {
        this.references = new Subject(this.getDefaultReferences(), false);
    }
    getDefaultReferences() {
        const references = [];
        const designSpeeds = Simplane.getDesignSpeeds();
        references.push(new WT_Airspeed_Reference("G", "Glide", designSpeeds.BestGlide));
        references.push(new WT_Airspeed_Reference("R", "Vr", designSpeeds.Vr));
        references.push(new WT_Airspeed_Reference("X", "Vx", designSpeeds.Vx));
        references.push(new WT_Airspeed_Reference("Y", "Vy", designSpeeds.Vy));
        return references;
    }
    getReference(id) {
        const reference = this.references.value.find(r => r.id == id);
        if (reference) {
            return reference;
        }
        throw new Error(`Reference "${id}" doesn't exist`);
    }
    updateReferences() {
        this.references.value = this.references.value;
    }
    updateSpeed(id, speed) {
        this.getReference(id).speed = speed;
        this.updateReferences();
    }
    updateEnabled(id, enabled) {
        this.getReference(id).enabled = enabled;
        this.updateReferences();
    }
}

class WT_Airspeed_References_Model extends WT_Model {
    /**
     * @param {WT_Settings} settings 
     * @param {WT_Airspeed_References} airspeedReferences 
     */
    constructor(settings, airspeedReferences) {
        super();
        this.airspeedReferences = airspeedReferences;
        this.units = new Subject("KTS");
    }
    updateSpeed(id, speed) {
        this.airspeedReferences.updateSpeed(id, speed);
    }
    updateEnabled(id, enabled) {
        this.airspeedReferences.updateEnabled(id, enabled);
    }
}

class WT_Airspeed_References_View extends WT_HTML_View {
    constructor() {
        super();
        DOMUtilities.AddScopedEventListener(this, "numeric-input", "changed", node => {
            this.model.updateSpeed(node.parentNode.dataset.id, node.value);
        });
    }
    /**
     * @param {WT_Airspeed_References_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.units = "KTS";
        this.model.units.subscribe(units => {
            this.units = units;
        });
        this.model.airspeedReferences.references.subscribe(references => {
            this.setReferences(references);
        });
    }
    setReferences(references) {
        let elements = [];
        for (let reference of references) {
            let element = this.elements.references.querySelector(`[data-id="${reference.id}"]`);
            if (!element) {
                element = document.createElement("li");
                element.dataset.id = reference.id;
                element.innerHTML = `
                    <label>${reference.name}</label>
                    <numeric-input data-change="setSpeed" value="${reference.speed}" min="0" max="999" units="${this.units}"></numeric-input>
                    <span class="non-standard"></span>
                    <toggle-switch data-change="setEnabled" value="1"></toggle-switch>
                `;
                element.querySelector("numeric-input").addEventListener("input", e => {
                    element.querySelector(".non-standard").textContent = reference.isDefault(e.target.value) ? "" : "*";
                });
            }
            elements.push(element);
        }
        this.elements.references.innerHTML = "";
        for (let element of elements) {
            this.elements.references.appendChild(element);
        }
    }
    setSpeed(speed, node) {
        this.model.updateSpeed(node.parentNode.dataset.id, speed);
    }
    setEnabled(enabled, node) {
        this.model.updateEnabled(node.parentNode.dataset.id, enabled == "On");
    }
}
customElements.define("g1000-pfd-airspeed-references", WT_Airspeed_References_View);