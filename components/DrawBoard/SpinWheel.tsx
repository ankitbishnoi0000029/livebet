"use client";

import { useState, useMemo, useEffect } from "react";
import "./CasinoSpinWheel3D.css";

const prizes = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const colors = [
  "#EC2721",
  "#008200",
  "#EC2721",
  "#008200",
  "#EC2721",
  "#008200",
  "#EC2721",
  "#ff4c4c",
  "#444C38",
  "#16a34a",
];

interface WheelType {
  value?: number;
  spin: boolean;
  onResult?: (result: number) => void;
}

export default function CasinoSpinWheel3D({ value, spin, onResult }: WheelType) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const sliceAngle = 360 / prizes.length;

  const handleSpin = (inputValue?: number) => {
    if (spinning) return;

    const selectedIndex =
      typeof inputValue === "number"
        ? inputValue
        : Math.floor(Math.random() * prizes.length);

    setSpinning(true);

    const randomRounds = Math.floor(Math.random() * 6) + 10;
    const fullRotation = randomRounds * 360;
    const sliceCenter = selectedIndex * sliceAngle + sliceAngle / 2;

    setRotation((prev) => {
      const currentAngle = prev % 360;
      const targetAngle = 360 - sliceCenter - 110;
      return prev + fullRotation + (targetAngle - currentAngle);
    });

    setTimeout(() => {
      setSpinning(false);
      onResult?.(selectedIndex);
    }, 7200);
  };

  useEffect(() => {
    if (spin && !spinning) handleSpin(value);
  }, [spin, value]);

  const wheelBackground = useMemo(() => {
    let gradient = "conic-gradient(";
    prizes.forEach((_, i) => {
      gradient += `${colors[i]} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg,`;
    });
    return gradient.slice(0, -1) + ")";
  }, []);

  return (
    <div className="wheel-container">
      <div className="wheel-glow" />
      <div className="wheel-rim" />
      <div className="wheel-arrow" />

      <div
        className="wheel-main"
        style={{
          transform: `rotate(${rotation}deg)`,
          background: wheelBackground,
        }}
      >
        {prizes.map((p, i) => (
          <div
            key={i}
            className="wheel-number-wrapper"
            style={{ transform: `rotate(${i * sliceAngle + sliceAngle / 2}deg)` }}
          >
            <span className="wheel-number">{p}</span>
          </div>
        ))}

        <div className="wheel-gloss" />
      </div>

      <button className="wheel-button" />
    </div>
  );
}
