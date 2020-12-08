class WT_Release {
    constructor(tag, body, url, download_url, published_at) {
        this.tag = tag;
        this.body = body;
        this.url = url;
        this.download_url = download_url;
        this.published_at = published_at;
    }
    isNewerThan(other) {
        if (!other)
            return true;
        return this.published_at > other.published_at;
    }
}

class WT_Release_Repository {
    /**
     * @param {string} project 
     */
    constructor(project) {
        this.releases = rxjs.defer(() => {
            return rxjs.from(fetch(WT_Release_Repository.API)
                .then(response => {
                    if (!response.ok)
                        throw new Error("Not 2xx response");
                    return response.json();
                })
                .then(releases => {
                    console.log(`Loaded ${releases.length} releases`);
                    return releases
                        .filter(release => release.tag_name.startsWith(project))
                        .map(release => new WT_Release(
                            release.tag_name,
                            release.body,
                            release.html_url,
                            release.assets[0] ? release.assets[0].browser_download_url : null,
                            new Date(release.published_at)
                        ))
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

        return currentRelease$.pipe(rxjs.operators.switchMap(tag => this.getRelease(tag)))
    }
    observeNewRelease() {
        return rxjs.zip(this.getLatestRelease(), this.getCurrentRelease()).pipe(
            rxjs.operators.filter(([latest, current]) => latest ? latest.isNewerThan(current) : false),
            rxjs.operators.map(([latest, current]) => latest)
        );
    }
}
WT_Release_Repository.VERSION_FILE = "/VFS/html_ui/WorkingTitle/Pages/VCockpit/Instruments/NavSystems/AS1000/Version.json";
WT_Release_Repository.API = "https://api.github.com/repos/Working-Title-MSFS-Mods/fspackages/releases";