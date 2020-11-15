#pragma once


#ifndef FDGAUGE
#define FDGAUGE

#ifndef __INTELLISENSE__
#	define MODULE_EXPORT __attribute__( ( visibility( "default" ) ) )
#	define MODULE_WASM_MODNAME(mod) __attribute__((import_module(mod)))
#else
#	define MODULE_EXPORT
#	define MODULE_WASM_MODNAME(mod)
#	define __attribute__(x)
#	define __restrict__
#endif

#include "common.h"
#include "FdController.h"

int globalThrottleAxis[2] {-16384, -16384};

class FdGauge
{
private:
    /// <summary>
    /// Registers all the throttle SimConnect client events.
    /// </summary>
    void RegisterThrottleClientEvents()
    {
        printf("Registering throttle events...\r\n");

        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottleSet, "THROTTLE_AXIS_SET_EX1");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottle1Set, "THROTTLE1_AXIS_SET_EX1");
        SimConnect_MapClientEventToSimEvent(hSimConnect, ThrottleEventIDs::AxisThrottle2Set, "THROTTLE2_AXIS_SET_EX1");
    }

    /// <summary>
    /// Registers the SimConnect throttle event group for capture.
    /// </summary>
    void RegisterThrottleEventGroup()
    {
        printf("Registering throttle event group...\r\n");

        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottleSet, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottle1Set, TRUE);
        SimConnect_AddClientEventToNotificationGroup(hSimConnect, EventGroups::Throttle, ThrottleEventIDs::AxisThrottle2Set, TRUE);
        SimConnect_SetNotificationGroupPriority(hSimConnect, EventGroups::Throttle, SIMCONNECT_GROUP_PRIORITY_HIGHEST_MASKABLE);
    }

    /// <summary>
    /// Initializes the ECU connection to SimConnect.
    /// </summary>
    /// <returns>True if successful, false otherwise.</returns>
    bool InitializeSimConnect()
    {
        printf("Connecting to SimConnect...\r\n");
        if (SUCCEEDED(SimConnect_Open(&hSimConnect, "FdGauge", nullptr, 0, 0, 0)))
        {
            printf("SimConnect connected.\r\n");

            this->RegisterThrottleClientEvents();
            this->RegisterThrottleEventGroup();

            SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG THROTTLE LEVER POSITION:1", "Percent");
            SimConnect_AddToDataDefinition(hSimConnect, DataTypes::EngineControls, "GENERAL ENG THROTTLE LEVER POSITION:2", "Percent");

            printf("SimConnect registrations complete.\r\n");
            return true;
        }

        printf("SimConnect failed.\r\n");

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
                FdGauge* fd = static_cast<FdGauge*>(pContext);
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
            globalThrottleAxis[0] = static_cast<int>(evt->dwData);
            globalThrottleAxis[1] = static_cast<int>(evt->dwData);
            break;
        case ThrottleEventIDs :: AxisThrottle1Set:
            globalThrottleAxis[0] = static_cast<int>(evt->dwData);
            break;
        case ThrottleEventIDs::AxisThrottle2Set:
            globalThrottleAxis[1] = static_cast<int>(evt->dwData);
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
        if (!this->InitializeSimConnect()) {
            printf("Init SimConnect failed");
            return false;
        }

        FdCtrlInstance.init();

        return true;
    }

    /// <summary>
    /// A callback used to update the FD at each tick.
    /// </summary>
    /// <param name="deltaTime">The time since the previous update.</param>
    /// <returns>True if successful, false otherwise.</returns>
    bool OnUpdate(double deltaTime)
    {
        SimConnect_CallDispatch(hSimConnect, HandleAxisEvent, this);

        FdCtrlInstance.update(globalThrottleAxis, deltaTime);

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
};

#endif // !FDGAUGE
