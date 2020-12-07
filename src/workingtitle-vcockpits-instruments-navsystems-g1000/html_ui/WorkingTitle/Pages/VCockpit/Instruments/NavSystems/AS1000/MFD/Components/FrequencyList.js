class WT_Frequency_List_Model {
    /**
     * @param {WT_Com_Frequencies_Model} comFrequencies 
     * @param {WT_Nav_Frequencies_Model} navFrequencies 
     */
    constructor(comFrequencies, navFrequencies) {
        this.comFrequencies = comFrequencies;
        this.navFrequencies = navFrequencies;
        this.frequencies = new Subject([]);
    }
    setFrequencies(frequencies) {
        this.frequencies.value = frequencies;
    }
    selectFrequency(mhz, bcd) {
        console.log(bcd);
        if (mhz >= 118) {
            this.comFrequencies.selectFrequency(bcd);
        } else {
            this.navFrequencies.selectFrequency(bcd);
        }
    }
}

class WT_Frequency_List_Input_Layer extends Selectables_Input_Layer {
    /**
     * @param {WT_Frequency_List_Model} model 
     * @param {WT_Frequency_List_View} view 
     */
    constructor(model, view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view));
        this.model = model;
        this.view = view;
    }
}

class WT_Frequency_List_View extends WT_HTML_View {
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        super.connectedCallback();
        DOMUtilities.AddScopedEventListener(this, ".value", "selected", e => {
            this.model.selectFrequency(parseFloat(e.target.dataset.mhz), parseInt(e.target.dataset.bcd));
        });
    }
    /**
     * @param {WT_Frequency_List_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.frequencies.subscribe(frequencies => {
            let elems = [];
            for (let frequency of frequencies) {
                elems.push(`<li class="element"><span class="name">${frequency.name}</span><span class="value selectable" data-mhz="${frequency.mhValue}" data-bcd="${frequency.bcd16Value}">${frequency.mhValue.toFixed(3)}</span></li>`);
            }
            this.innerHTML = elems.join("");
        });
        this.inputLayer = new WT_Frequency_List_Input_Layer(model, this);
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
    }
}
customElements.define("g1000-frequency-list", WT_Frequency_List_View);