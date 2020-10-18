class CJ4_FMC_FrequencyPage {

    static async ShowMainPage(fmc, currentPage = 1) {

        const ITEMS_PER_COLOUMN = 4;
        const ITEMS_PER_PAGE = 2 * ITEMS_PER_COLOUMN;
        const MAX_SELECTABLE_AIRPORTS = 4;
        const PILOT_DEFINED_AIRPORT_INDEX = 3;
        const FREQUENCY_DECIMAL_PLACES = 3;

        let pageCount;

        let origin = fmc.flightPlanManager.getOrigin();
        let destination = fmc.flightPlanManager.getDestination();
        let alternate; // Not supported yet, flightPlanManager does not manage alternate
        let pilotDefined = fmc.frequencyPilotDefinedAirport;

        let airports = [origin, destination, alternate, pilotDefined];
        let selectedWaypoint = airports[fmc.frequencySelectedWaypointIndex];
        let selectionIsAirport = selectedWaypoint && selectedWaypoint.icao[0] === "A";

        let formatAirportTextElement = (index, placeholder) => {
            let rslt = airports[index] ? airports[index].ident : placeholder.repeat(4);
            rslt += (index === fmc.frequencySelectedWaypointIndex && selectedWaypoint) ? "[green]" : "[s-text]";
            return rslt;
        }
         
        let selectedWaypointText =
            formatAirportTextElement(0, "-") + "/[s-text]" +
            formatAirportTextElement(1, "-") + "/[s-text]" +
            formatAirportTextElement(2, "-") + "/[s-text]" +
            formatAirportTextElement(3, "□");
            
        let showNoDataAvailable = () => {
            fmc.setMsg();
            fmc.clearDisplay();
            pageCount = 1;
            fmc._templateRenderer.setTemplateRaw([
                ["FREQUENCY DATA[blue]", currentPage + "/" + pageCount + "[blue]"],
                [" SEL APT[blue]"],
                [selectedWaypointText],
                [""],
                [""],
                ["", "", "NO DATA"],
                [""],
                ["", "", "AVAILABLE"],
                [""],
                [""],
                [""],
                ["------------------------[blue]"],
                ["<INDEX"]
            ]);
        }

        if (!selectedWaypoint || !selectionIsAirport) {
            showNoDataAvailable();
        } else {
            fmc.setMsg("Working...");
            await selectedWaypoint.infos.UpdateNamedFrequencies();
            let namedFrequencies = selectedWaypoint.infos.namedFrequencies;
            
            // Group frequencies by name. For instance, an airport can have multiple Ground frequencies.
            let frequenciesByName = new Map();
            namedFrequencies.forEach(frequency => {
                if (!frequenciesByName.has(frequency.name)) {
                    frequenciesByName.set(frequency.name, []);
                }
                frequenciesByName.get(frequency.name).push(frequency.value);
            });
            
            let headlines = [];
            let datalines = [];
            let MULTIPLE_LEFT = "<MULTIPLE";
            let MULTIPLE_RIGHT = "MULTIPLE>";
            frequenciesByName.forEach((frequencyValues, freqName) => {
                headlines.push(freqName);
                if (frequencyValues.length === 1) {
                    datalines.push(frequencyValues[0].toFixed(FREQUENCY_DECIMAL_PLACES));
                } else {
                    // every 4 items: switch arrow direction
                    if (Math.floor(datalines.length / 4) % 2 === 0) {
                        datalines.push(MULTIPLE_LEFT);
                    } else {
                        datalines.push(MULTIPLE_RIGHT);
                    }
                }
            });
            
            if (headlines.length === 0) {
                showNoDataAvailable();
            } else {
                // paging
                pageCount = Math.floor((headlines.length - 1) / ITEMS_PER_PAGE) + 1;                
                headlines = headlines.slice((currentPage-1) * ITEMS_PER_PAGE, (currentPage) * ITEMS_PER_PAGE);
                datalines = datalines.slice((currentPage-1) * ITEMS_PER_PAGE, (currentPage) * ITEMS_PER_PAGE);

                // pad to ITEMS_PER_PAGE items, they may be empty
                while (headlines.length < ITEMS_PER_PAGE) {
                    headlines.push("");
                    datalines.push("");
                }

                fmc.setMsg();
                fmc.clearDisplay();
                
                // LSKs
                for (let i = 0; i < ITEMS_PER_COLOUMN; i++) {
                    let dataIndex = i;
                    let lskIndex = i + 1;
                    if (datalines[dataIndex] === MULTIPLE_LEFT) {
                        fmc.onLeftInput[lskIndex] = () => {
                            CJ4_FMC_FrequencyPage.ShowMultiplePage(fmc, selectedWaypoint, headlines[dataIndex], frequenciesByName.get(headlines[dataIndex]), 1);
                        }                        
                    } else {
                        fmc.onLeftInput[lskIndex] = () => {
                            if (!fmc.inOut || fmc.inOut === "") {
                                fmc.inOut = datalines[dataIndex];
                            }
                        }
                    }
                }
                
                // RSKs
                for (let i = 0; i < ITEMS_PER_COLOUMN; i++) {
                    let dataIndex = i + ITEMS_PER_COLOUMN;
                    let rskIndex = i + 1;                    
                    if (datalines[dataIndex] === MULTIPLE_RIGHT) {
                        fmc.onRightInput[rskIndex] = () => {
                            CJ4_FMC_FrequencyPage.ShowMultiplePage(fmc, selectedWaypoint, headlines[dataIndex], frequenciesByName.get(headlines[dataIndex]), 1);                            
                        }                        
                    } else {
                        fmc.onRightInput[rskIndex] = () => {
                            if (!fmc.inOut || fmc.inOut === "") {
                                fmc.inOut = datalines[dataIndex];
                            }
                        }
                    }
                }            

                fmc._templateRenderer.setTemplateRaw([
                    ["FREQUENCY DATA[blue]", currentPage + "/" + pageCount + "[blue]"],
                    [" SEL APT[blue]"],
                    [selectedWaypointText],
                    [" " + headlines[0] + "[blue]", headlines[4] + " [blue]"],
                    [datalines[0], datalines[4]],
                    [" " + headlines[1] + "[blue]", headlines[5] + " [blue]"],
                    [datalines[1], datalines[5]],
                    [" " + headlines[2] + "[blue]", headlines[6] + " [blue]"],
                    [datalines[2], datalines[6]],
                    [" " + headlines[3] + "[blue]", headlines[7] + " [blue]"],
                    [datalines[3], datalines[7]],
                    ["------------------------[blue]"],
                    ["<INDEX"]
                ]);
            }
        }

        // LSK Airport Selection: Cycles through available airports
        fmc.onLeftInput[0] = () => {
            let nextIndex = (fmc.frequencySelectedWaypointIndex + 1) % MAX_SELECTABLE_AIRPORTS;
            while (!airports[nextIndex] && nextIndex !== fmc.frequencySelectedWaypointIndex) {
                nextIndex = (nextIndex + 1) % MAX_SELECTABLE_AIRPORTS;
            }
            fmc.frequencySelectedWaypointIndex = nextIndex;
            CJ4_FMC_FrequencyPage.ShowMainPage(fmc);
        };
        // RSK Set pilot-defined Airport
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            if (value && value !== "") {
                fmc.clearUserInput();
                fmc.setMsg("Working...");
                fmc.dataManager.GetAirportByIdent(value).then(airport => {
                    fmc.setMsg();
                    if (airport) {
                        // set and select pilot-defined airport
                        fmc.frequencySelectedWaypointIndex = PILOT_DEFINED_AIRPORT_INDEX;
                        fmc.frequencyPilotDefinedAirport = airport;
                        CJ4_FMC_FrequencyPage.ShowMainPage(fmc, 1);
                    } else {
                        CJ4_FMC_FrequencyPage.ShowMainPage(fmc, 1);
                    }
                    
                });
            }
        };
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_FrequencyPage.ShowMainPage(fmc, currentPage === 1 ? pageCount : (currentPage - 1)); };
        fmc.onNextPage = () => { CJ4_FMC_FrequencyPage.ShowMainPage(fmc, currentPage === pageCount ? 1 : (currentPage + 1)); };
        fmc.updateSideButtonActiveStatus();
    }

    /*
     * Shows multiple frequencies of a specific type, for instance all "Ground" frequencies of the airport.
     */
    static ShowMultiplePage(fmc, selectedAirport, frequencyName, frequencyValues, currentPage = 1) {
        
        const ITEMS_PER_PAGE = 5;
        const FREQUENCY_DECIMAL_PLACES = 3;
        
        // paging
        let pageCount = Math.floor((frequencyValues.length - 1) / ITEMS_PER_PAGE) + 1;                
        let datalines = frequencyValues.slice((currentPage-1) * ITEMS_PER_PAGE, (currentPage) * ITEMS_PER_PAGE);
        
        // convert numbers to strings with FREQUENCY_DECIMAL_PLACES decimal places
        datalines = datalines.map(e => e.toFixed(FREQUENCY_DECIMAL_PLACES));
        
        fmc.clearDisplay();

        // LSKs
        for (let i = 0; i < datalines.length; i++) {
            fmc.onLeftInput[i] = () => {
                if (!fmc.inOut || fmc.inOut === "") {
                    fmc.inOut = datalines[i];
                }
            }
        }

        // pad to ITEMS_PER_PAGE items, they may be empty
        while (datalines.length < ITEMS_PER_PAGE) {
            datalines.push("");
        }

        fmc._templateRenderer.setTemplateRaw([
            [selectedAirport.ident + "[blue]", currentPage + "/" + pageCount + "[blue]", frequencyName + "[blue]"],
            [""],
            [datalines[0]],
            [""],
            [datalines[1]],
            [""],
            [datalines[2]],
            [""],
            [datalines[3]],
            [""],
            [datalines[4]],
            ["------------------------[blue]"],
            ["<FREQUENCY"]
        ]);
        
        fmc.onLeftInput[5] = () => { CJ4_FMC_FrequencyPage.ShowMainPage(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_FrequencyPage.ShowMultiplePage(fmc, selectedAirport, frequencyName, frequencyValues, currentPage === 1 ? pageCount : (currentPage - 1)); };
        fmc.onNextPage = () => { CJ4_FMC_FrequencyPage.ShowMultiplePage(fmc, selectedAirport, frequencyName, frequencyValues, currentPage === pageCount ? 1 : (currentPage + 1)); };
        fmc.updateSideButtonActiveStatus();        
    }
}