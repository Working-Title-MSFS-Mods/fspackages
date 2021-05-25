class WT_G3x5_TSCUtilitiesSetup extends WT_G3x5_TSCDirectoryPage {
    _createHTMLElement() {
        return new WT_G3x5_TSCUtilitiesSetupHTMLElement();
    }

    _getTitle() {
        return "Setup";
    }

    _initAvionicsSettingsButton() {
        this.htmlElement.avionicsSettingsButton.addButtonListener(this._openPage.bind(this, "Avionics Settings"));
    }

    _initDatabaseStatusButton() {
        this.htmlElement.databaseStatusButton.addButtonListener(this._openPage.bind(this, "Database Status"));
    }

    _doInitButtons() {
        this._initAvionicsSettingsButton();
        this._initDatabaseStatusButton();
    }
}

class WT_G3x5_TSCUtilitiesSetupHTMLElement extends WT_G3x5_TSCDirectoryPageHTMLElement {
    _getTemplate() {
        return WT_G3x5_TSCUtilitiesSetupHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_TSCImageButton}
     */
    get avionicsSettingsButton() {
        return this._avionicsSettingsButton;
    }

    /**
     * @readonly
     * @type {WT_TSCImageButton}
     */
    get databaseStatusButton() {
        return this._databaseStatusButton;
    }

    async _defineButtons() {
        [
            this._avionicsSettingsButton,
            this._databaseStatusButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#avionicssettings`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#databasestatus`, WT_TSCImageButton)
        ]);
    }
}
WT_G3x5_TSCUtilitiesSetupHTMLElement.NAME = "wt-tsc-utilitiessetup";
WT_G3x5_TSCUtilitiesSetupHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCUtilitiesSetupHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: repeat(3, 1fr);
            grid-template-columns: repeat(3, 1fr);
            grid-gap: var(--utilitiessetup-grid-gap-row, 2em) var(--utilitiessetup-grid-gap-column, 2em);
        }
            #avionicssettings {
                grid-area: 1 / 1;
            }
            #databasestatus {
                grid-area: 3 / 1;
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-img id="avionicssettings" class="button" labeltext="Avionics Settings" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_AVIONICS_SETTINGS.png"></wt-tsc-button-img>
        <wt-tsc-button-img id="databasestatus" class="button" labeltext="Database Status" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_DATABASE_STATUS.png"></wt-tsc-button-img>
    </div>
`;

customElements.define(WT_G3x5_TSCUtilitiesSetupHTMLElement.NAME, WT_G3x5_TSCUtilitiesSetupHTMLElement);