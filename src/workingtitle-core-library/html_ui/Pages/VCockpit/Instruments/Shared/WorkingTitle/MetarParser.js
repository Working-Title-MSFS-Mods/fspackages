(function() {
    // http://www.met.tamu.edu/class/metar/metar-pg10-sky.html
    // https://ww8.fltplan.com/AreaForecast/abbreviations.htm
    // http://en.wikipedia.org/wiki/METAR
    // http://www.unc.edu/~haines/metar.html

    var re = /(R\d{2})([L|R|C])?(\/)([P|M])?(\d+)(?:([V])([P|M])?(\d+))?([N|U|D])?(FT)?/g;

    function RVR(rvrString) {
        this.result = {};
        this.rvrString = rvrString;
        this.parse();
    }

    RVR.prototype.parse = function() {
        var matches;

        while ((matches = re.exec(this.rvrString)) != null) {
            if (matches.index === re.lastIndex) {
                re.lastIndex++;
            }

            this.result = {
                runway: matches[1],
                direction: matches[2],
                seperator: matches[3],
                minIndicator: matches[4],
                minValue: matches[5],
                variableIndicator: matches[6],
                maxIndicator: matches[7],
                maxValue: matches[8],
                trend: matches[9],
                unitsOfMeasure: matches[10],
            };
        }
    };

    function parseRVR(rvrString) {
        var m = new RVR(rvrString);
        m.parse();
        return m.result;
    }

    var TYPES = ["METAR", "SPECI"];

    var CLOUDS = {
        NCD: "no clouds",
        SKC: "sky clear",
        CLR: "no clouds under 12,000 ft",
        NSC: "no significant",
        FEW: "few",
        SCT: "scattered",
        BKN: "broken",
        OVC: "overcast",
        VV: "vertical visibility",
    };

    var WEATHER = {
        // Intensity
        "-": "light intensity",
        "+": "heavy intensity",
        VC: "in the vicinity",

        // Descriptor
        MI: "shallow",
        PR: "partial",
        BC: "patches",
        DR: "low drifting",
        BL: "blowing",
        SH: "showers",
        TS: "thunderstorm",
        FZ: "freezing",

        // Precipitation
        RA: "rain",
        DZ: "drizzle",
        SN: "snow",
        SG: "snow grains",
        IC: "ice crystals",
        PL: "ice pellets",
        GR: "hail",
        GS: "small hail",
        UP: "unknown precipitation",

        // Obscuration
        FG: "fog",
        VA: "volcanic ash",
        BR: "mist",
        HZ: "haze",
        DU: "widespread dust",
        FU: "smoke",
        SA: "sand",
        PY: "spray",

        // Other
        SQ: "squall",
        PO: "dust or sand whirls",
        DS: "duststorm",
        SS: "sandstorm",
        FC: "funnel cloud",
    };

    var RECENT_WEATHER = {
        REBLSN: "Moderate/heavy blowing snow (visibility significantly reduced)reduced",
        REDS: "Dust Storm",
        REFC: "Funnel Cloud",
        REFZDZ: "Freezing Drizzle",
        REFZRA: "Freezing Rain",
        REGP: "Moderate/heavy snow pellets",
        REGR: "Moderate/heavy hail",
        REGS: "Moderate/heavy small hail",
        REIC: "Moderate/heavy ice crystals",
        REPL: "Moderate/heavy ice pellets",
        RERA: "Moderate/heavy rain",
        RESG: "Moderate/heavy snow grains",
        RESHGR: "Moderate/heavy hail showers",
        RESHGS: "Moderate/heavy small hail showers",
        // RESHGS: "Moderate/heavy snow pellet showers", // dual meaning?
        RESHPL: "Moderate/heavy ice pellet showers",
        RESHRA: "Moderate/heavy rain showers",
        RESHSN: "Moderate/heavy snow showers",
        RESN: "Moderate/heavy snow",
        RESS: "Sandstorm",
        RETS: "Thunderstorm",
        REUP: "Unidentified precipitation (AUTO obs. only)",
        REVA: "Volcanic Ash",
    };

    function parseAbbreviation(s, map) {
        var abbreviation, meaning, length = 3;
        if (!s) return;
        while (length && !meaning) {
            abbreviation = s.slice(0, length);
            meaning = map[abbreviation];
            length--;
        }
        if (meaning) {
            return {
                abbreviation: abbreviation,
                meaning: meaning,
            };
        }
    }

    function asInt(s) {
        return parseInt(s, 10);
    }

    function METAR(metarString) {
        this.fields = metarString
            .split(" ")
            .map(function(f) {
                return f.trim();
            })
            .filter(function(f) {
                return !!f;
            });
        this.i = -1;
        this.current = null;
        this.result = {};
    }

    METAR.prototype.next = function() {
        this.i++;
        return (this.current = this.fields[this.i]);
    };

    METAR.prototype.peek = function() {
        return this.fields[this.i + 1];
    };

    METAR.prototype.parseType = function() {
        var token = this.peek();

        if (TYPES.indexOf(token) !== -1) {
            this.next();
            this.result.type = this.current;
        } else {
            this.result.type = "METAR";
        }
    };

    METAR.prototype.parseStation = function() {
        this.next();
        this.result.station = this.current;
    };

    METAR.prototype.parseDate = function() {
        this.next();
        var d = new Date();
        d.setUTCDate(asInt(this.current.slice(0, 2)));
        d.setUTCHours(asInt(this.current.slice(2, 4)));
        d.setUTCMinutes(asInt(this.current.slice(4, 6)));
        this.result.time = d;
    };

    METAR.prototype.parseAuto = function() {
        this.result.auto = this.peek() === "AUTO";
        if (this.result.auto) this.next();
    };

    METAR.prototype.parseCorrection = function() {
        if (this.result.correction) {
            return;
        }

        var token = this.peek();
        this.result.correction = false;

        if (token.lastIndexOf("CC", 0) == 0) {
            this.result.correction = token.substr(2, 1);
            this.next();
        }

        if (token.lastIndexOf("COR", 0) == 0) {
            this.result.correction = true;
            this.next();
        }
    };

    var variableWind = /^([0-9]{3})V([0-9]{3})$/;
    METAR.prototype.parseWind = function() {
        this.result.wind = {
            speed: null,
            gust: null,
            direction: null,
            variation: null,
        };

        if (this.peek().match(/^[0-9]{1,4}(SM?)/)) {
            return;
        }
        this.next();

        var direction = this.current.slice(0, 3);
        if (direction === "VRB") {
            this.result.wind.direction = "VRB";
            this.result.wind.variation = true;
        } else {
            this.result.wind.direction = asInt(direction);
        }

        var gust = this.current.slice(5, 8);
        if (gust[0] === "G") {
            this.result.wind.gust = asInt(gust.slice(1));
        }

        this.result.wind.speed = asInt(this.current.slice(3, 5));

        var unitMatch;
        if ((unitMatch = this.current.match(/KT|MPS|KPH|SM$/))) {
            this.result.wind.unit = unitMatch[0];
        } else {
            throw new Error("Bad wind unit: " + this.current);
        }

        var varMatch;
        if ((varMatch = this.peek().match(variableWind))) {
            this.next();
            this.result.wind.variation = {
                min: asInt(varMatch[1]),
                max: asInt(varMatch[2]),
            };
        }
    };

    METAR.prototype.parseCavok = function() {
        this.result.cavok = this.peek() === "CAVOK";
        if (this.result.cavok) this.next();
    };

    METAR.prototype.parseVisibility = function() {
        var re = /^([0-9]+)([A-Z]{1,2})/g;
        this.result.visibility = null;
        this.result.visibilityVariation = null;
        this.result.visibilityVariationDirection = null;

        this.result.visibility = null;
        if (this.result.cavok) return;
        this.next();
        if (this.current === "////") return;
        this.result.visibility = asInt(this.current.slice(0, 4));

        // Look for a directional variation report
        if (this.peek().match(/^[0-9]+[N|E|S|W|NW|NE|SW|SE]/)) {
            this.next();

            var matches;
            while ((matches = re.exec(this.current)) != null) {
                if (matches.index === re.lastIndex) {
                    re.lastIndex++;
                }

                this.result.visibilityVariation = matches[1];
                this.result.visibilityVariationDirection = matches[2];
            }
        }
    };

    METAR.prototype.parseRunwayVisibility = function() {
        if (this.result.cavok) return;
        if (this.peek().match(/^R[0-9]+/)) {
            this.next();
            this.result.rvr = parseRVR(this.current);
            // TODO: peek is more than one RVR in METAR and parse
        }
    };

    function parseWeatherAbbrv(s, res) {
        var weather = parseAbbreviation(s, WEATHER);
        if (weather) {
            res = res || [];
            res.push(weather);
            return parseWeatherAbbrv(s.slice(weather.abbreviation.length), res);
        }
        return res;
    }

    METAR.prototype.parseWeather = function() {
        if (this.result.weather === undefined) this.result.weather = null;

        if (this.result.cavok) return;
        var weather = parseWeatherAbbrv(this.peek());

        if (!weather) return;
        if (!this.result.weather) this.result.weather = [];

        this.result.weather = this.result.weather.concat(weather);
        this.next();
        this.parseWeather();
    };

    METAR.prototype.parseClouds = function() {
        if (!this.result.clouds) this.result.clouds = null;
        if (this.result.cavok) return;
        var cloud = parseAbbreviation(this.peek(), CLOUDS);
        if (!cloud) return;

        this.next();

        cloud.altitude = asInt(this.current.slice(cloud.abbreviation.length)) *
            100 || null;
        cloud.cumulonimbus = /CB$/.test(this.current);

        this.result.clouds = this.result.clouds || [];
        this.result.clouds.push(cloud);

        this.parseClouds();
    };

    METAR.prototype.parseTempDewpoint = function() {
        this.next();
        var replaced = this.current.replace(/M/g, "-");
        var a = replaced.split("/");
        if (2 !== a.length) return; // expecting XX/XX
        this.result.temperature = asInt(a[0]);
        this.result.dewpoint = asInt(a[1]);
    };

    METAR.prototype.parseAltimeter = function() {
        var temp;
        this.next();
        if (this.current === undefined || this.current === null) return;

        // inches of mercury if AXXXX
        if (this.current.length === 5 && "A" === this.current[0]) {
            temp = this.current.substr(1, 2);
            temp += ".";
            temp += this.current.substr(3, 5);
            this.result.altimeterInHg = parseFloat(temp, 10);
        } else if (this.current.length && "Q" === this.current[0]) {
            temp = this.current.substr(1);
            this.result.altimeterInHpa = parseInt(temp, 10);
        }
    };

    METAR.prototype.parseRecentSignificantWeather = function() {
        this.next();

        if (this.current === undefined || this.current === null) return;

        if (RECENT_WEATHER[this.current]) {
            this.result.recentSignificantWeather = this.current;
            this.result.recentSignificantWeatherDescription = RECENT_WEATHER[
                this.current
            ];
        }
    };

    METAR.prototype.parse = function() {
        this.parseType();
        this.parseCorrection();
        this.parseStation();
        this.parseDate();
        this.parseAuto();
        this.parseCorrection(); // Second possible position for the correction
        this.parseWind();
        this.parseCavok();
        this.parseVisibility();
        this.parseRunwayVisibility();
        this.parseWeather();
        this.parseClouds();
        this.parseTempDewpoint();
        this.parseAltimeter();
        this.parseRecentSignificantWeather();
    };

    function parseMETAR(metarString) {
        var m = new METAR(metarString);
        m.parse();
        return m.result;
    }

    parseMETAR.parseRVR = parseRVR;

    if (typeof module !== "undefined") {
        module.exports = parseMETAR;
    } else if (typeof window !== "undefined") {
        window.parseMETAR = parseMETAR;
    }
})();