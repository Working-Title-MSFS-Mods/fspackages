class WT_Waypoint_Selector_Model extends WT_Model {
    constructor(type, gps) {
        super();
        this.gps = gps;
        this.facilityLoader = this.gps.facilityLoader;

        this.waypoint = new Subject();
        this.bearing = new Subject();
        this.distance = new Subject();

        this.countryPrefixes = {
            AG: "Solomon Islands",
            AN: "Nauru",
            AY: "Papua New Guinea",
            BG: "Greenland",
            BI: "Iceland",
            BK: "Kosovo",
            C: "Canada",
            DA: "Algeria",
            DB: "Benin",
            DF: "Burkina Faso",
            DG: "Ghana",
            DI: "Côte d'Ivoire",
            DN: "Nigeria",
            DR: "Niger",
            DT: "Tunisia",
            DX: "Togolese Republic",
            EB: "Belgium",
            ED: "Germany (civil)",
            EE: "Estonia",
            EF: "Finland",
            EG: "United Kingdom (and Crown dependencies)",
            EH: "Netherlands",
            EI: "Ireland",
            EK: "Denmark and the Faroe Islands",
            EL: "Luxembourg",
            EN: "Norway",
            EP: "Poland",
            ES: "Sweden",
            ET: "Germany (military)",
            EV: "Latvia",
            EY: "Lithuania",
            FA: "South Africa",
            FB: "Botswana",
            FC: "Republic of the Congo",
            FD: "Eswatini",
            FE: "Central African Republic",
            FG: "Equatorial Guinea",
            FH: "Saint Helena, Ascension and Tristan da Cunha",
            FI: "Mauritius",
            FJ: "British Indian Ocean Territory",
            FK: "Cameroon",
            FL: "Zambia",
            FM: "Comoros, France (Mayotte and Réunion), and Madagascar",
            FN: "Angola",
            FO: "Gabon",
            FP: "São Tomé and Príncipe",
            FQ: "Mozambique",
            FS: "Seychelles",
            FT: "Chad",
            FV: "Zimbabwe",
            FW: "Malawi",
            FX: "Lesotho",
            FY: "Namibia",
            FZ: "Democratic Republic of the Congo",
            GA: "Mali",
            GB: "The Gambia",
            GC: "Spain (Canary Islands)",
            GE: "Spain (Ceuta and Melilla)",
            GF: "Sierra Leone",
            GG: "Guinea-Bissau",
            GL: "Liberia",
            GM: "Morocco",
            GO: "Senegal",
            GQ: "Mauritania",
            GS: "Western Sahara",
            GU: "Guinea",
            GV: "Cape Verde",
            HA: "Ethiopia",
            HB: "Burundi",
            HC: "Somalia (including Somaliland)",
            HD: "Djibouti",
            HE: "Egypt",
            HH: "Eritrea",
            HK: "Kenya",
            HL: "Libya",
            HR: "Rwanda",
            HS: "Sudan and South Sudan",
            HT: "Tanzania",
            HU: "Uganda",
            K: "Contiguous United States",
            LA: "Albania",
            LB: "Bulgaria",
            LC: "Cyprus",
            LD: "Croatia",
            LE: "Spain (mainland section and Balearic Islands)",
            LF: "France (Metropolitan France; including Saint-Pierre and Miquelon)",
            LG: "Greece",
            LH: "Hungary",
            LI: "Italy",
            LJ: "Slovenia",
            LK: "Czech Republic",
            LL: "Israel",
            LM: "Malta",
            LN: "Monaco",
            LO: "Austria",
            LP: "Portugal (including the Azores and Madeira)",
            LQ: "Bosnia and Herzegovina",
            LR: "Romania",
            LS: "Switzerland",
            LT: "Turkey",
            LU: "Moldova",
            LV: "Palestine/Palestinian territories",
            LW: "North Macedonia",
            LX: "Gibraltar",
            LY: "Serbia and Montenegro",
            LZ: "Slovakia",
            MB: "Turks and Caicos Islands",
            MD: "Dominican Republic",
            MG: "Guatemala",
            MH: "Honduras",
            MK: "Jamaica",
            MM: "Mexico",
            MN: "Nicaragua",
            MP: "Panama",
            MR: "Costa Rica",
            MS: "El Salvador",
            MT: "Haiti",
            MU: "Cuba",
            MW: "Cayman Islands",
            MY: "Bahamas",
            MZ: "Belize",
            NC: "Cook Islands",
            NF: "Fiji, Tonga",
            NG: "Kiribati (Gilbert Islands), Tuvalu",
            NI: "Niue",
            NL: "France (Wallis and Futuna)",
            NS: "Samoa, United States (American Samoa)",
            NT: "France (French Polynesia)",
            NV: "Vanuatu",
            NW: "France (New Caledonia)",
            NZ: "New Zealand, parts of Antarctica",
            OA: "Afghanistan",
            OB: "Bahrain",
            OE: "Saudi Arabia",
            OI: "Iran",
            OJ: "Jordan and the West Bank",
            OK: "Kuwait",
            OL: "Lebanon",
            OM: "United Arab Emirates",
            OO: "Oman",
            OP: "Pakistan",
            OR: "Iraq",
            OS: "Syria",
            OT: "Qatar",
            OY: "Yemen",
            PA: "US (Alaska) (also PF, PO and PP)",
            PB: "US (Baker Island)",
            PC: "Kiribati (Canton Airfield, Phoenix Islands)",
            PF: "US (Alaska) (also PA, PO and PP)",
            PG: "US (Guam, Northern Mariana Islands)",
            PH: "US (Hawaii)",
            PJ: "US (Johnston Atoll)",
            PK: "Marshall Islands",
            PL: "Kiribati (Line Islands)",
            PM: "US (Midway Island)",
            PO: "US (Alaska) (also PA, PF and PP)",
            PP: "US (Alaska) (also PA, PF and PO)",
            PT: "Federated States of Micronesia, Palau",
            PW: "US (Wake Island)",
            RC: "Republic of China (Taiwan)",
            RJ: "Japan (Mainland)",
            RK: "Republic of Korea (South Korea)",
            RO: "Japan (Okinawa)",
            RP: "Philippines",
            SA: "Argentina (including parts of Antarctica)",
            SB: "Brazil (also SD, SI, SJ, SN, SS and SW)",
            SC: "Chile (including Easter Island and parts of Antarctica) (also SH)",
            SD: "Brazil (also SB, SI, SJ, SN, SS and SW)",
            SE: "Ecuador",
            SF: "United Kingdom (Falkland Islands)",
            SG: "Paraguay",
            SH: "Chile (also SC)",
            SI: "Brazil (also SB, SD, SJ, SN, SS and SW)",
            SJ: "Brazil (also SB, SD, SI, SN, SS and SW)",
            SK: "Colombia",
            SL: "Bolivia",
            SM: "Suriname",
            SN: "Brazil (also SB, SD, SI, SJ, SS and SW)",
            SO: "France (French Guiana)",
            SP: "Peru",
            SS: "Brazil (also SB, SD, SI, SJ, SN and SW)",
            SU: "Uruguay",
            SV: "Venezuela",
            SW: "Brazil (also SB, SD, SI, SJ, SN and SS)",
            SY: "Guyana",
            TA: "Antigua and Barbuda",
            TB: "Barbados",
            TD: "Dominica",
            TF: "France (Guadeloupe, Martinique, Saint Barthélemy, Saint Martin)",
            TG: "Grenada",
            TI: "US (U.S. Virgin Islands)",
            TJ: "US (Puerto Rico)",
            TK: "Saint Kitts and Nevis",
            TL: "Saint Lucia",
            TN: "Caribbean Netherlands, Aruba, Curaçao, Sint Maarten",
            TQ: "UK (Anguilla)",
            TR: "UK (Montserrat)",
            TT: "Trinidad and Tobago",
            TU: "UK (British Virgin Islands)",
            TV: "Saint Vincent and the Grenadines",
            TX: "UK (Bermuda)",
            U: "Russia (except UA, UB, UC, UD, UG, UK, UM and UT)",
            UA: "Kazakhstan",
            UB: "Azerbaijan",
            UC: "Kyrgyzstan",
            UD: "Armenia",
            UG: "Georgia",
            UK: "Ukraine",
            UM: "Belarus and Russia (Kaliningrad Oblast)",
            UT: "Tajikistan, Turkmenistan, Uzbekistan",
            VA: "India (West India)",
            VC: "Sri Lanka",
            VD: "Cambodia",
            VE: "India (East India)",
            VG: "Bangladesh",
            VH: "Hong Kong",
            VI: "India (North India)",
            VL: "Laos",
            VM: "Macau",
            VN: "Nepal",
            VO: "India (South India)",
            VQ: "Bhutan",
            VR: "Maldives",
            VT: "Thailand",
            VV: "Vietnam",
            VY: "Myanmar",
            WA: "Indonesia (also WI, WQ and WR)",
            WB: "Brunei, Malaysia (East Malaysia)",
            WI: "Indonesia (also WA, WQ and WR)",
            WM: "Malaysia (Peninsular Malaysia)",
            WP: "Timor-Leste",
            WQ: "Indonesia (also WA, WI and WR)",
            WR: "Indonesia (also WA, WI and WQ)",
            WS: "Singapore",
            Y: "Australia (including Norfolk Island, Christmas Island , Cocos (Keeling) Islands and Australian Antarctic Territory)",
            Z: "Mainland China (except ZK and ZM)",
            ZK: "North Korea",
            ZM: "Mongolia",
        }
    }
    setIcao(icao) {
        let waypoint = new WayPoint(this.gps);
        waypoint.icao = icao;
        this.facilityLoader.getFacilityDataCB(waypoint.icao, (data) => {
            if (data) {
                waypoint.SetFromIFacility(data);
                this.waypoint.value = waypoint;
            }
        });
    }
    getCountry(ident) {
        let one = ident.substring(0, 2);
        let two = ident.substring(0, 1);
        if (this.countryPrefixes[two])
            return this.countryPrefixes[two];
        if (this.countryPrefixes[one])
            return this.countryPrefixes[one];
        return "";
    }
}

