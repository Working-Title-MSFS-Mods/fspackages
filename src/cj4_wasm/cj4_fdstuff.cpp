// Copyright (c) Asobo Studio, All rights reserved. www.asobostudio.com

#include "cj4_fdstuff.h"
#include "PidController.cpp"
#include <MSFS\MSFS.h>
#include <MSFS\Legacy\gauges.h>

#include <SimConnect.h>
#include <stdio.h>
#include <string.h>
#include <math.h>
#include <map>

#ifdef _MSC_VER
#define snprintf _snprintf_s
#elif !defined(__MINGW32__)
#include <iconv.h>
#endif
#include "SimConnectDefs.h"

int globalAxis(0);

class CJ4FD
{
private:
    /// <summary>
    /// The handle to the SimConnect instance.
    /// </summary>
    HANDLE hSimConnect;

    /// <summary>
    /// An instance of the throttle PID controller.
    /// </summary>
    PidController* throttleLeftController;

    /// <summary>
    /// An instance of the throttle PID controller.
    /// </summary>
    PidController* throttleRightController;

    /// <summary>
    /// The current throttle control axis, from 0 to 16583.
    /// </summary>
    int currentAxis = 0;

    /// <summary>
    /// The SimVars to use with this FADEC instance.
    /// </summary>
    SimVars* simVars;

    /// <summary>
    /// The units to use with this FADEC instance.
    /// </summary>
    Units* units;

    /// <summary>
    /// Registers all the throttle SimConnect client events.
    /// </summary>
    void RegisterThrottleClientEvents()
    {
        printf("Registering throttle events...\r\n");

        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottleSet, "THROTTLE_AXIS_SET_EX1");
    }

    /// <summary>
    /// Registers the SimConnect throttle event group for capture.
    /// </summary>
    void RegisterThrottleEventGroup()
    {
        printf("Registering throttle event group...\r\n");

        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottleSet, TRUE);
        SimConnect_SetNotificationGroupPriority(hSimConnect, EventGroups::Throttle, SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE);
    }

    /// <summary>
    /// Initializes the ECU connection to SimConnect.
    /// </summary>
    /// <returns>True if successful, false otherwise.</returns>
    bool InitializeSimConnect()
    {
        printf("Connecting to SimConnect...\r\n");
        if (SUCCEEDED(SimConnect_Open(&hSimConnect, "CJ4FD", nullptr, 0, 0, 0)))
        {
            printf("SimConnect connected.\r\n");

            this->RegisterThrottleClientEvents();
            this->RegisterThrottleEventGroup();

            simVars->initializeVars();

            SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG THROTTLE LEVER POSITION:1", "Percent");
            SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG THROTTLE LEVER POSITION:2", "Percent");

            printf("SimConnect registrations complete.\r\n");
            return true;
        }

        return false;
    }

    /// <summary>
    /// A callback used for handling SimConnect updates.
    /// </summary>
    /// <param name="pData">The update data sent by SimConnect.</param>
    /// <param name="cbData">The size of the SimConnect data structure.</param>
    /// <param name="pContext">A pointer specified by the client.</param>
    static void CALLBACK HandleAxisEvent(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext)
    {
        if (pData->dwID == SIMCONNECT_RECV_ID::SIMCONNECT_RECV_ID_EVENT)
        {
            SIMCONNECT_RECV_EVENT* evt = static_cast<SIMCONNECT_RECV_EVENT*>(pData);
            if (evt->uGroupID == EventGroups::Throttle)
            {
                CJ4FD* fd = static_cast<CJ4FD*>(pContext);
                if (fd == 0)
                {
                    printf("FD pointer was null processing SimConnect event.\r\n");
                }
                else
                {

                    HandleThrottleAxis(evt);
                }
            }
        }

        if (pData->dwID == SIMCONNECT_RECV_ID::SIMCONNECT_RECV_ID_EXCEPTION)
        {
            SIMCONNECT_RECV_EXCEPTION* ex = static_cast<SIMCONNECT_RECV_EXCEPTION*>(pData);
            printf("SimConnect Exception: %d \r\n", ex->dwException);
        }
    }

    /// <summary>
    /// Handles throttle axis updates received from SimConnect.
    /// </summary>
    /// <param name="evt">A pointer to the SimConnect event structure.</param>
    static void HandleThrottleAxis(SIMCONNECT_RECV_EVENT* evt)
    {
        switch (evt->uEventID)
        {
        case ThrottleEventIDs::AxisThrottleSet:
            globalAxis = static_cast<int>(evt->dwData);
            printf("G: %d \r\n", globalAxis);

            break;
        }
    }

public:
    /// <summary>
