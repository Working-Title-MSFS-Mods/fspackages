/**
 * This class is a shortcut to pulling the nearest airports from FS9GPS into a simplified array of objects for reading by the direct to page
 */

class CJ4_FMC_Nearest {
  constructor(fmc) {
      this._fmc = fmc;
      this.loadState = 0;
      this._referentialLat = undefined;
      this._referentialLong = undefined;

      //Values to set the number of NRST airports to pull and the distance to look - defaulted to 30 airports, but this may sometimes result
      //in not enough airports for a given minimum runway length (filtering for this occurs on the DIR TO page (2))
      this.nbMax = 30;
      this.milesDistance = 200;
      this.airports = [];

      //Values to set timing of FS9GPS calls - currently set to about every 30 seconds to pull a fresh list
      this._nearestCooldownTimer = 25000;
      this.nearestCooldown = 0;
      this._ranGetRunways = false;
      
      this.batch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", "C:fs9gps:NearestAirportCurrentLine");
      this.batch.add("C:fs9gps:NearestAirportSelectedLatitude", "degree latitude");
      this.batch.add("C:fs9gps:NearestAirportSelectedLongitude", "degree longitude");
      this.batch.add("C:fs9gps:NearestAirportCurrentICAO", "string", "string");
      this.batch.add("C:fs9gps:NearestAirportCurrentIdent", "string", "string");
      this.batch.add("C:fs9gps:NearestAirportCurrentDistance", "nautical miles", "number");
      this.batch.add("C:fs9gps:NearestAirportCurrentTrueBearing", "degrees", "number");
  }

  activate() {
    this.loadState = 0;
    this.update();
  }

  update() {
    this._referentialLat = SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude");
    this._referentialLong = SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude");
    if (this.loadState === 2 || this.loadState === 0) {
      this.loadState = 1;
      this.prepare().then(() => {
        this.load();
      });
    }
  }
  
  async prepare() {
    var instrId = "CJ4_FMC";
    SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLatitude", "degree latitude", this._referentialLat, instrId);
    SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLongitude", "degree longitude", this._referentialLong, instrId);
    SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumItems", "number", this.nbMax, instrId);
    SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumDistance", "nautical miles", this.milesDistance, instrId);
    return true;
  }

  /**
   * Method to fetch the nearest airports from FS9GPS and load them into an array of airport objects.
   */
  load() {
    if (this.airports.length > 0) {
      this.airports = this.airports.slice(0, 0);
    }
    var instrId = "CJ4_FMC";
    SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
      for (var i = 0; i < _Values.length; i++) {
        const airport = {
          type: "A",
          ident: _Values[i][3],
          icao: _Values[i][2],
          distance: _Values[i][4],
          bearing: _Values[i][5],
          latitude: _Values[i][0],
          longitude: _Values[i][1],
          longestRunway: "",
          longestRunwayLength: 0
        };
        this.airports.push(airport);
      }
      this.loadState = 2;
    }.bind(this), instrId);
  }

  /**
   * Method to fetch the longest runway length and designation from facilityloader
   * This also pulls the origin and destination and makes dummy entries for them to be read later in DIRTO
   * because the CJ4 PL21 always includes the origin and destination in the nearest list of 5
   * 
   * getRunways runs a short while after the FS9GPS calls
   */
  async getRunways() {
    let runwaysToGet = this.airports.length;
    if (this._fmc.flightPlanManager.getOrigin()) {
      runwaysToGet++;
      const origin = this._fmc.flightPlanManager.getOrigin();
      const originAirport = {
        type: "A",
        ident: "origin",
        icao: origin.icao,
        distance: 0,
        bearing: 0,
        latitude: 0,
        longitude: 0,
        longestRunway: "",
        longestRunwayLength: 0
      };
      this.airports.push(originAirport);
    }

    if (this._fmc.flightPlanManager.getDestination()) {
      runwaysToGet++;
      const destination = this._fmc.flightPlanManager.getDestination();
      const destinationAirport = {
        type: "A",
        ident: "destination",
        icao: destination.icao,
        distance: 0,
        bearing: 0,
        latitude: 0,
        longitude: 0,
        longestRunway: "",
        longestRunwayLength: 0
      };
      this.airports.push(destinationAirport);
    }

    for (let i = 0; i < runwaysToGet; i++) {
      let icao = this.airports[i].icao;
      let databaseWaypoint = await this._fmc.facilityLoader.getAirport(icao);
      let runways = databaseWaypoint.infos.oneWayRunways;
      let longestRunway = runways[0];
      let longestRunwaySort = 0;
      let longestRunwayLength = 0;
      for (let j = 0; j < runways.length; j++) {
          longestRunwayLength = runways[j].length
          if (longestRunwayLength > longestRunwaySort) {
              longestRunwaySort = longestRunwayLength;
              longestRunway = runways[j];
          }
      }
      let longestRunwayDesignation = new String(longestRunway.designation);
      let longestRunwayOutput = "";
      let longestRunwayMod = new String(longestRunwayDesignation.slice(-1));
      if (longestRunwayMod == "L" || longestRunwayMod == "C" || longestRunwayMod == "R") {
          if (longestRunwayDesignation.length == 2) {
              longestRunwayOutput = "0" + longestRunwayDesignation;
          } else {
              longestRunwayOutput = longestRunwayDesignation;
          }
      } else {
          if (longestRunwayDesignation.length == 2) {
              longestRunwayOutput = longestRunwayDesignation;
          } else {
              longestRunwayOutput = "0" + longestRunwayDesignation;
          }
      }

      this.airports[i].longestRunway = longestRunwayOutput;
      this.airports[i].longestRunwayLength = parseInt(longestRunwayLength);
    }
  }
}