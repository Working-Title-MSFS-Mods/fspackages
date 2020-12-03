class WT_Release_Repository {
    /**
     * @param {string} project 
     */
    constructor(project) {
        this.releases = rxjs.defer(() => {
            return rxjs.from(fetch(WT_Release_Repository.API)
                .catch(e => console.error("Failed to download releases"))
                .then(response => response.json())
                .then(releases => {
                    console.log(`Loaded ${releases.length} releases`);
                    return releases
                        .filter(release => release.tag_name.startsWith(project))
                        .map(release => ({
                            tag: release.tag_name,
                            body: release.body,
                            url: release.html_url,
                            published_at: new Date(release.published_at)
                        }))
                        .sort((a, b) => b.published_at - a.published_at)
                })
            )
        }).pipe(
            rxjs.operators.tap(releases => console.log(`Loaded ${releases.length} releases for ${project}`)),
            rxjs.operators.shareReplay(1)
        );
    }
    getRelease(tag) {
        return this.releases.pipe(
            rxjs.operators.map(releases => releases.find(release => release.tag == tag)),
            rxjs.operators.take(1)
        );
    }
    getLatestRelease() {
        return this.releases.pipe(
            rxjs.operators.map(releases => releases[0]),
            rxjs.operators.take(1)
        );
    }
    getCurrentRelease() {
        const currentRelease$ = rxjs.from(fetch(WT_Release_Repository.VERSION_FILE)
            .then(response => response.json())
            .then(json => json.tag)
        );

        return currentRelease$.pipe(
            rxjs.operators.tap(console.log),
            rxjs.operators.switchMap(tag => this.getRelease(tag))
        )
    }
}
WT_Release_Repository.VERSION_FILE = "/VFS/html_ui/WorkingTitle/Pages/VCockpit/Instruments/NavSystems/AS1000/Version.json";
WT_Release_Repository.API = "https://api.github.com/repos/Working-Title-MSFS-Mods/fspackages/releases";