class WT_TSCTabbedContent {
    constructor(_parentElement, _tabOpenCallback = function(_id){}, _tabCloseCallback = function(_id){}) {
        this.parentElement = _parentElement;

        this.tabOpenCallback = _tabOpenCallback;
        this.tabCloseCallback = _tabCloseCallback;
    }

    init(_container) {
        this.container = _container;
        this.tabButtons = this.container.getElementsByClassName("tabButton");
        this.tabContent = this.container.getElementsByClassName("tabContentContainer")[0].getElementsByClassName("tabContent");

        for (let i = 0; i < this.tabButtons.length; i++) {
            this.parentElement.gps.makeButton(this.tabButtons[i], this.onTabButtonClick.bind(this, i));
        }
        this.activeTab = 0;
    }

    getActiveTab() {
        return this.activeTab;
    }

    activateTab(_id) {
        if (this.activeTab != _id && this.tabButtons[_id].getAttribute("state") != "Disabled") {
            Avionics.Utils.diffAndSetAttribute(this.tabContent[this.activeTab], "state", "Inactive");
            Avionics.Utils.diffAndSetAttribute(this.tabButtons[this.activeTab], "state", "");
            this.tabCloseCallback(this.activeTab);

            Avionics.Utils.diffAndSetAttribute(this.tabContent[_id], "state", "Active");
            Avionics.Utils.diffAndSetAttribute(this.tabButtons[_id], "state", "Highlight");
            this.activeTab = _id;
            this.tabOpenCallback(this.activeTab);
        }
    }

    onTabButtonClick(_id) {
        this.activateTab(_id);
    }
}