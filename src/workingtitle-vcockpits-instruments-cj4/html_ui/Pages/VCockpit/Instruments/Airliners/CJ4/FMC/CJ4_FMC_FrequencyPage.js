class CJ4_FMC_FrequencyPage {

    static async ShowMainPage(fmc, currentPage = 1) {

        let pageCount;

        let origin = fmc.flightPlanManager.getOrigin();
        let destination = fmc.flightPlanManager.getDestination();
        let alternate; // Not supported yet, flightPlanManager does not manage alternate
        let pilotDefined = fmc.frequenciesPilotDefinedAirport;

        let airports = [origin, destination, alternate, pilotDefined];
        let selectedAirportIndex = fmc.frequenciesSelectedAirportIndex;
        let selectedAirport = airports[selectedAirportIndex];

        let formatAirportTextElement = (index, placeholder) => {
            let rslt = airports[index] ? airports[index].ident : placeholder.repeat(4);
            rslt += (index === selectedAirportIndex) ? "[green]" : "[s-text]";
            return rslt;
        }
         
        let selectedAirportText =
            formatAirportTextElement(0, "-") + "/[s-text]" +
            formatAirportTextElement(1, "-") + "/[s-text]" +
            formatAirportTextElement(2, "-") + "/[s-text]" +
            formatAirportTextElement(3, "□");

        if (!selectedAirport) {
            fmc.clearDisplay();
            pageCount = 1;
            fmc._templateRenderer.setTemplateRaw([
                ["FREQUENCY DATA[blue]", currentPage + "/" + pageCount + "[blue]"],
                [" SEL APT[blue]"],
                [selectedAirportText],
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
        } else {
            fmc.setMsg("Working...");
            await selectedAirport.infos.UpdateNamedFrequencies();
            let namedFrequencies = selectedAirport.infos.namedFrequencies;
            
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
                    datalines.push(frequencyValues[0].toFixed(2));
                } else {
                    // every 4 items: switch arrow direction
                    if (Math.floor(datalines.length / 4) % 2 === 0) {
                        datalines.push(MULTIPLE_LEFT);
                    } else {
                        datalines.push(MULTIPLE_RIGHT);
                    }
                }
            });
            
            // paging
            pageCount = Math.floor((headlines.length - 1) / 8) + 1;
            headlines = headlines.slice((currentPage-1)*8, (currentPage)*8);
            datalines = datalines.slice((currentPage-1)*8, (currentPage)*8);

            // pad to 8 items on the page, they may be empty
            while (headlines.length < 8) {
                headlines.push("");
                datalines.push("");
            }

            fmc.setMsg();
            fmc.clearDisplay();
            
            // LSKs
            for (let i = 0; i < 4; i++) {
                if (datalines[i] !== MULTIPLE_LEFT) {
                    fmc.onLeftInput[i+1] = () => {
                        if (!fmc.inOut || fmc.inOut === "") {
                            fmc.inOut = datalines[i];
                        }
                    }
                }
            }
            
            // RSKs
            for (let i = 0; i < 4; i++) {
                if (datalines[i+4] !== MULTIPLE_RIGHT) {
                    fmc.onRightInput[i+1] = () => {
                        if (!fmc.inOut || fmc.inOut === "") {
                            fmc.inOut = datalines[i+4];
                        }
                    }
                }
            }            

            fmc._templateRenderer.setTemplateRaw([
                ["FREQUENCY DATA[blue]", currentPage + "/" + pageCount + "[blue]"],
                [" SEL APT[blue]"],
                [selectedAirportText],
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

        fmc.onLeftInput[0] = () => {
            fmc.frequenciesSelectedAirportIndex = selectedAirportIndex === 0 ? 3 : selectedAirportIndex - 1;
            CJ4_FMC_FrequencyPage.ShowMainPage(fmc);
        };
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            if (!value || value === "") {
                fmc.frequenciesSelectedAirportIndex = selectedAirportIndex === 3 ? 0 : selectedAirportIndex + 1;
                CJ4_FMC_FrequencyPage.ShowMainPage(fmc, 1);
            } else {
                fmc.clearUserInput();
                fmc.setMsg("Working...");
                fmc.getOrSelectWaypointByIdent(value, (w) => {
                    fmc.setMsg();
                    if (w) {
                        // set and select pilot-defined airport
                        fmc.frequenciesSelectedAirportIndex = 3;
                        fmc.frequenciesPilotDefinedAirport = w;
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
}