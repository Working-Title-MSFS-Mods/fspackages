#pragma once
#include <MSFS\Legacy\gauges.h>

/// <summary>
/// SimConnect client event IDs for the throttle group.
/// </summary>
enum ThrottleEventIDs
{
    AxisThrottleSet = 0,
};

/// <summary>
/// SimConnect event groups.
/// </summary>
enum EventGroups
{
    /// <summary>
    /// The client event group ID to use when any events from the throttle axis group
    /// are received.
    /// </summary>
    Throttle = 0,
};

/// <summary>
/// SimConnect data types for sending the sim updates.
/// </summary>
enum DataTypes
{
    /// <summary>
    /// The data type ID to use when sending engine controls data.
    /// </summary>
    EngineControls = 0
};

/// <summary>
/// Engine controls.
/// </summary>
struct EngineControlData
{
    /// <summary>
    /// The throttle of the engine, expressed in a 100s base percent.
    /// </summary>
    double throttleLeft;

    /// <summary>
    /// The throttle of the engine, expressed in a 100s base percent.
    /// </summary>
    double throttleRight;
};

/// <summary>
/// A collection of SimVar unit enums.
/// </summary>
class Units
{
public:
    /// <summary>
    /// The Percent SimVar unit.
    /// </summary>
    ENUM Percent = get_units_enum("Percent");

    /// <summary>
    /// The Pounds SimVar unit.
    /// </summary>
    ENUM Pounds = get_units_enum("Pounds");

    /// <summary>
    /// The Foot pounds SimVar unit.
    /// </summary>
    ENUM FootPounds = get_units_enum("Foot pounds");

    ENUM Number = get_units_enum("Number");
};

/// <summary>
/// A collection of SimVar enums.
/// </summary>
class SimVars
{

public:
    Units* units;

    /// <summary>
    /// The GENERAL ENGINE THROTTLE LEVER POSITION SimVar.
    /// </summary>
    ENUM Throttle = get_aircraft_var_enum("GENERAL ENG THROTTLE LEVER POSITION");

    /// <summary>
    /// The TURB ENG JET THRUST:1 SimVar.
    /// </summary>
    ENUM ThrustEng = get_aircraft_var_enum("TURB ENG JET THRUST");

    /// <summary>
    /// The local variable for the current throttle mode to be ready by MFD.
    /// </summary>
    ID ThrottleMode;

    void initializeVars() {
        units = new Units();
        ThrottleMode = register_named_variable("THROTTLE_MODE");
    }

    void setThrottleMode(FLOAT64 value) {
        set_named_variable_value(ThrottleMode, value);
    }

    FLOAT64 getThrust(int index) {
        return aircraft_varget(ThrustEng, this->units->Pounds, index);
    }

    FLOAT64 getThrottleLeverPosition(int index) {
        return aircraft_varget(Throttle, this->units->Percent, index);
    }

};