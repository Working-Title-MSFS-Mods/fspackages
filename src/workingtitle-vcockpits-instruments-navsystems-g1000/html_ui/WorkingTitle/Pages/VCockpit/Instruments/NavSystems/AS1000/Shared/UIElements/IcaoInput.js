class WT_Icao_Input_Input_Layer extends Input_Layer {
    constructor(input) {
        super();
        this.input = input;
    }
    onLargeInc(inputStack) {
        this.input.selectNextCharacter();
    }
    onLargeDec(inputStack) {
        this.input.selectPreviousCharacter();
    }
    onSmallInc(inputStack) {
        this.input.incrementCharacter(1);
    }
    onSmallDec(inputStack) {
        this.input.incrementCharacter(-1);
    }
    onNavigationPush(inputStack) {
        this.input.cancel();
    }
    onCLR(inputStack) {
        this.input.cancel();
    }
    onEnter(inputStack) {
        this.input.confirm();
    }
}

class WT_Icao_Input extends HTMLElement {
    constructor() {
        super();
        this._ident = null;
        this._icao = null;
        this.type = null;
        this.elements = {
            characters: []
        };
        this.active = false;
        this.editingPosition = null;

        this.addEventListener("selected", this.enter.bind(this));
        this.addEventListener("decrement", e => {
            this.showQuickSelect(e.detail.inputStack).then((icao) => {
                this.icao = icao;
                this.confirm(false);
            });
        });

        this.quickSelect = document.createElement("waypoint-quick-select");
        this.appendChild(this.quickSelect);
    }
    set ident(value) {
        if (this._ident !== value) {
            this._ident = value;
            this.updateDisplay();
        }
    }
    get ident() {
        return this._ident;
    }
    set icao(icao) {
        this._icao = icao;
        if (this._icao) {
            this.ident = icao.substring(7, 12);
            this.updateDisplay();
        }
    }
    get icao() {
        return this._icao;
    }
    get instrumentIdentifier() {
        return "icao-search-knighty"; //TODO: Need a team scheme for this maybe
    }
    get value() {
        return this.icao;
    }
    setEditingSimVars() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchInitialIcao", "string", this.icao, this.instrumentIdentifier);
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", this.type, this.instrumentIdentifier);
    }
    /**
     * @param {WT_Waypoint_Quick_Select} waypointQuickSelect 
     */
    setQuickSelect(waypointQuickSelect) {
        this.waypointQuickSelect = waypointQuickSelect;
        this.quickSelect.setWaypointQuickSelect(waypointQuickSelect, this.type);
    }
    showQuickSelect(inputStack) {
        return this.quickSelect.enter(inputStack);
    }
    updateDisplay() {
        let value = this._ident ? this._ident : "";
        for (let i = 0; i < value.length && i < this.elements.characters.length; i++) {
            this.elements.characters[i].textContent = value[i] == " " ? "_" : value[i];
        }
        for (let i = value.length; i < this.elements.characters.length; i++) {
            this.elements.characters[i].textContent = "_";
        }
    }
    selectEditingPosition(character) {
        if (this.editingPosition !== null) {
            this.elements.characters[this.editingPosition].removeAttribute("state");
        }
        this.editingPosition = character;
        if (this.editingPosition !== null) {
            this.elements.characters[this.editingPosition].setAttribute("state", "Selected");
        }
    }
    updateFromSimVars() {
        let icao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.instrumentIdentifier);

        if (this._icao != icao) {
            this._icao = icao;
            let evt = document.createEvent("HTMLEvents");
            evt.initEvent("input", true, true);
            this.dispatchEvent(evt);
        }

        this.ident = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.instrumentIdentifier);
        this.selectEditingPosition(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCursorPosition", "number", this.instrumentIdentifier));
    }
    connectedCallback() {
        if (this.hasInitialised)
            return;
        this.hasInitialised = true;

        for (let i = 0; i < this.getAttribute("characters"); i++) {
            let character = document.createElement("span");
            character.className = "character";
            this.elements.characters.push(character);
            this.appendChild(character);
        }
        this.icao = this.getAttribute("value");
        this.type = this.hasAttribute("type") ? this.getAttribute("type") : "AWNV";
        this.updateDisplay();
    }
    disconnectedCallback() {
        if (this.cancelDuplicates) {
            this.cancelDuplicates();
            this.cancelDuplicates = null;
        }
    }
    back() {
        this.exit();
    }
    enter(e) {
        let inputStack = e.detail.inputStack;
        let inputLayer = new WT_Icao_Input_Input_Layer(this);
        this.inputStackManipulator = inputStack.push(inputLayer);

        this.setEditingSimVars();

        let cb = () => {
            if (this.active) {
                this.updateFromSimVars();
                requestAnimationFrame(cb);
            }
        }
        this.active = true;
        requestAnimationFrame(cb);

        this.updateDisplay();
    }
    async confirm(checkDupes = true) {
        let batch = new SimVar.SimVarBatch("C:fs9gps:IcaoSearchMatchedIcaosNumber", "C:fs9gps:IcaoSearchMatchedIcao");
        batch.add("C:fs9gps:IcaoSearchCurrentIcaoType", "string", "string");
        batch.add("C:fs9gps:IcaoSearchCurrentIcao", "string", "string");
        batch.add("C:fs9gps:IcaoSearchCurrentIdent", "string", "string");
        let numberOfDuplicates = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.instrumentIdentifier);
        if (numberOfDuplicates > 1 && checkDupes) {
            let duplicates = await new Promise(resolve => {
                SimVar.GetSimVarArrayValues(batch, (_Values) => {
                    let duplicates = [];
                    for (var i = 0; i < _Values.length; i++) {
                        duplicates.push(_Values[i][1]);
                    }
                    SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", 0, this.instrumentIdentifier);
                    resolve(duplicates);
                }, this.instrumentIdentifier);
            });
            console.log(JSON.stringify(duplicates));
            try {
                let t = this.waypointQuickSelect.gps.showDuplicates(duplicates);
                this.cancelDuplicates = t.cancel;
                let icao = await t.promise;
                this.cancelDuplicates = null;
                this.icao = icao;
            } catch (e) {
                console.log("Cancelled duplicate selection");
                return;
            }
        }
        if (this.waypointQuickSelect) {
            this.waypointQuickSelect.addRecentWaypoint(this.icao);
        }
        this.active = false;

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);
        this.exit();
    }
    cancel() {
        //TODO: Reset to old value on cancel
        this.exit();
    }
    exit() {
        this.active = false;
        this.selectEditingPosition(null);

        if (this.inputStackManipulator) {
            this.inputStackManipulator.pop();
            this.inputStackManipulator = null;
        }
    }
    selectNextCharacter() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCursor", "number", 1, this.instrumentIdentifier);
    }
    selectPreviousCharacter() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCursor", "number", -1, this.instrumentIdentifier);
    }
    incrementCharacter(amount) {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCharacter", "number", amount, this.instrumentIdentifier);
    }
}
customElements.define("icao-input", WT_Icao_Input);

