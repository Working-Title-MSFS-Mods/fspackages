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
                role: "Programming"
            },
            {
                name: "Chris",
                role: "Programming"
            },
        ];
    }
    initCredits() {
        this.credits.value = `
        <div style="display:grid; grid-template-columns:50% 50%; gap:5vh">
            <article class="article">
                <img src="/WorkingTitle/Pages/VCockpit/Instruments/NavSystems/AS1000/MFD/Pages/Auxilliary/Garmin.svg" style="width:100%;"/>
                <h1>Working Title</h1>
                <p>Thank you for using Working Title's G1000 mod! We hope you enjoy your time with it as much as we enjoyed making it.</p>
                <p><b><u>github.com/Working-Title-MSFS-Mods/fspackages</u></b></p>
                <ul>
                    <li><b>Version:</b> 0.3</li>
                    <li><b>Released:</b> 1st October 2020</li>
                </ul>
                <p>Don't forget to check out our other project, a massive update to the Cessna Citation CJ4 on our Github!</p>
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
    }
    /**
     * @param {WT_Credits_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.model.credits.subscribe(credits => this.innerHTML = credits);
    }
    enter(inputStack) {
        return false;
    }
    exit() {
    }
}
customElements.define("g1000-credits", WT_Credits_View);