// Copyright (c) Asobo Studio, All rights reserved. www.asobostudio.com

#include "cj4_fdmain.h"
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
#include "cj4_fdcontroller.cpp"

int globalThrottleAxis(0);

class CJ4FD
{
private:
    /// <summary>
    /// The handle to the SimConnect instance.
    /// </summary>
    HANDLE hSimConnect;

    /// <summary>
    /// The SimVars to use with this FADEC instance.
    /// </summary>
    SimVars* simVars;

    cj4_fdcontroller* fdctrl;

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
            globalThrottleAxis = static_cast<int>(evt->dwData);
            //printf("G: %d \r\n", globalThrottleAxis);
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
        this->simVars = new SimVars();
        globalThrottleAxis = 0.0;

        if (!this->InitializeSimConnect()) {
            return false;
        }

        this->fdctrl = new cj4_fdcontroller(this->simVars, this->hSimConnect);
        this->fdctrl->init();

        return true;
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

        this->fdctrl->update(globalThrottleAxis, deltaTime);

        return true;
    }

    /// <summary>
    /// Kills the ECU.
    /// </summary>
    /// <returns>True if succesful, false otherwise.</returns>
    bool KillFD()
    {
        return SUCCEEDED(SimConnect_Close(hSimConnect));
    }

    ///// <summary>
    ///// Gets the current throttle axis value.
    ///// </summary>
    ///// <returns>The current throttle axis value.</returns>
    //double getAxis()
    //{
    //    return currentAxis;
    //}

    ///// <summary>
    ///// Sets the current throttle axis value.
    ///// </summary>
    ///// <param name="val">The value to set.</param>
    //void setAxis(double val)
    //{
    //    currentAxis = val;
    //}
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