/// Initializes the FD.
/// </summary>
/// <returns>True if successful, false otherwise.</returns>
    bool InitializeFD()
    {
        float p = 0.0012;
        float i = 0.0001;
        float d = 0.0018;
        this->throttleLeftController = new PidController(p, i, d, -2, 2);
        this->throttleRightController = new PidController(p, i, d, -2, 2);

        this->simVars = new SimVars();
        this->units = new Units();

        this->currentAxis = 0.0;
        globalAxis = 0.0;

        return this->InitializeSimConnect();
    }

    /// <summary>
    /// A callback used to update the FD at each tick.
    /// </summary>
    /// <param name="deltaTime">The time since the previous update.</param>
    /// <returns>True if successful, false otherwise.</returns>
    bool OnUpdate(double deltaTime)
    {
        simVars->setThrottleMode(1);

        SimConnect_CallDispatch(hSimConnect, HandleAxisEvent, this);
        this->currentAxis = globalAxis;

        double throttleLeverPerc = (this->currentAxis + 16384) / 32768.0;
        double throttleExp = pow(throttleLeverPerc, 3.5);
        double targetThrust = (2950 * throttleExp) + 250; // this is gross thrust (one engine)

        double grossSimThrustLeft = convertToGrossThrust(this->simVars->getThrust(1));
        double grossSimThrustRight = convertToGrossThrust(this->simVars->getThrust(2));

        double density = this->simVars->getAmbientDensity() * 1000;
        double densityFactor = 1351.6;
        double maxDensityThrust = (density * densityFactor) + 250;

        if (maxDensityThrust < 3200) {
            targetThrust = (maxDensityThrust * throttleExp);
        }

        double errorLeft = targetThrust - grossSimThrustLeft;
        double errorRight = targetThrust - grossSimThrustRight;
        double pidOutLeft = this->throttleLeftController->GetOutput(errorLeft, deltaTime);
        double pidOutRight = this->throttleRightController->GetOutput(errorRight, deltaTime);

        //static thrust* (1 + (M ^ 2) / 5) ^ 3.5
        double gThrust = convertToGrossThrust(this->simVars->getThrust(1));
        //printf("TTHR: %.0f THR: %.0f EL: %f PL: %f \r\n", targetThrust, this->simVars->getThrust(1), errorLeft, pidOutLeft);
        printf("TTHR: %.0f GTHR: %.0f @ %.0f \r\n", targetThrust, gThrust, this->simVars->getPlaneAltitude());

        EngineControlData controls;
        controls.throttleLeft = max(0, min(100, this->simVars->getThrottleLeverPosition(1) + pidOutLeft));
        controls.throttleRight = max(0, min(100, this->simVars->getThrottleLeverPosition(2) + pidOutRight));
        SimConnect_SetDataOnSimObject(this->hSimConnect, DataTypes::EngineControls, SIMCONNECT_OBJECT_ID_USER, 0, 0, sizeof(EngineControlData), &controls);

        return true;
    }

    double convertToGrossThrust(FLOAT64 thrustIn) {
        return thrustIn * pow((1 + (pow(this->simVars->getMach(), 2) / 5)), 3.5);

    }

    /// <summary>
    /// Kills the ECU.
    /// </summary>
    /// <returns>True if succesful, false otherwise.</returns>
    bool KillFD()
    {
        return SUCCEEDED(SimConnect_Close(hSimConnect));
    }

    /// <summary>
    /// Gets the current throttle axis value.
    /// </summary>
    /// <returns>The current throttle axis value.</returns>
    double getAxis()
    {
        return currentAxis;
    }

    /// <summary>
    /// Sets the current throttle axis value.
    /// </summary>
    /// <param name="val">The value to set.</param>
    void setAxis(double val)
    {
        currentAxis = val;
    }
};

CJ4FD* FDInstance;


// ------------------------
// Callbacks
extern "C" {

    MSFS_CALLBACK bool CJ4FD_gauge_callback(FsContext ctx, int service_id, void* pData)
    {
        switch (service_id)
        {
        case PANEL_SERVICE_PRE_INSTALL:
        {
            return true;
        }
        break;
        case PANEL_SERVICE_POST_INSTALL:
        {
            FDInstance = new CJ4FD();
            return FDInstance->InitializeFD();
            return true;
        }
        break;
        case PANEL_SERVICE_PRE_UPDATE:
        {
            return true;
        }
        break;
        case PANEL_SERVICE_PRE_DRAW:
        {
            sGaugeDrawData* drawData = static_cast<sGaugeDrawData*>(pData);
            return FDInstance->OnUpdate(drawData->dt);
        }
        break;
        case PANEL_SERVICE_PRE_KILL:
        {
            return true;
        }
        break;
        }
        return false;
    }

}
