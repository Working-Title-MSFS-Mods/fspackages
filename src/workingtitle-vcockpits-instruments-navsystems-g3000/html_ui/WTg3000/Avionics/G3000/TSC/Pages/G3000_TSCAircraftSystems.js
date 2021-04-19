class WT_G3000_TSCAircraftSystems extends WT_G3x5_TSCDirectoryPage {
    _createHTMLElement() {
        return new WT_G3000_TSCAircraftSystemsHTMLElement();
    }

    _getTitle() {
        return "Aircraft Systems";
    }

    _initLightingButton() {
        this.htmlElement.lightingButton.addButtonListener(this._openPage.bind(this, "Lighting Configuration"));
    }

    _doInitButtons() {
        this._initLightingButton();
    }
}

class WT_G3000_TSCAircraftSystemsHTMLElement extends WT_G3x5_TSCDirectoryPageHTMLElement {
    _getTemplate() {
        return WT_G3000_TSCAircraftSystemsHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_TSCImageButton}
     */
    get lightingButton() {
        return this._lightingButton;
    }

    async _defineButtons() {
        this._lightingButton = await WT_CustomElementSelector.select(this.shadowRoot, `#lighting`, WT_TSCImageButton);
    }
}
WT_G3000_TSCAircraftSystemsHTMLElement.NAME = "wt-tsc-aircraftsystems";
WT_G3000_TSCAircraftSystemsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_TSCAircraftSystemsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: repeat(3, var(--aircraftsystems-grid-row, 1fr));
            grid-template-columns: repeat(3, var(--aircraftsystems-grid-column, 1fr));
            grid-gap: var(--aircraftsystems-grid-gap-row, 0.5em) var(--aircraftsystems-grid-gap-column, 2em);
        }
            #lighting {
                grid-area: 2 / 2;
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-img id="lighting" class="button" labeltext="Lighting Config" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_AVIONICS_SETTINGS.png"></wt-tsc-button-img>
    </div>
`;

customElements.define(WT_G3000_TSCAircraftSystemsHTMLElement.NAME, WT_G3000_TSCAircraftSystemsHTMLElement);