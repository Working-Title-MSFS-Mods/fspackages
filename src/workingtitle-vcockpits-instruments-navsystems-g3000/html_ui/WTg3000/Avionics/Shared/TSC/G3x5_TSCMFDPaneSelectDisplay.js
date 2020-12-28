class WT_G3x5_TSCMFDPaneSelectDisplay extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCMFDPaneSelectDisplay.TEMPLATE.content.cloneNode(true));

        this._selectColor = "white";
        this._paneMode;
        this._selected = "";
    }

    static get observedAttributes() {
        return ["selectcolor"];
    }

    get selectColor() {
        return this._selectColor;
    }

    set selectColor(value) {
        this.setAttribute("selectcolor", value);
    }

    connectedCallback() {
        this._left = this.shadowRoot.querySelector(`#left`);
        this._right = this.shadowRoot.querySelector(`#right`);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "selectcolor") {
            this._selectColor = newValue;
            this._updateColors();
        }
    }

    _updateColors() {
        switch (this._selected) {
            case "LEFT":
                this._left.style.backgroundColor = this._selectColor;
                this._right.style.backgroundColor = "black";
                break;
            case "RIGHT":
                this._right.style.backgroundColor = this._selectColor;
                this._left.style.backgroundColor = "black";
                break;
            default:
                this._right.style.backgroundColor = "black";
                this._left.style.backgroundColor = "black";
        }
    }

    setPaneMode(value) {
        if (value === this._paneMode) {
            return;
        }

        switch (value) {
            case WT_G3x5_MFDMainPaneModeSetting.Mode.FULL:
                this._right.style.display = "none";
                break;
            case WT_G3x5_MFDMainPaneModeSetting.Mode.HALF:
                this._right.style.display = "block";
                break;
        }
        this._paneMode = value;
    }

    setSelected(value) {
        this._selected = value;
        this._updateColors();
    }
}
WT_G3x5_TSCMFDPaneSelectDisplay.TEMPLATE = document.createElement("template");
WT_G3x5_TSCMFDPaneSelectDisplay.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            color: black;
            font-weight: bold;
            font-size: 4vh;
            text-align: center;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: auto;
            grid-template-rows: 50% 50%;
            align-items: center;
        }
            #title {
                width: 100%;
            }
            #panes {
                width: 100%;
                height: 100%;
                display: flex;
                flex-flow: row nowrap;
                justify-content: center;
                align-items: center;
            }
                .pane {
                    margin: 0.25em;
                    background-color: black;
                    border: solid 1px black;
                    width: 0.75em;
                    height: 1em;
                }
    </style>
    <div id="wrapper">
        <div id="title">Pane</div>
        <div id="panes">
            <div class="pane" id="left"></div>
            <div class="pane" id="right"></div>
        </div>
    </div>
`;

customElements.define("tsc-mfdpaneselectdisplay", WT_G3x5_TSCMFDPaneSelectDisplay);