"use client";

import React, { useEffect, useState, useCallback } from "react";
import "./GameLayout.css";
import CasinoSpinWheel3D from "../DrawBoard/SpinWheel";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { insertHistory } from "@/lib/dbWrk";

type WheelKey = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export const GameLayout = () => {
  const INITIAL_TIME = 15;
  const digits = [0,1,2,3,4,5,6,7,8,9];

  const [spinner, setSpinner] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roundTimeLeft, setRoundTimeLeft] = useState(INITIAL_TIME * 60);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameClosed, setGameClosed] = useState(false);

  const [results, setResults] = useState<Record<WheelKey, number | null>>({
    a1:null,a2:null,b1:null,b2:null,c1:null,c2:null
  });

  const [serverWheelValues, setServerWheelValues] = useState<Record<WheelKey, number | null>>({
    a1:null,a2:null,b1:null,b2:null,c1:null,c2:null
  });

  const router = useRouter();

  const getTime = (t:number) => ({
    minutes: Math.floor(t / 60),
    seconds: t % 60
  });

  const handleWheelResult = useCallback(
    (key: WheelKey) => (result: number) => {
      setResults(p => ({ ...p, [key]: result }));
      socket?.emit("wheel-result", { wheel: key, result });
    },
    [socket]
  );

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000", {
      path: "/api/socket",
    });

    setSocket(s);

    s.on("game-state", (d:any) => {
      setIsGameActive(d.isActive);
      setGameClosed(!d.isActive);
      if (d.roundTimeLeft) setRoundTimeLeft(d.roundTimeLeft);
      if (d.currentResults) setResults(d.currentResults);
    });

    s.on("game-timer", (d:any) => {
      setRoundTimeLeft(d.roundTimeLeft);
      setIsGameActive(d.isActive);
    });

    s.on("wheel-values-update", (d:any) => {
      setServerWheelValues(d.wheelValues);
    });

    return () => s.disconnect();
  }, []);

  const { minutes, seconds } = getTime(roundTimeLeft);

  const renderSelect = () => (
    <select className="select-box" disabled={spinner}>
      <option value="">X</option>
      {digits.map(d => <option key={d}>{d}</option>)}
    </select>
  );

  const renderWheel = (label:string, k1:WheelKey, k2:WheelKey) => (
    <div className="wheel-wrapper">
      <span className="wheel-title">{label}</span>

      <div className="wheel-grid">
        <CasinoSpinWheel3D
          spin={spinner}
          value={serverWheelValues[k1] ?? undefined}
          onResult={handleWheelResult(k1)}
        />
        <CasinoSpinWheel3D
          spin={spinner}
          value={serverWheelValues[k2] ?? undefined}
          onResult={handleWheelResult(k2)}
        />

        <div className="wheel-select-container">
          {renderSelect()}
          {renderSelect()}
        </div>
      </div>
    </div>
  );

  return (
    <section className="game-screen">
      <div className="game-container">

        {/* LEFT SIDE */}
        <div className="left-panel">
          {renderWheel("A","a1","a2")}
          {renderWheel("B","b1","b2")}
          {renderWheel("C","c1","c2")}
        </div>

        {/* RIGHT SIDE */}
        <div className="right-panel">

          {/* 9 TO 9 PANEL */}
          <div className="time-range-box">
            <p className="time-range-title">GAME RESULT TIMING</p>
            <div className="time-range">
              <span>09:00 AM</span>
              <span className="to">TO</span>
              <span>09:00 PM</span>
            </div>
          </div>

          {/* TIMER */}
          <div className="timer-box">
            <p className="timer-heading result-title">Results On Time</p>

            {!isWaiting ? (
              <div className="timer-grid">
                <div className="timer-card">
                  <p>{minutes}</p>
                  <span>Minute</span>
                </div>
                <div className="timer-card">
                  <p>{seconds}</p>
                  <span>Second</span>
                </div>
              </div>
            ) : (
              <div className="waiting-box">
                <div className="spinner-circle"></div>
                <p>Please wait...</p>
              </div>
            )}
          </div>

          {/* RESULT */}
          <div className="result-box" onClick={()=>router.push("/history")}>
            <p className="result-title">Result</p>
            <p className="result-sub">Old Result Click here</p>

            <div className="result-grid">
              {["A","B","C"].map(l => {
                const k1 = `${l.toLowerCase()}1` as WheelKey;
                const k2 = `${l.toLowerCase()}2` as WheelKey;
                return (
                  <div key={l} className="result-card">
                    <div className="result-label">{l}</div>
                    <div className="result-value">
                      {results[k1] ?? "—"}{results[k2] ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
