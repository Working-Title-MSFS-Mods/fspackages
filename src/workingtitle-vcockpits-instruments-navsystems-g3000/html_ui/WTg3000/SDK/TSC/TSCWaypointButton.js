class WT_TSCWaypointButton extends WT_TSCButton {
    constructor() {
        super();

        this._waypoint = null;
        this._isInit = false;
    }

    _initIdentStyle() {
        return `
            #ident {
                position: absolute;
                left: 2%;
                top: 5%;
                font-size: var(--waypoint-ident-font-size, 1.67em);
                text-align: left;
                color: var(--waypoint-ident-color, #67e8ef);
            }
        `;
    }

    _initNameStyle() {
        return `
            #name {
                position: absolute;
                left: 2%;
                width: 90%;
                bottom: 5%;
                font-size: var(--waypoint-name-font-size, 1em);
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                color: var(--waypoint-name-color, white);
            }
        `;
    }

    _initIconStyle() {
        return `
            #icon {
                position: absolute;
                right: 5%;
                top: 5%
                height: 33%;
                max-width: 15%;
            }
        `;
    }

    _initEmptyStyle() {
        return `
            #empty {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();

        let identStyle = this._initIdentStyle();
        let nameStyle = this._initNameStyle();
        let iconStyle = this._initIconStyle();
        let emptyStyle = this._initEmptyStyle();

        return`
            ${style}
            ${identStyle}
            ${nameStyle}
            ${iconStyle}
            ${emptyStyle}
        `;
    }

    _appendChildren() {
        this._ident = document.createElement("div");
        this._ident.id = "ident";
        this._name = document.createElement("div");
        this._name.id = "name";

        this._empty = document.createElement("div");
        this._empty.id = "empty";

        this._wrapper.appendChild(this._ident);
        this._wrapper.appendChild(this._name);
        this._wrapper.appendChild(this._empty);
    }

    static get observedAttributes() {
        return [...WT_TSCButton.observedAttributes, "emptytext"];
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    get emptyText() {
        return this.getAttribute("emptytext");
    }

    set emptyText(value) {
        this.setAttribute("emptytext", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "emptytext") {
            this._empty.innerHTML = newValue;
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }

    connectedCallback() {
        super.connectedCallback();

        this._updateWaypoint();
        this._isInit = true;
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _showWaypointInfo(waypoint) {
        this._empty.style.display = "none";

        this._ident.innerHTML = waypoint.ident;
        this._name.innerHTML = waypoint.name;

        this._ident.style.display = "block";
        this._name.style.display = "block";
    }

    _showEmptyText() {
        this._ident.style.display = "none";
        this._name.style.display = "none";
        this._empty.style.display = "block";
    }

    _updateWaypoint() {
        if (this.waypoint) {
            this._showWaypointInfo(this.waypoint);
        } else {
            this._showEmptyText();
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setWaypoint(waypoint) {
        if (!waypoint && !this.waypoint || (waypoint && this.waypoint && waypoint.uniqueID === this.waypoint.uniqueID)) {
            return;
        }

        this._waypoint = waypoint;
        if (this._isInit) {
            this._updateWaypoint();
        }
    }
}

customElements.define("tsc-button-waypoint", WT_TSCWaypointButton);