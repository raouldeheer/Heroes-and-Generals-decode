const electron = window.require("electron");
import { useEffect, useState } from "react";
import { WarmapEventHandler } from "./warmap";

const pointSize = 15;

interface Battlefield {
    id: string;
    mapid: string;
    bftitle: string;
    sector: string;
    posx: number;
    posy: number;
    gamemap: string;
    rotation?: number;
}

interface battlefieldstatus {
    id: string;
    warid: string;
    battlefieldid: string;
    factionid: string;
    color: string;
}

const BattlefieldPoint = ({
    battlefieldId,
    battlefields,
    warmapEventHandler
}: {
    battlefieldId: string;
    battlefields: Map<string, Battlefield>;
    warmapEventHandler: WarmapEventHandler;
}): JSX.Element => {
    const bfdata: Battlefield = battlefields.get(battlefieldId);
    const [color, setColor] = useState("#888");

    useEffect(() => {
        warmapEventHandler.on(`battlefield${battlefieldId}`, (data: battlefieldstatus) => {
            // console.log(data.color);
            setColor(data.color);
        });
    }, []);

    // function clicked(e: { preventDefault: () => void; }) {
    //     e.preventDefault();
    //     setCount(1);
    //     console.log(`You clicked on: ${battlefieldId}`);
    // }
    return <circle style={{ cursor: "pointer" }}
        cx={bfdata.posx}
        cy={bfdata.posy}
        r={pointSize}
        stroke="black"
        strokeWidth="2"
        fill={color}
        // onClick={clicked}
         />;
};

export default BattlefieldPoint;
