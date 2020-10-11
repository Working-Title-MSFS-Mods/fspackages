class WT_Page {
    constructor(title, modelFactory, viewFactory) {
        this.title = title;
        this.viewFactory = viewFactory;
        this.modelFactory = modelFactory;
    }
    initialise(container) {
        let view = this.viewFactory();
        container.appendChild(view);
        let model = this.modelFactory();
        view.setModel(model);
        return view;
    }
}

class WT_Page_Controller_Input_Layer extends Input_Layer {
    /**
     * @param {WT_Page_Controller} pageController 
     */
    constructor(pageController) {
        super();
        this.pageController = pageController;
    }
    onLargeInc(inputStack) {
        this.pageController.nextGroup();
    }
    onLargeDec(inputStack) {
        this.pageController.previousGroup();
    }
    onSmallInc(inputStack) {
        this.pageController.nextPage();
    }
    onSmallDec(inputStack) {
        this.pageController.previousPage();
    }
    onNavigationPush(inputStack) {
        this.pageController.togglePageActive();
    }
}

class WT_Page_Controller {
    constructor(pageGroups, pageTitle) {
        this.pageGroups = pageGroups;
        this.pageTitle = pageTitle;

        this.pageContainer = document.querySelector("#PageContainer");
        this.inputLayer = new WT_Page_Controller_Input_Layer(this);

        this.selectedGroupIndex = 0;
        this.selectedPageIndices = pageGroups.map(group => 0);

        this.currentPageView = null;
        this.currentPageActive = false;

        this.pageSelection = new Subject();
    }
    get numGroups() {
        return this.pageGroups.length;
    }
    get numPagesInSelectedGroup() {
        return this.selectedGroup.pages.length;
    }
    get selectedGroup() {
        return this.pageGroups[this.selectedGroupIndex];
    }
    get selectedGroupPageIndex() {
        return this.selectedPageIndices[this.selectedGroupIndex];
    }
    set selectedGroupPageIndex(value) {
        this.selectedPageIndices[this.selectedGroupIndex] = value;
    }
    get selectedPage() {
        return this.selectedGroup.pages[this.selectedGroupPageIndex];
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    handleInput(inputStack) {
        this.inputStack = inputStack;
        this.inputStack.push(this.inputLayer);
    }
    initialisePage() {
        if (this.currentPageView) {
            this.currentPageView.deactivate();
            this.pageContainer.removeChild(this.currentPageView);
        }

        this.currentPageActive = false;

        let page = this.selectedPage;
        this.pageTitle.value = `${this.selectedGroup.name} - ${page.title}`;
        this.currentPageView = page.initialise(this.pageContainer);
        this.currentPageView.activate();

        this.pageSelection.value = {
            groups: this.pageGroups,
            group: this.selectedGroup,
            page: this.selectedPage,
        };
    }
    nextGroup() {
        this.selectedGroupIndex = (this.selectedGroupIndex + 1 + this.numGroups) % this.numGroups;
        this.initialisePage();
    }
    previousGroup() {
        this.selectedGroupIndex = (this.selectedGroupIndex - 1 + this.numGroups) % this.numGroups;
        this.initialisePage();
    }
    nextPage() {
        this.selectedGroupPageIndex = (this.selectedGroupPageIndex + 1 + this.numPagesInSelectedGroup) % this.numPagesInSelectedGroup;
        this.initialisePage();
    }
    previousPage() {
        this.selectedGroupPageIndex = (this.selectedGroupPageIndex - 1 + this.numPagesInSelectedGroup) % this.numPagesInSelectedGroup;
        this.initialisePage();
    }
    togglePageActive() {
        if (this.currentPageActive) {
            this.currentPageView.exit();
            this.currentPageActive = false;
        } else {
            this.currentPageActive = this.currentPageView.enter(this.inputStack) === false ? false : true;
        }
    }
    goTo(groupName, pageName) {
        let i = 0;
        for (let group of this.pageGroups) {
            if (group.name == groupName) {
                let j = 0;
                for (let page of group.pages) {
                    if (page.title == pageName) {
                        this.selectedGroupIndex = i;
                        this.selectedGroupPageIndex = j;
                        this.initialisePage();
                    }
                    j++;
                }
            }
            i++;
        }
    }
    update(dt) {
        if (this.currentPageView) {
            this.currentPageView.update(dt);
        }
    }
}

class WT_Page_Controller_View extends WT_HTML_View {
    constructor() {
        super();
        this.visibleTime = 2000;
    }
    connectedCallback() {
        let template = document.getElementById('page-selector-template');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));
        super.connectedCallback();
    }
    setController(controller) {
        controller.pageSelection.subscribe(selection => {
            if (!selection)
                return;

            this.elements.pageList.innerHTML = "";
            for (let page of selection.group.pages) {
                let li = document.createElement("li");
                li.textContent = page.title;
                if (page == selection.page) {
                    li.classList.add("selected");
                }
                this.elements.pageList.appendChild(li);
            }

            this.elements.groupList.innerHTML = "";
            for (let group of selection.groups) {
                let li = document.createElement("li");
                li.textContent = group.name;
                if (group == selection.group) {
                    li.classList.add("selected");
                }
                this.elements.groupList.appendChild(li);
            }

            if (this.showTimeout) {
                clearTimeout(this.showTimeout);
            }
            this.showTimeout = setTimeout(() => {
                this.removeAttribute("visible");
            }, this.visibleTime);
            this.setAttribute("visible", "visible");
        });
    }
}
customElements.define("g1000-page-selector", WT_Page_Controller_View);