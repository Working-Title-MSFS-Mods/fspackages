class WT_TitledPane extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_TitledPane.TEMPLATE.content.cloneNode(true));

        this._titleText = "";
    }

    static get observedAttributes() {
        return ["titletext"];
    }

    get titleText() {
        return this._title.innerHTML;
    }

    set titleText(value) {
        this.setAttribute("titletext", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "titletext") {
            this._setTitleText(newValue);
        }
    }

    connectedCallback() {
        this._title = this.shadowRoot.querySelector(`#title`);
        this._title.innerHTML = this._titleText;
    }

    _setTitleText(value) {
        this._titleText = value;
        if (this._title) {
            this._title.innerHTML = value;
        }
    }
}
WT_TitledPane.TEMPLATE = document.createElement("template");
WT_TitledPane.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            background-color: black;
        }

        #container {
            position: absolute;
            width: 100%;
            height: 100%;
        }
            #inner {
                position: absolute;
                left: var(--pane-border-width, 0.5vh);
                top: calc(var(--pane-border-width, 0.5vh) * 0.5);
                right: var(--pane-border-width, 0.5vh);
                bottom: var(--pane-border-width, 0.5vh);
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: calc(var(--pane-title-font-size, 1.5vh) * 1.3 + var(--pane-border-width, 0.5vh) + var(--pane-title-border-width, 1px) * 2) auto;
            }
                #titlebox {
                    display: block;
                    position: relative;
                    margin: var(--pane-title-border-width, 1px);
                    border: var(--pane-title-border-width, 1px) solid var(--pane-title-border-color, white);
                }
                    #title {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: auto;
                        height: auto;
                        color: var(--pane-title-color, white);
                        text-align: center;
                        font-size: var(--pane-title-font-size, 1.75vh);
                        background-color: var(--pane-title-bg-color, black);
                        padding: 0.05em 0.1em;
                    }
                #content {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }

    </style>
    <div id="container">
        <div id="inner">
            <div id="titlebox">
                <div id="title"></div>
            </div>
            <slot id="content" name="content"></slot>
        </div>
    </div>
`;

customElements.define("pane-titled", WT_TitledPane);