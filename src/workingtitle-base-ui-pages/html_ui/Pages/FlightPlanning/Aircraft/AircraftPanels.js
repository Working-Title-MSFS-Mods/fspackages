Include.addImport("/Templates/PanelInfoLine/PanelInfoLine.html");
Include.addScript("/JS/Services/Aircraft.js");
Include.addImport("/templates/searchElement/searchElement.html");
Include.addImport("/templates/OptionsMenu/Item/OptionsMenuItem.html");
Include.addImport("/templates/OptionsMenu/OptionsMenu.html");
Include.addImport("/Pages/World/PlaneSelection/PlaneSelection.html");
Include.addImport("/templates/FuelPayload/WM_FuelPayload.html");
Include.addImport("/Pages/World/AircraftFailures/WM_AircraftFailures.html");
class AircraftSelectionElement extends TemplateElement {
    constructor() {
        super(...arguments);
        this.inputChange = () => {
            clearTimeout(this.m_searchTimeout);
            this.m_searchTimeout = setTimeout(this.updateSearch, 300);
        };
        this.updateSearch = () => {
            Coherent.trigger("UPDATE_PLANE_SEARCH", this.m_searchElement.searchString);
        };
    }
    get templateID() { return "AircraftSelectionTemplate"; }
    ;
    connectedCallback() {
        super.connectedCallback();
        this.m_searchElement = this.querySelector("#searchAirplane");
        this.m_searchElement.addEventListener("onInputChange", this.inputChange);
        this.m_carrousel = this.querySelector("plane-carrousel");
        this.m_filter = this.querySelector("simple-filter-plane");
        if (this.hasAttribute('elements-per-page')) {
            this.m_carrousel.setAttribute('elements-per-page', this.getAttribute('elements-per-page'));
        }
        if (this.hasAttribute('virtual-element-size')) {
            this.m_carrousel.setAttribute('virtual-element-size', this.getAttribute('virtual-element-size'));
        }
    }
    Init() {
        this.m_searchElement.reset();
    }
    get canBeSelected() { return true; }
    setData(data) {
        this.m_data = data;
        if (data) {
            if (data.planes)
                this.m_searchElement.resultNumber = data.planes.length;
            else
                this.m_searchElement.resultNumber = 0;
            TemplateElement.call(this.m_filter, () => {
                this.m_filter.setData(data);
            });
            TemplateElement.call(this.m_carrousel, () => {
                this.m_carrousel.setData(data.planes, data.selectedIndex);
                this.m_carrousel.SetRangeFilters(data.rangeFilters);
            });
        }
    }
    updateData(data) {
        this.m_data = data;
        this.m_searchElement.resultNumber = data.planes.length;
        TemplateElement.call(this.m_filter, () => {
            this.m_filter.setData(data);
        });
        TemplateElement.call(this.m_carrousel, () => {
            this.m_carrousel.setData(data.planes, data.selectedIndex);
            this.m_carrousel.SetRangeFilters(data.rangeFilters);
        });
    }
    onVisibilityChange(visible) {
        if (visible) {
            this.setData(this.m_data);
            TemplateElement.call(this.m_carrousel, () => {
                this.m_carrousel.refreshSize();
            });
            TemplateElement.call(this.m_filter, () => {
                this.m_filter.onVisibilityChange(visible);
            });
        }
    }
    setSelectedPlane(plane, index) {
        this.m_carrousel.UpdateSelectedPlane(plane, index);
    }
}
window.customElements.define("aircraft-selection", AircraftSelectionElement);
class AircraftLiveriesElement extends TemplateElement {
    get templateID() { return "AircraftLiveriesTemplate"; }
    ;
    connectedCallback() {
        super.connectedCallback();
        this.m_carrousel = this.querySelector("plane-carrousel");
        if (this.hasAttribute('elements-per-page')) {
            this.m_carrousel.setAttribute('elements-per-page', this.getAttribute('elements-per-page'));
        }
        if (this.hasAttribute('virtual-element-size')) {
            this.m_carrousel.setAttribute('virtual-element-size', this.getAttribute('virtual-element-size'));
        }
        if (this.hasAttribute('component-tag')) {
            this.m_carrousel.setAttribute('component-tag', this.getAttribute('component-tag'));
        }
    }
    Init() {
    }
    onVisibilityChange(visible) {
        if (this.m_carrousel) {
            TemplateElement.call(this.m_carrousel, () => {
                this.m_carrousel.refreshSize();
            });
        }
    }
    setData(data) {
        this.m_carrousel.setData(data.variations, data.current.variation);
    }
    updateData(data) {
        this.m_carrousel.updateData(data.variations, data.current.variation);
    }
    setSelectedPlane(plane, index) {
        this.m_carrousel.UpdateSelectedPlane(plane, index);
    }
}
window.customElements.define("aircraft-liveries", AircraftLiveriesElement);
class AircraftATCOptionsElement extends TemplateElement {
    constructor() {
        super();
        this.onListenerRegistered = () => {
            this.m_gameFlightListener.requestGameFlight(this.onGameFlightUpdated);
        };
        this.onGameFlightUpdated = (flight) => {
            this.aircraftName = flight.aircraftData.name;
            this.m_tailNumber.value = this.getStored(flight.aircraftData, 'tailNumber');
            this.m_flightNumber.value = this.getStored(flight.aircraftData, 'flightNumber');
            this.m_callSign.value = this.getStored(flight.aircraftData, 'callSign');
            this.m_heavyCall.setCurrentValue(flight.aircraftData.appendHeavy ? 1 : 0);
            this.m_showTailNumber.setCurrentValue(flight.aircraftData.showTailNumber ? 1 : 0);
        };
        this.onTailNumberChange = () => {
            let value = this.m_tailNumber.inputValue;
            SetStoredData(`${this.aircraftName}.tailNumber`, value);
            this.m_gameFlightListener.setAircraftTailNumber(value);
        };
        this.onCallSignChange = () => {
            let value = this.m_callSign.inputValue;
            SetStoredData(`${this.aircraftName}.callSign`, value);
            this.m_gameFlightListener.setAircraftCallSign(value);
        };
        this.onFlightNumberChange = () => {
            let value = this.m_flightNumber.inputValue;
            SetStoredData(`${this.aircraftName}.flightNumber`, value);
            this.m_gameFlightListener.setAircraftFlightNumber(value);
        };
        this.onAppendHeavyChange = () => {
            let value = this.m_heavyCall.getCurrentValue();
            this.m_gameFlightListener.setAppendHeavyToCallSign(value == 1);
        };
        this.onShowTailNumberChange = () => {
            let value = this.m_showTailNumber.getCurrentValue();
            this.m_gameFlightListener.setShowTailNumber(value == 1);
        };
    }
    get templateID() { return "ATCOptionsTemplate"; }
    ;
    connectedCallback() {
        super.connectedCallback();
        this.m_tailNumber = this.querySelector(".WM_ATCOPTIONS_TAIL_NUMBER");
        this.m_tailNumber.addEventListener("OnValidate", this.onTailNumberChange);
        this.m_callSign = this.querySelector(".WM_ATCOPTIONS_CALL_SIGN");
        this.m_callSign.addEventListener("OnValidate", this.onCallSignChange);
        this.m_flightNumber = this.querySelector(".WM_ATCOPTIONS_FLIGHT_NUMBER");
        this.m_flightNumber.addEventListener("OnValidate", this.onFlightNumberChange);
        this.m_heavyCall = this.querySelector(".WM_ATCOPTIONS_HEAVY_CALL");
        this.m_heavyCall.addEventListener("OnValidate", this.onAppendHeavyChange);
        this.m_showTailNumber = this.querySelector(".WM_ATCOPTIONS_SHOW_TAIL_NUMBER");
        this.m_showTailNumber.addEventListener("OnValidate", this.onShowTailNumberChange);
        if (!this.m_gameFlightListener)
            this.m_gameFlightListener = RegisterGameFlightListener(this.onListenerRegistered);
        this.m_gameFlightListener.onGameFlightUpdated(this.onGameFlightUpdated);
    }
    getStored(aircraftData, field) {
        if (aircraftData[field] == "") {
            let tmp = GetStoredData(`${this.aircraftName}.${field}`);
            if (tmp != null && tmp != "") {
                switch (field) {
                    case 'tailNumber':
                        this.m_gameFlightListener.setAircraftTailNumber(tmp);
                        break;
                    case 'callSign':
                        this.m_gameFlightListener.setAircraftCallSign(tmp);
                        break;
                    case 'flightNumber':
                        this.m_gameFlightListener.setAircraftFlightNumber(tmp);
                        break;
                }
                return tmp;
            }
            return "";
        }
        return aircraftData[field];
    }
}
window.customElements.define("aircraft-atc", AircraftATCOptionsElement);
class AircraftSpecsElement extends TemplateElement {
    get templateID() { return "AircraftSpecsTemplate"; }
    ;
    connectedCallback() {
        super.connectedCallback();
        this.classList.add("scrollbar");
        this.virtualScroll = this.querySelector('virtual-scroll');
        TemplateElement.call(this.virtualScroll, () => {
            this.virtualScroll.sendSizeUpdate();
        });
    }
    setData(data) {
        if (!data.specs)
            return;
        this.querySelector(".Description .Content").innerHTML = data.description;
        let specs = this.querySelector(".Specs .Content");
        Utils.RemoveAllChildren(specs);
        for (let specCat of data.specs.children) {
            let specTree = specCat;
            let category = document.createElement("options-list-content");
            category.setAttribute("title", specCat.name);
            category.setAttribute("no-header", "");
            specs.appendChild(category);
            category.open();
            for (let spec of specTree.children) {
                let specElem = document.createElement("panel-info-line");
                specElem.classList.add('inList');
                specElem.setData(spec);
                category.content.appendChild(specElem);
            }
        }
        this.virtualScroll.sendSizeUpdate();
    }
    onVisibilityChange(visible) {
        if (visible) {
            console.log('set carrousel visible');
            this.virtualScroll.sendSizeUpdate();
            this.virtualScroll.focusByKeys(0);
            console.log('active el', document.activeElement);
        }
    }
}
window.customElements.define("aircraft-specs", AircraftSpecsElement);
class AircraftPanelsElement extends TemplateElement {
    constructor() {
        super();
        this.onSelectionChange = (e) => {
            if (this.isVisible()) {
                let linked = e.detail.linkedContent;
                this.updateInputBar(linked);
            }
        };
        this.m_selectingPlane = false;
        this.m_selectingVariation = false;
        this.setAircraftSelectionData = (data, recreate) => {
            if (recreate) {
                this.m_AircraftSelection.setData(data);
            }
            else {
                this.m_AircraftSelection.updateData(data);
            }
            this.m_VariationSelection.setData(data);
            if (this.m_selectingPlane) {
                this.m_AircraftSelection.selectDefaultButton();
                this.m_selectingPlane = false;
            }
            if (this.m_selectingVariation) {
                this.m_VariationSelection.selectDefaultButton();
                this.m_selectingVariation = false;
            }
        };
        this.onAircraftSelected = (e) => {
            this.m_selectingPlane = true;
            let selData = e.detail;
            this.m_aircraftSelectListener.setSelectedPlane(selData.aircraftId, selData.variation, selData.autoValidate);
        };
        this.onVariationSelected = (e) => {
            let selData = e.detail;
            this.m_selectingVariation = true;
            this.m_aircraftSelectListener.setSelectedPlane(selData.aircraftId, selData.variation, selData.autoValidate);
        };
        this.updateSelectedPlane = (plane, index) => {
            if (this.isConnected) {
                this.m_AircraftSelection.setSelectedPlane(plane, index);
            }
        };
        this.updateSelectedPlaneVariation = (plane, index) => {
            if (this.isConnected) {
                this.m_VariationSelection.setSelectedPlane(plane, plane.variation);
            }
        };
        this.close = () => {
            if (this.m_aircraftSelectListener) {
                this.m_aircraftSelectListener.unregister();
                this.m_aircraftSelectListener = null;
            }
            if (this.querySelector("fuel-payload"))
                this.querySelector("fuel-payload").UnInit();
            if (this.querySelector("aircraft-failures"))
                this.querySelector("aircraft-failures").UnInit();
            if (this.isVisible()) {
                this.setVisible(false);
                this.dispatchEvent(new Event("closed"));
                InputBar.clearInputBar("WorldMap_Aircraft");
                InputBar.clearInputBar("WorldMap_Aircraft_SubPanel");
            }
        };
    }
    get templateID() { return "AircraftPanelsTemplate"; }
    ;
    connectedCallback() {
        super.connectedCallback();
        Coherent.on("CLOSE_AIRCRAFT_PANEL", this.close);
        this.m_optionMenu = this.querySelector("#AircraftPanels_Menu");
        this.m_optionMenu.addEventListener("OptionsMenuItemChange", this.onSelectionChange);
        this.m_AircraftSelection = this.querySelector("#AircraftPanels_Select");
        this.m_AircraftSelection.addEventListener("onAircraftSelected", this.onAircraftSelected);
        this.m_VariationSelection = this.querySelector("#AircraftPanels_Liveries");
        this.m_VariationSelection.addEventListener("onAircraftSelected", this.onVariationSelected);
        this.addEventListener("OnPlaneFilterChange", this.onPlaneFilterChange);
        this.m_globalFeaturesListener = RegisterGameFeaturesListener();
    }
    disconnectedCallback() {
        this.close();
        this.m_optionMenu = null;
        this.m_aircraftSelectListener = null;
        this.m_globalFeaturesListener = null;
        this.m_AircraftSelection = null;
        this.m_VariationSelection = null;
        super.disconnectedCallback();
        Coherent.off("CLOSE_AIRCRAFT_PANEL", this.close);
    }
    onPlaneFilterChange(e) {
        let rangerFilter = e.target;
        this.m_aircraftSelectListener.updatePlaneRangeFilter(rangerFilter.currentValue, rangerFilter.filterId);
    }
    toggle() {
        if (!this.isVisible()) {
            this.open();
        }
        else {
            this.close();
        }
    }
    open() {
        this.setVisible(true);
        this.m_aircraftSelectListener = RegisterAircraftListener();
        this.m_aircraftSelectListener.onAircraftListUpdated(this.setAircraftSelectionData);
        this.m_aircraftSelectListener.onSelectedPlaneUpdated(this.updateSelectedPlane);
        this.m_aircraftSelectListener.onSelectedPlaneVariationUpdated(this.updateSelectedPlaneVariation);
        this.querySelector("fuel-payload").Init();
        this.m_AircraftSelection.Init();
        this.querySelector("aircraft-failures").Init();
        this.dispatchEvent(new Event("opened"));
        let inputBarParams = new InputBar.InputBarParams();
        inputBarParams.buttons.push(new InputBar.InputBarButtonParams("BTN_BACK", "TT:MENU.CLOSE", InputBar.MENU_BUTTON_BACK, "CLOSE_AIRCRAFT_PANEL"));
        InputBar.setInputBar("WorldMap_Aircraft", inputBarParams);
        this.updateInputBar(this.m_optionMenu.currentLinkedElement);
        let AircraftFailuresButton = this.querySelector("#AircraftFailures");
        let failuresAvailable = this.m_globalFeaturesListener.isFeatureSupported("AIRCRAFT_FAILURES");
        AircraftFailuresButton.disabled = !failuresAvailable;
        this.m_optionMenu.focusByKeys();
        this.querySelector('.active').onVisibilityChange(true);
    }
    updateInputBar(selected) {
        InputBar.clearInputBar("WorldMap_Aircraft_SubPanel");
        let inputBarParams = new InputBar.InputBarParams();
        if (selected) {
            if (InputBar.isContainer(selected)) {
                let buttons = selected.getButtons();
                inputBarParams.buttons = buttons;
            }
        }
        InputBar.addInputBar("WorldMap_Aircraft_SubPanel", "", inputBarParams);
    }
}
window.customElements.define("aircraft-panels", AircraftPanelsElement);
checkAutoload();
//# sourceMappingURL=AircraftPanels.js.map