class WT_Waypoint_Quick_Select_Input_Layer extends Selectables_Input_Layer {
    constructor(quickSelect) {
        super(new Selectables_Input_Layer_Dynamic_Source(quickSelect));
        this.quickSelect = quickSelect;
    }
    onCLR(inputStack) {
        this.quickSelect.exit();
    }
}

class WT_Waypoint_Quick_Select_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new WT_Waypoint_Quick_Select_Input_Layer(this);
        DOMUtilities.AddScopedEventListener(this, "li", "selected", (e, node) => {
            this.selectWaypoint(node.dataset.icao);
        });
        this.addEventListener("selected", e => {
            e.stopPropagation();
        });
        this.addEventListener("change", e => {
            e.stopPropagation();
        });
        this.addEventListener("input", e => {
            e.stopPropagation();
        });
        this.currentList = null;
    }
    connectedCallback() {
        if (this.hasInitialised)
            return;
        this.hasInitialised = true;

        const template = document.getElementById('waypoint-quick-select');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.removeChild(this.elements.nrst);
        this.removeChild(this.elements.fpl);
        this.removeChild(this.elements.recent);
        this.chooseList("NRST");
    }
    /**
     * @param {WT_Waypoint_Quick_Select} waypointQuickSelect 
     */
    async setWaypointQuickSelect(waypointQuickSelect, type) {
        const waypoints = await waypointQuickSelect.getWaypoints(type);
        const mapWaypoint = waypoint => `<li class="selectable" data-icao="${waypoint.icao}">${waypoint.ident}</li>`;
        this.elements.nrst.innerHTML = waypoints.nearest.map(mapWaypoint).join("");
        this.elements.fpl.innerHTML = waypoints.flightPlan.map(mapWaypoint).join("");
        this.elements.recent.innerHTML = waypoints.recent.map(mapWaypoint).join("");
    }
    chooseList(list) {
        if (this.currentList)
            this.removeChild(this.currentList);
        switch (list) {
            case "NRST":
                this.appendChild(this.elements.nrst);
                this.currentList = this.elements.nrst;
                break;
            case "FPL":
                this.appendChild(this.elements.fpl);
                this.currentList = this.elements.fpl;
                break;
            case "RECENT":
                this.appendChild(this.elements.recent);
                this.currentList = this.elements.recent;
                break;
        }
    }
    selectWaypoint(icao) {
        this.resolve(icao);
        this.exit();
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
        this.inputHandle.onPopped.subscribe(() => {
            this.reject();
            this.removeAttribute("state");
        });
        this.setAttribute("state", "visible");
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
}
customElements.define("waypoint-quick-select", WT_Waypoint_Quick_Select_View);