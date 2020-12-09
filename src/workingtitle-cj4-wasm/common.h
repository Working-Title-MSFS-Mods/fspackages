#pragma once

#ifndef _COMMON_H_
#define _COMMON_H_


#include <MSFS\MSFS.h>
#include <MSFS\MSFS_Render.h>
#include <MSFS\Legacy\gauges.h>
#include <SimConnect.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#include "SimConnectDefs.h"

#include "WtUtils.h"
#include <cassert>
#include <exception>


/// <summary>
/// The handle to the SimConnect instance.
/// </summary>
HANDLE hSimConnect;

double clamp(double v, double lo, double hi)
{
    assert(!(hi < lo));
    return (v < lo) ? lo : (hi < v) ? hi : v;
}


#endif
