"use client";

import { useState, useMemo, useEffect } from "react";
const prizes = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const colors = [
	"#EC2721", // 0
	"#008200", // 1
	"#EC2721", // 2
	"#008200", // 3
	"#EC2721", // 4
	"#008200", // 5
	"#EC2721", // 6
	"#ff4c4c", // 7
	"#444C38", // 8
	"#16a34a", // 9
];

interface WheelType {
	value?: number;
	spin: boolean;
	onResult?: (result: number) => void;
}

export default function CasinoSpinWheel3D({ value, spin ,onResult }: WheelType) {
	const [rotation, setRotation] = useState(0);
	const [spinning, setSpinning] = useState(false);
	const [result, setResult] = useState<number | null>(null);

	const sliceAngle = 360 / prizes.length;

	// 🎯 SPIN LOGIC (FIXED)
	const handleSpin = (inputValue?: number) => { // 👈 Accept value as parameter
		if (spinning) return;

		const hasInput =
			typeof inputValue === "number" &&
			inputValue >= 0 &&
			inputValue < prizes.length;

		const selectedIndex = hasInput
			? inputValue
			: Math.floor(Math.random() * prizes.length);

		setSpinning(true);
		setResult(null);

		const randomRounds = Math.floor(Math.random() * 6) + 10;
		const fullRotation = randomRounds * 360;

		const sliceCenter = selectedIndex * sliceAngle + sliceAngle / 2;

		setRotation((prev) => {
			const currentAngle = prev % 360;
			const targetAngle = 360 - sliceCenter - 110;
			return prev + fullRotation + (targetAngle - currentAngle);
		});

		setTimeout(() => {
			setResult(selectedIndex);
			setSpinning(false);
			// console.log("🎯 Result:", selectedIndex);
			if (onResult) {
				onResult(selectedIndex);
			}
		}, 7200);
	};

	useEffect(() => {
		if (!spin || spinning) return;

		setSpinning(true);
		handleSpin(value); // 👈 Pass value directly to handleSpin

		// console.log("reddux", value);
	}, [spin, value]);

	// 🎨 Wheel gradient
	const wheelBackground = useMemo(() => {
		let gradient = "conic-gradient(";
		prizes.forEach((_, i) => {
			const start = i * sliceAngle;
			const end = start + sliceAngle;
			gradient += `${colors[i]} ${start}deg ${end}deg,`;
		});
		return gradient.slice(0, -1) + ")";
	}, []);

	return (
		<>
			{/* WHEEL CONTAINER */}
			<div
				className='
          relative
          w-[120px] h-[120px]
          md:w-[180px] md:h-[180px]
          lg:w-[280px] lg:h-[280px]
		    2xl:min-w-[280px] 2xl:min-h-[280px] mx-2
        '>
				{/* GLOW RING */}
				<div
					className='absolute inset-0 rounded-full
          bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600
          blur-lg opacity-40'
				/>

				{/* OUTER METAL RIM */}
				<div
					className='absolute inset-0 rounded-full bg-amber-400
          shadow-[0_20px_40px_rgba(0,0,0,0.9)]'
				/>

				{/* TOP ARROW */}
				<div
					className='
          absolute -top-4 md:-top-5 lg:-top-1 rotate-[60deg]
          left-1/2 -translate-x-1/2 z-50
          w-0 h-0
          border-l-[6px] md:border-l-[8px] lg:border-l-[10px]
          border-r-[6px] md:border-r-[8px] lg:border-r-[10px]
          border-b-[12px] md:border-b-[16px] lg:border-b-[18px]
          border-transparent border-b-[#FFD700]
          drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]
        '
				/>

				{/* MAIN WHEEL */}
				<div
					className='
          absolute
          inset-[5px] md:inset-[10px] lg:inset-[12px]
          rounded-full
          transition-transform duration-[7000ms] ease-out
          shadow-[inset_0_10px_18px_rgba(255,255,255,0.25),
          inset_0_-14px_22px_rgba(0,0,0,0.9)]
        '
					style={{
						transform: `rotate(${rotation}deg)`,
						background: wheelBackground,
					}}>
					{/* NUMBERS */}
					{prizes.map((p, i) => (
						<div
							key={i}
							className='absolute inset-0 flex justify-center'
							style={{
								transform: `rotate(${i * sliceAngle + sliceAngle / 2}deg)`,
							}}>
							<span
								className='
                mt-3 md:mt-4 lg:mt-5
                text-[10px] md:text-sm lg:text-2xl
                font-extrabold 
                drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]
              '
								style={{ transform: "rotate(103deg)" }}>
								{p}
							</span>
						</div>
					))}

					{/* GLOSS SHINE */}
					<div
						className='absolute inset-0 rounded-full
            bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)]'
					/>
				</div>
				<button
					className='
    group absolute inset-0 m-auto z-50
    w-10 h-10 rounded-full sm:w-10 sm:h-10
    bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600
    border border-yellow-300/80
    backdrop-blur-md
    transition-all duration-300
    hover:shadow-yellow-500/50
    active:scale-95
	md:w-16 md:h-16
  '>
					{/* Glass shine */}
					<span
						className='
      pointer-events-none absolute inset-0 rounded-full
      bg-gradient-to-tr from-white/50 via-white/10 to-transparent
      opacity-70
      group-hover:opacity-90
      transition-opacity
    '
					/>

					{/* Inner glow ring */}
					<span
						className='
      pointer-events-none absolute inset-1 rounded-full
      bg-gradient-to-br from-yellow-300/40 to-yellow-600/40
      blur-sm
    '
					/>

					{/* Button text / icon */}
					<span className='relative text-2xl font-extrabold text-yellow-900 drop-shadow-md'></span>
				</button>
			</div>
		</>
	);

	// return (
	//   // <div className="">
	//   //   {/* INPUT */}
	//   //   {/* <input
	//   //     value={input}
	//   //     onChange={(e) => setInput(Number(e.target.value))}
	//   //     className="px-5 py-2 rounded-full bg-white/90 text-black text-lg
	//   // shadow-[0_0_25px_rgba(255,200,0,0.6)] outline-none"
	//   //     placeholder="0 - 9"
	//   //   /> */}

	//   //   {/* WHEEL CONTAINER */}
	//   //   <div className="relative w-[380px] h-[380px]">
	//   //     {/* GLOW RING */}
	//   //     <div
	//   //       className="absolute inset-0 rounded-full
	//   //   bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600
	//   //   blur-xl opacity-40"
	//   //     />

	//   //     {/* OUTER METAL RIM */}
	//   //     <div
	//   //       className="absolute inset-0 rounded-full
	//   //   bg-gradient-to-br from-zinc-700 via-zinc-900 to-black
	//   //   shadow-[0_25px_50px_rgba(0,0,0,0.9)]"
	//   //     />

	//   //     {/* TOP ARROW */}
	//   //     <div
	//   //       className="absolute -top-7 left-1/2 -translate-x-1/2 z-50
	//   //   w-0 h-0 border-l-[16px] border-r-[16px] border-b-[30px]
	//   //   border-transparent border-b-yellow-400
	//   //   drop-shadow-[0_6px_8px_rgba(0,0,0,0.9)]"
	//   //     />

	//   //     {/* MAIN WHEEL */}
	//   //     <div
	//   //       className="absolute inset-[18px] rounded-full
	//   //   transition-transform duration-[7000ms] ease-out
	//   //   shadow-[inset_0_18px_28px_rgba(255,255,255,0.25),
	//   //   inset_0_-20px_30px_rgba(0,0,0,0.9)]"
	//   //       style={{
	//   //         transform: `rotate(${rotation}deg)`,
	//   //         background: wheelBackground,
	//   //       }}
	//   //     >
	//   //       {/* NUMBERS */}
	//   //       {prizes.map((p, i) => (
	//   //         <div
	//   //           key={i}
	//   //           className="absolute inset-0 flex justify-center"
	//   //           style={{
	//   //             transform: `rotate(${i * sliceAngle + sliceAngle / 2}deg)`,
	//   //           }}
	//   //         >
	//   //           <span
	//   //             className="mt-6 text-lg font-extrabold text-black
	//   //         drop-shadow-[0_2px_2px_rgba(255,255,255,0.6)]"
	//   //             style={{ transform: "rotate(105deg)" }}
	//   //           >
	//   //             {p}
	//   //           </span>
	//   //         </div>
	//   //       ))}

	//   //       {/* GLOSS SHINE */}
	//   //       <div
	//   //         className="absolute inset-0 rounded-full
	//   //     bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_60%)]"
	//   //       />
	//   //     </div>

	//   //     {/* CENTER BUTTON */}
	//   //     <button
	//   //       onClick={spin}
	//   //       className="absolute inset-0 m-auto z-50
	//   //   w-24 h-24 rounded-full
	//   //   bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600
	//   //   border-4 border-yellow-500
	//   //   shadow-[0_10px_30px_rgba(0,0,0,0.9),
	//   //   inset_0_6px_10px_rgba(255,255,255,0.5)]
	//   //   active:scale-95 transition"
	//   //     >
	//   //       <span className="text-2xl font-extrabold text-yellow-900 drop-shadow">
	//   //         SPIN
	//   //       </span>
	//   //     </button>
	//   //   </div>

	//   //   {/* RESULT */}
	//   //   {/* {result !== null && (
	//   //     <div className="text-yellow-400 text-2xl font-bold drop-shadow-lg">
	//   //       🎯 Result: {result}
	//   //     </div>
	//   //   )} */}
	//   // </div>
	// );
}
