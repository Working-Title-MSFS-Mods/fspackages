class WT_Credits_Model extends WT_Model {
    constructor() {
        super();

        this.credits = new Subject();
        this.initCredits();
    }
    getCredits() {
        return [
            {
                name: "Rob",
                role: "Project Lead"
            },
            {
                name: "knighty",
                role: "Architecture and visual design"
            },
            {
                name: "Chris",
                role: "Programming"
            },
            {
                name: "aznricepuff",
                role: "Map programming"
            }
        ];
    }
    initCredits() {
        this.credits.value = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:5vh; margin:0 2vh;">
            <article class="article">
                <img src="/WorkingTitle/Pages/VCockpit/Instruments/NavSystems/AS1000/MFD/Pages/Auxilliary/Garmin.svg" style="width:100%;"/>
                <h1>Working Title</h1>
                <p>Thank you for using Working Title's G1000 mod! We hope you enjoy your time with it as much as we enjoyed making it.</p>
                <p><g1000-external-link href="https://github.com/Working-Title-MSFS-Mods/fspackages">github.com/Working-Title-MSFS-Mods/fspackages</g1000-external-link></p>
                <ul>
                    <li><b>Version:</b> 0.3</li>
                    <li><b>Released:</b> 1st October 2020</li>
                </ul>
                <p>Don't forget to check out our other projects, a massive update to the Cessna Citation CJ4 and the G3000 on our Github!</p>
                <p>
                    <g1000-external-link href="https://discord.gg/Fa6w2xK">Discord Server</g1000-external-link>
                    • <g1000-external-link href="https://github.com/Working-Title-MSFS-Mods/fspackages/releases">Latest Releases</g1000-external-link>
                </p>
            </article>
            <article class="article">
                <h2>Credits</h2>
                <ul>
                    ${this.getCredits().map(person => `<li>${person.name} - ${person.role}</li>`).join("")}
                </ul>
            </article>
        </div>`;
    }
}

class WT_Credits_View extends WT_HTML_View {
    connectedCallback() {
        super.connectedCallback();

        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this), true);
    }
    /**
     * @param {WT_Credits_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.model.credits.subscribe(credits => this.innerHTML = credits);
    }
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
}
customElements.define("g1000-credits", WT_Credits_View);