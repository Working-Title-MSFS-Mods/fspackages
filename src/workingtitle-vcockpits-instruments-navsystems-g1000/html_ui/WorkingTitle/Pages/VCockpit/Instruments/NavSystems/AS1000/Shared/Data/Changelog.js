class WT_Changelog_Repository {
    getAllChangelogs() {
        return fetch("/VFS/html_ui/WorkingTitle/Pages/VCockpit/Instruments/NavSystems/AS1000/MFD/ChangeLog.xml")
            .then(response => response.text())
            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
            .then(xml => {
                const changelogs = [];
                for (let changelogElement of xml.getElementsByTagName("changelog")) {
                    const version = changelogElement.getAttribute("version");
                    const date = new Date(Date.parse(changelogElement.getAttribute("date")));
                    changelogs.push(new WT_Changelog(version, date, () => {
                        return this.getChangelogData(version);
                    }));
                }
                return changelogs;
            }).catch(e => {
                console.error("Could not load changelogs master file");
            });
    }
    getChangelogData(version) {
        const filename = `/VFS/html_ui/WorkingTitle/Pages/VCockpit/Instruments/NavSystems/AS1000/ChangeLogs/${version}.md`;
        return fetch(filename)
            .then(response => response.text())
            .catch(e => {
                console.error("Could not load changelog file");
            })
            .then(text => {
                const sections = {};
                sections["all"] = text;
                const splitSections = text.split(/^# (.*)$/gm);
                for (let i = 1; i < splitSections.length; i += 2) {
                    sections[splitSections[i].toLowerCase()] = splitSections[i + 1];
                }
                return sections;
            }).catch(e => {
                console.error("Changelog file was invalid");
            })
    }
}

class WT_Changelog {
    constructor(version, date, dataLoader) {
        this.version = version;
        this.date = date;
        this._data = null;
        this.dataLoader = dataLoader;
    }
    async getData() {
        if (this._data === null) {
            this._data = await this.dataLoader();
        }
        return this._data
    }
}