class WT_Waypoint_Selector_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view, "icao-input"))
        this.view = view;
    }
    onCLR() {
        this.view.cancel();
    }
    onNavigationPush() {
        this.view.cancel();
    }
}

class WT_Waypoint_Selector_View extends WT_HTML_View {
    constructor() {
        super();

        this.inputLayer = new WT_Waypoint_Selector_Input_Layer(this);
    }
    connectedCallback() {
        let template = document.getElementById('waypoint-selector-pane');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        super.connectedCallback();

        this.elements.icaoInput.addEventListener("change", (e) => this.icaoChanged(e.target.icao))
        this.elements.icaoInput.addEventListener("input", (e) => this.icaoInput(e.target.icao))
    }
    icaoInput(icao) {
        this.model.setIcao(icao);
    }
    icaoChanged(icao) {
        this.exit();
        this.resolve(icao);
    }
    getMap() {
        return this.querySelector("map-instrument");
    }
    /**
     * @param {WT_Waypoint_Selector_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.model.waypoint.subscribe(waypoint => {
            if (waypoint && waypoint.infos) {
                let infos = waypoint.infos;
                let map = this.getMap();
                map.bVfrMapFollowPlane = false;
                console.log(infos.lat);
                console.log(infos.lon);
                map.setCenter(infos.coordinates, 0);
                map.setZoom(7); //20nm
                this.elements.country.textContent = this.model.getCountry(infos.ident);
                this.elements.city.textContent = infos.city;

                let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                let planeCoordinates = new LatLong(lat, long);
                this.elements.bearing.innerHTML = `${Avionics.Utils.computeGreatCircleHeading(planeCoordinates, infos.coordinates).toFixed(0)}°`;
                let distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, infos.coordinates);
                this.elements.distance.innerHTML = `${distance.toFixed(distance < 100 ? 1 : 0)}<span class="units">NM</span>`;
            } else {
                this.elements.bearing.innerHTML = `___°`;
                this.elements.distance.innerHTML = `__._<span class="units">NM</span>`;
            }
        });
    }
    setMap(map) {
        this.elements.mapContainer.appendChild(map);
    }
    enter(inputStack) {
        this.inputStackHandler = inputStack.push(this.inputLayer);
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    cancel() {
        this.reject();
        this.exit();
    }
    exit() {
        this.inputStackHandler.pop();
    }
}
customElements.define("g1000-waypoint-selector-pane", WT_Waypoint_Selector_View);