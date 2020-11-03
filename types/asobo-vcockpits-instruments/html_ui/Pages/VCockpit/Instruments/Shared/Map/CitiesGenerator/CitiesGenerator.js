/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class CitiesGenerator {
    static BodyLog(message) {
        let e = document.createElement("div");
        e.textContent = "> " + message;
        document.getElementById("output").appendChild(e);
    }
    static async ExtractCities() {
        return new Promise((resolve) => {
            let request = new XMLHttpRequest();
            request.overrideMimeType("text/plain");
            request.onreadystatechange = () => {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        let rawText = request.responseText;
                        let lines = rawText.split("\n");
                        CitiesGenerator.BodyLog("Cities found : " + lines.length);
                        CitiesGenerator.BodyLog("");
                        let cities = new Cities();
                        for (let i = 0; i < lines.length; i++) {
                            let city = new City();
                            city.name = lines[i].split(":")[3].trim().toLowerCase();
                            city.lat = parseFloat(lines[i].split(":")[14]);
                            city.long = parseFloat(lines[i].split(":")[15]);
                            if (!cities.cities.find(c => { return c.name === city.name; })) {
                                cities.cities.push(city);
                            }
                        }
                        for (let i = 0; i < Math.min(3, cities.cities.length - 3); i++) {
                            CitiesGenerator.BodyLog(cities.cities[i].toString());
                        }
                        CitiesGenerator.BodyLog("[...] (" + (cities.cities.length - 6) + " more)");
                        for (let i = Math.max(1, cities.cities.length - 3); i < cities.cities.length; i++) {
                            CitiesGenerator.BodyLog(cities.cities[i].toString());
                        }
                        CitiesGenerator.BodyLog("");
                        resolve(cities);
                    }
                }
            };
            request.open("GET", "./raw_cities.txt?_=" + new Date().getTime());
            request.send();
        });
    }
    static async GetLargeCities(cities) {
        return new Promise((resolve) => {
            let request = new XMLHttpRequest();
            request.overrideMimeType("text/plain");
            request.onreadystatechange = () => {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        let rawText = request.responseText;
                        let lines = rawText.split("\n");
                        CitiesGenerator.BodyLog("Large Cities found : " + lines.length);
                        CitiesGenerator.BodyLog("");
                        let largeCities = [];
                        for (let i = 0; i < lines.length; i++) {
                            largeCities.push(lines[i].split(",")[0].split("(")[0].trim().toLowerCase());
                        }
                        for (let i = 0; i < Math.min(3, largeCities.length - 3); i++) {
                            CitiesGenerator.BodyLog(largeCities[i]);
                        }
                        CitiesGenerator.BodyLog("[...] (" + (largeCities.length - 6) + " more)");
                        for (let i = Math.max(1, largeCities.length - 3); i < largeCities.length; i++) {
                            CitiesGenerator.BodyLog(largeCities[i]);
                        }
                        CitiesGenerator.BodyLog("");
                        resolve(largeCities);
                    }
                }
            };
            request.open("GET", "./large_cities.txt?_=" + new Date().getTime());
            request.send();
        });
    }
    static async GetMediumCities(cities) {
        return new Promise((resolve) => {
            let request = new XMLHttpRequest();
            request.overrideMimeType("text/plain");
            request.onreadystatechange = () => {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        let rawText = request.responseText;
                        let lines = rawText.split("\n");
                        CitiesGenerator.BodyLog("Medium Cities found : " + lines.length);
                        CitiesGenerator.BodyLog("");
                        let mediumCities = [];
                        for (let i = 0; i < lines.length; i++) {
                            mediumCities.push(lines[i].split(",")[0].split("(")[0].trim().toLowerCase());
                        }
                        for (let i = 0; i < Math.min(3, mediumCities.length - 3); i++) {
                            CitiesGenerator.BodyLog(mediumCities[i]);
                        }
                        CitiesGenerator.BodyLog("[...] (" + (mediumCities.length - 6) + " more)");
                        for (let i = Math.max(1, mediumCities.length - 3); i < mediumCities.length; i++) {
                            CitiesGenerator.BodyLog(mediumCities[i]);
                        }
                        CitiesGenerator.BodyLog("");
                        resolve(mediumCities);
                    }
                }
            };
            request.open("GET", "./medium_cities.txt?_=" + new Date().getTime());
            request.send();
        });
    }
    static MarkSize(cities, sizeSource, size) {
        let marked = [];
        for (let i = 0; i < cities.cities.length; i++) {
            let city = cities.cities[i];
            if (sizeSource.indexOf(city.name) !== -1) {
                city.size = size;
                marked.push(city);
            }
        }
        let sizeName = "small";
        if (size === 0) {
            sizeName = "large";
        }
        if (size === 1) {
            sizeName = "medium";
        }
        CitiesGenerator.BodyLog("Cities marked as " + sizeName + " : " + marked.length);
        CitiesGenerator.BodyLog("");
        let rLog = 3;
        for (let i = 0; i < Math.min(rLog, marked.length - rLog); i++) {
            CitiesGenerator.BodyLog(marked[i]);
        }
        CitiesGenerator.BodyLog("[...] (" + (marked.length - 2 * rLog) + " more)");
        for (let i = Math.max(1, marked.length - rLog); i < marked.length; i++) {
            CitiesGenerator.BodyLog(marked[i]);
        }
        CitiesGenerator.BodyLog("");
    }
}
//# sourceMappingURL=CitiesGenerator.js.map