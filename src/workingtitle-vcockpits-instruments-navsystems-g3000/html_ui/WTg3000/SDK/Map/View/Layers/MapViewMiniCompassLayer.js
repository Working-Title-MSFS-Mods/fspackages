/**
 * A compass arrow pointing to true north.
 */
class WT_MapViewMiniCompassLayer extends WT_MapViewLayer {
    /**
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(className = WT_MapViewMiniCompassLayer.CLASS_DEFAULT, configName = WT_MapViewMiniCompassLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);
    }

    _createHTMLElement() {
        return this._miniCompass = new WT_MapViewMiniCompass();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        this._miniCompass.iconSrc = this.config.iconPath;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._miniCompass.update(state);
    }
}
WT_MapViewMiniCompassLayer.CLASS_DEFAULT = "miniCompassLayer";
WT_MapViewMiniCompassLayer.CONFIG_NAME_DEFAULT = "miniCompass";
WT_MapViewMiniCompassLayer.ICON_IMAGE_CLASS = "miniCompassIcon";
WT_MapViewMiniCompassLayer.TEXT_CLASS = "miniCompassText";

class WT_MapViewMiniCompass extends HTMLElement {
    constructor() {
        super();

        let template = document.createElement("template");
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    overflow: hidden;
                    height: 5vh;
                    width: 5vh;
                    text-align: center;
                    font-weight: bold;
                    font-size: 1.75vh;
                    color: black;
                }
                #icon {
                    height: 100%;
                    width: 100%;
                    z-index: 1;
                }
                #text {
                    position: absolute;
                    top: 50%;
                    width: 100%;
                    transform: translateY(-50%);
                    z-index: 2;
                }
            </style>
            <img id="icon"></img>
            <div id="text">N</div>
        `;
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._iconSrc = undefined;
    }

    get iconSrc() {
        return this._iconSrc;
    }

    set iconSrc(src) {
        this._iconSrc = src;
        if (this._icon) {
            this._icon.src = src;
        }
    }

    connectedCallback() {
        this._icon = this.shadowRoot.querySelector(`#icon`);
        if (this.iconSrc !== undefined) {
            this._icon.src = this.iconSrc;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "icon-src") {
            this.iconSrc = newValue;
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        this._icon.style.transform = `rotate(${state.projection.rotation}deg)`;
    }
}

customElements.define("map-view-minicompass", WT_MapViewMiniCompass);