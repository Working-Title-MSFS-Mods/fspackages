/**
 * A text box which displays the current map orientation. The use of this layer requires the .orientation module to be added to
 * the map model.
 */
class WT_MapViewOrientationDisplayLayer extends WT_MapViewLayer {
    constructor(displayTexts, className = WT_MapViewOrientationDisplayLayer.CLASS_DEFAULT, configName = WT_MapViewOrientationDisplayLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._displayTexts = displayTexts;
    }

    _createHTMLElement() {
        this._displayBox = new WT_MapViewOrientationDisplay();
        return this._displayBox;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._displayBox.update(state, this._displayTexts);
    }
}
WT_MapViewOrientationDisplayLayer.CLASS_DEFAULT = "orientationDisplayLayer";
WT_MapViewOrientationDisplayLayer.CONFIG_NAME_DEFAULT = "orientation";

class WT_MapViewOrientationDisplay extends HTMLElement {
    constructor() {
        super();

        let template = document.createElement("template");
        template.innerHTML = `
            <style>
                :host {
                    background-color: black;
                    border: solid 1px white;
                    border-radius: 3px;
                    text-align: center;
                    font-weight: bold;
                    font-size: 1.75vh;
                    line-height: 2vh;
                    color: white;
                }
                #text {
                    margin: 0 0.5vh;
                }
            </style>
            <div id="text"></div>
        `;
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this._text = new WT_CachedElement(this.shadowRoot.querySelector(`#text`));
    }

    /**
     * @param {WT_MapViewState} state
     * @param {String[]} texts
     */
    update(state, texts) {
        this._text.innerHTML = texts[state.model.orientation.mode];
    }
}

customElements.define("map-view-orientationdisplay", WT_MapViewOrientationDisplay);