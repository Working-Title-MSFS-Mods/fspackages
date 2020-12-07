class WT_Page {
    constructor(title, modelFactory, viewFactory) {
        this.title = title;
        this.viewFactory = viewFactory;
        this.modelFactory = modelFactory;

        this.model = null;
        this.view = null;
    }
    initialise(container) {
        /*this.model = null;
        this.view = null;*/
        try {
            if (this.view === null) {
                this.view = this.viewFactory();
            }
            container.appendChild(this.view);
            if (this.model === null) {
                this.model = this.modelFactory();
                this.view.setModel(this.model);
            }
            return this.view;
        } catch (e) {
            console.error(e.message);
            throw e;
        }
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
        this.pageController.togglePageEntered();
    }
}

class WT_Page_Controller_Group {
    constructor(name, pages) {
        this.name = name;
        this.pages = pages;
    }
    addPage(page) {
        this.pages.push(page);
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
        this.currentPageEntered = false;

        this.pageSelection = new Subject();

        this.debounceShowPage = DOMUtilities.debounce(intent => {
            let page = this.selectedPage;
            if (this.currentPage == page)
                return;
            this.showPage(page, false, intent);

            this.pageTitle.value = `${this.selectedGroup.name} - ${page.title}`;
        }, 300, false);


        /*this.showPage$ = new rxjs.Subject();

        const page$ = this.showPage$.pipe(
            rxjs.operators.startWith(null),
            rxjs.operators.distinctUntilChanged((a, b) => {
                if (a == null)
                    return false;
                return a.page != b.page;
            }),
            rxjs.operators.pairwise()
        );

        this.toggleEnter$ = new rxjs.Subject();

        page$.pipe(
            rxjs.operators.switchMap(([previousPageState, pageState]) => {
                if (pageState == null)
                    return rxjs.empty();


                const page = pageState.page;
                const view = page.initialise(this.pageContainer);
                view.activate(this.inputStack, pageState.intent);

                let obs = this.toggleEnter$;
                if (pageState.enter)
                    obs = obs.pipe(rxjs.operators.startWith(null));
                obs = obs.pipe(
                    rxjs.operators.scan(entered => {
                        if (entered) {
                            view.exit();
                            return false;
                        } else {
                            return view.enter(this.inputStack) === false ? false : true;
                        }
                    }, false),
                    rxjs.operators.startWith(false),
                    rxjs.operators.last(),
                    rxjs.operators.tap(entered => {
                        if (entered) {
                            view.exit();
                        }
                        view.deactivate();
                        this.pageContainer.removeChild(view);
                    })
                );
                return obs;
            })
        ).subscribe();*/

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
    addPage(groupName, page) {
        const group = this.getGroupByName(groupName);
        group.pages.push(page);
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    handleInput(inputStack) {
        this.inputStack = inputStack;
        this.inputStack.push(this.inputLayer);
    }
    showPage(page, activate = false, intent = null) {
        /*this.showPage$.next({
            page: page,
            enter: activate,
            intent: intent,
        });

        return;*/

        if (this.currentPageView) {
            this.currentPageView.deactivate();
            if (this.currentPageEntered)
                this.currentPageView.exit();
            this.pageContainer.removeChild(this.currentPageView);
        }

        this.currentPageEntered = false;

        this.currentPage = page;
        this.currentPageView = page.initialise(this.pageContainer);
        this.currentPageView.activate(this.inputStack, intent);

        if (activate) {
            this.togglePageEntered();
        }

        return this.currentPageView;
    }
    showSelectedPage(intent) {
        this.debounceShowPage(intent);

        this.pageSelection.value = {
            groups: this.pageGroups,
            group: this.selectedGroup,
            page: this.selectedPage,
        };
    }
    nextGroup() {
        this.selectedGroupIndex = Math.min(this.selectedGroupIndex + 1, this.numGroups - 1);
        this.showSelectedPage();
    }
    previousGroup() {
        this.selectedGroupIndex = Math.max(this.selectedGroupIndex - 1, 0);
        this.showSelectedPage();
    }
    nextPage() {
        this.selectedGroupPageIndex = Math.min(this.selectedGroupPageIndex + 1, this.numPagesInSelectedGroup - 1);
        this.showSelectedPage();
    }
    previousPage() {
        this.selectedGroupPageIndex = Math.max(this.selectedGroupPageIndex - 1, 0);
        this.showSelectedPage();
    }
    togglePageEntered() {
        /*this.toggleEnter$.next();
        return;*/
        if (this.currentPageEntered) {
            this.currentPageView.exit();
            this.currentPageEntered = false;
        } else {
            this.currentPageEntered = this.currentPageView.enter(this.inputStack) === false ? false : true;
        }
    }
    getGroupByName(groupName) {
        for (let group of this.pageGroups) {
            if (group.name == groupName) {
                return group;
            }
        }
        return null;
    }
    goTo(groupName, pageName, intent = null) {
        let i = 0;
        for (let group of this.pageGroups) {
            if (group.name == groupName) {
                let j = 0;
                for (let page of group.pages) {
                    if (page.title == pageName) {
                        this.selectedGroupIndex = i;
                        this.selectedGroupPageIndex = j;
                        this.showSelectedPage(intent);
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