
import { DirectTo } from './flightplanning/DirectTo';
import { FlightPlanManager } from './flightplanning/FlightPlanManager';
import { FlightPlanSegment } from './flightplanning/FlightPlanSegment';
import { GPS } from './flightplanning/GPS';
import { HoldDetails, HoldTurnDirection } from './flightplanning/HoldDetails';
import { LegsProcedure } from './flightplanning/LegsProcedure';
import { ManagedFlightPlan } from './flightplanning/ManagedFlightPlan';
import { ProcedureDetails } from './flightplanning/ProcedureDetails';
import { RawDataMapper } from './flightplanning/RawDataMapper';
import { Message } from './messages/Message';
import { MessageController } from './messages/MessageController';
import { CJ4_FMC_MessageController } from './cj4/CJ4_FMC_MessageController';
import { CJ4_FMC_MsgPage } from './cj4/ui/fmc/pages/CJ4_FMC_MsgPage';

export { DirectTo, FlightPlanManager, FlightPlanSegment, GPS, LegsProcedure, ManagedFlightPlan, ProcedureDetails, RawDataMapper, HoldDetails, HoldTurnDirection, Message, MessageController, CJ4_FMC_MessageController, CJ4_FMC_MsgPage }

// export {};

// declare global {
//   interface Window {
//     MyTest: any;
//   }
// }