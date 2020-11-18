class WT_Changelog_Model {
    /**
     * @param {WT_Changelog_Repository} repository 
     */
    constructor(repository) {
        this.repository = repository;
        this.changelogs = new Subject([]);
        this.selectedChangelog = new Subject(null);

        this.loadChangelogs();
    }
    loadChangelogs() {
        this.repository.getAllChangelogs()
            .then(changelogs => {
                this.changelogs.value = changelogs;
            });
    }
    selectChangelog(version) {
        this.selectedChangelog.value = this.changelogs.value.find(changelog => changelog.version == version);
    }
}

class WT_Changelog_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this), false);
        this.data = null;
        this.selectedSection = "all";
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;
        
        const template = document.getElementById('aux-changelog');
        this.appendChild(template.content.cloneNode(true));

        super.connectedCallback();

        this.elements.selectedChangelogScrollable.addEventListener("focus", () => this.elements.selectedChangelogContainer.setAttribute("highlighted", ""));
        this.elements.selectedChangelogScrollable.addEventListener("blur", () => this.elements.selectedChangelogContainer.removeAttribute("highlighted"));
    }
    /**
     * @param {WT_Changelog_Model} model 
     */
    setModel(model) {
        this.model = model;

        model.changelogs.subscribe(changelogs => {
            this.elements.changelogSelector.clearOptions();
            let i = 0;
            for (let changelog of changelogs) {
                if (i++ == 0) {
                    this.selectChangelog(changelog.version);
                }
                this.elements.changelogSelector.addOption(changelog.version, changelog.version);
            }
        });
        model.selectedChangelog.subscribe(async changelog => {
            if (!changelog)
                return;

            try {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'long' };
                this.elements.date.textContent = changelog.date.toLocaleDateString("en-US", options);

                const data = await changelog.getData();
                this.data = data;
                this.selectedSection = "all";
                this.updateChangelogView();
            } catch (e) {
                console.error(e.message);
            }
        });
    }
    selectChangelog(version) {
        this.model.selectChangelog(version);
    }
    updateChangelogView() {
        if (this.selectedSection in this.data) {
            this.elements.selectedChangelog.innerHTML = marked(this.data[this.selectedSection]);
        } else {
            this.elements.selectedChangelog.innerHTML = "No updates";
        }
    }
    selectSection(section) {
        this.selectedSection = section;
        this.updateChangelogView();
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
customElements.define("g1000-changelog", WT_Changelog_View);