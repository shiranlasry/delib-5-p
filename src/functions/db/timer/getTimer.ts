import {
    collection,
    getDocs,
    onSnapshot,
    where,
    query,
} from "@firebase/firestore";
import { Collections, RoomTimer, RoomTimerSchema, SetTimer } from "delib-npm";
import { DB } from "../config";
import { initialTimerArray } from "../../../view/pages/statement/components/rooms/admin/setTimers/SetTimersModal";
import { Unsubscribe } from "@firebase/util";
import { updateTimerSettingDB } from "./setTimer";
import { z } from "zod";
import { getSetTimerId } from "../../general/helpers";
import { setRoomTimers, setSetTimer } from "../../../model/timers/timersSlice";

export async function getSetTimersDB(
    statementId: string,
    dispatch: React.Dispatch<any>,
): Promise<SetTimer[]> {
    try {
        const timersRef = collection(DB, Collections.timers);
        const q = query(timersRef, where("statementId", "==", statementId));
        const timersDB = await getDocs(q);

        //if no timers exists, create them...
        if (timersDB.size === 0) {
            initialTimerArray.forEach(async (timer) => {
                updateTimerSettingDB({
                    statementId,
                    time: timer.time,
                    title: timer.title,
                    order: timer.order,
                    timerId: getSetTimerId(statementId, timer.order),
                });
            });
            initialTimerArray.forEach((timer) => {
                dispatch(setSetTimer(timer));
            });
            
return initialTimerArray;
        }

        const timers: SetTimer[] = timersDB.docs.map(
            (doc) => doc.data() as SetTimer,
        );
        timers.forEach((timer) => {
            dispatch(setSetTimer(timer));
        });

        return timers;
    } catch (error) {
        console.error(error);

        return initialTimerArray;
    }
}

// simple users
export function listenToRoomTimers(
    statementId: string,
    roomNumber: number | undefined,
    dispatch: React.Dispatch<any>,
): Unsubscribe {
    try {
        if (!statementId) throw new Error("Missing statementId");
        if (!roomNumber) throw new Error("Missing roomNumber");

        const timersRef = collection(DB, Collections.timersRooms);
        const q = query(
            timersRef,
            where("statementId", "==", statementId),
            where("roomNumber", "==", roomNumber),
        );

        return onSnapshot(q, (roomTimersDB) => {
            try {
                const timers: RoomTimer[] = roomTimersDB.docs.map(
                    (roomTimer) => roomTimer.data() as RoomTimer,
                );
                console.log(timers, "timers")

                z.array(RoomTimerSchema).parse(timers);

                dispatch(setRoomTimers(timers));
            } catch (error) {
                console.error(error);
                dispatch(setRoomTimers([]));
            }
        });
    } catch (error) {
        console.error(error);

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const unsub: Unsubscribe = () => {};

        return unsub;
    }
}
