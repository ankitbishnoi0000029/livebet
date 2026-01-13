"use client";
import React, { useEffect, useState, useCallback } from "react";
import CasinoSpinWheel3D from "../DrawBoard/SpinWheel";
import { io, Socket } from 'socket.io-client';
import { useRouter } from "next/navigation";
import { insertHistory } from "@/lib/dbWrk";

type WheelKey = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";
type SelectionType = "numeric" | "image" | "mixed";

interface GameState {
  isActive: boolean;
  timeUntilStart?: number;
  timeUntilEnd?: number;
  currentRound?: number;
  roundTimeLeft?: number;
  nextGameStart?: Date;
  currentResults?: Record<WheelKey, number | null>;
}

export const GameLayout = () => {
	const INITIAL_TIME = 15; // seconds
	const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

	const [time, setTime] = useState<number>(INITIAL_TIME);
	const [spinner, setSpinner] = useState(false);
	const [isWaiting, setIsWaiting] = useState(false);
	const [a1, setA1] = useState<number | undefined>(undefined);
	const [a2, setA2] = useState<number | undefined>(undefined);
	const [b1, setB1] = useState<number | undefined>(undefined);
	const [b2, setB2] = useState<number | undefined>(undefined);
	const [c1, setC1] = useState<number | undefined>(undefined);
	const [c2, setC2] = useState<number | undefined>(undefined);
	const [results, setResults] = useState<Record<WheelKey, number | null>>({
		a1: null,
		a2: null,
		b1: null,
		b2: null,
		c1: null,
		c2: null,
	});
	const [socket, setSocket] = useState<Socket | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [currentRound, setCurrentRound] = useState<number>(1);
	const [roundTimeLeft, setRoundTimeLeft] = useState<number>(15 * 60); // 2 minutes in seconds
	const [isGameActive, setIsGameActive] = useState<boolean>(false);
	const [gameClosed, setGameClosed] = useState<boolean>(false);
	const [timeUntilNextGame, setTimeUntilNextGame] = useState<number>(0);
	const [nextGameStart, setNextGameStart] = useState<Date | null>(null);
	const [selectionType, setSelectionType] = useState<SelectionType>("numeric");
	const [token,setToken] = useState<string>();
	const [imageSelections, setImageSelections] = useState<Record<WheelKey, string>>({
		a1: "", a2: "", b1: "", b2: "", c1: "", c2: ""
	});
	const [gameMode, setGameMode] = useState<"numeric" | "image" | "mixed">("numeric");
	const [serverWheelValues, setServerWheelValues] = useState<Record<WheelKey, number | null>>({
		a1: null, a2: null, b1: null, b2: null, c1: null, c2: null
	});
    const route = useRouter()

	useEffect(() => {
		const storedToken = sessionStorage.getItem("token");
		if (storedToken !== token) {
			setToken(storedToken ?? '');
		}
	}, [token]);

	// Convert seconds → minutes & seconds
	const getMinutesAndSeconds = (timeLeft: number) => {
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;
		return { minutes, seconds };
	};

	// Remove old countdown logic - now handled by server sync

	// Handle wheel result callbacks
	const handleWheelResult = useCallback((wheelKey: WheelKey) => (result: number) => {
		setResults(prev => ({
			...prev,
			[wheelKey]: result
		}));

		// Emit result to server
		if (socket) {
			socket.emit('wheel-result', { wheel: wheelKey, result });
		}
	}, [socket]);

	// Initialize socket connection
	const initializeSocket = useCallback(() => {
		const socketConnection = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000', {
			path: '/api/socket'
		});

		setSocket(socketConnection);
		return socketConnection;
	}, []);

	useEffect(() => {
		const socketConnection = initializeSocket();

		// Handle connection
		socketConnection.on('connect', () => {
			console.log('Connected to game server');
		});

		// Handle game state updates - sync all users to same state
		socketConnection.on('game-state', (data) => {
			setGameState(data);
			setIsGameActive(data.isActive);
			setGameClosed(!data.isActive);

			if (data.isActive) {
				setCurrentRound(data.currentRound || 1);
				setRoundTimeLeft(data.roundTimeLeft || 15 * 60);
			} else {
				setTimeUntilNextGame(data.timeUntilStart || 0); // Already in seconds
				setNextGameStart(data.nextGameStart || null);
			}

			// Sync current results
			if (data.currentResults) {
				setResults(data.currentResults);
				
			}
		});

		// Handle timer updates
		socketConnection.on('game-timer', (data) => {
			setRoundTimeLeft(data.roundTimeLeft || data.timeLeft);
			setCurrentRound(data.roundNumber || 1);

			// Check if game state is changing
			const wasGameActive = isGameActive;
			setIsGameActive(data.isActive);

			// Only set gameClosed if game state is changing, not on every timer update
			if (data.isActive !== wasGameActive) {
				setGameClosed(data.gameClosed || !data.isActive);
			}
		});

		// Handle game closure
		socketConnection.on('game-closed', (data) => {
			setGameClosed(true);
			setIsGameActive(false);
			setTimeUntilNextGame(data.timeUntilNextGame);
			setNextGameStart(new Date(data.nextGameStart));
		});

		// Handle round start
		socketConnection.on('round-start', (data) => {
			setCurrentRound(data.roundNumber);
			setRoundTimeLeft(data.duration);
			setSpinner(false);
			setIsWaiting(false);

			// Update server wheel values for synchronized spinning
			if (data.wheelValues) {
				setServerWheelValues(data.wheelValues);
				// console.log('Server wheel values updated:', data.wheelValues);
			}

			// Clear previous results
			setResults({
				a1: null, a2: null, b1: null, b2: null, c1: null, c2: null
			});
		});

		// Handle wheel results from server
		socketConnection.on('wheel-result', (data) => {
			setResults(prev => ({
				...prev,
				[data.wheel]: data.result
			}));
		});

		// Handle game results
		socketConnection.on('game-result', (data) => {
			setResults(prev => ({
				...prev,
				...data.results
			}));
		});

		// Handle wheel values updates from other users
		socketConnection.on('wheel-values-update', (data) => {
			// console.log('Wheel values updated from server:', data);
			setServerWheelValues(data.wheelValues);
		});

		// Handle round saved
		socketConnection.on('round-saved', (data) => {
			if (data.success) {
				// Trigger save selections when round is saved
			insertHistory({round_start_time:currentRound,a1:serverWheelValues.a1,a2:serverWheelValues.a2,b1:serverWheelValues.b1,b2:serverWheelValues.b2,c1:serverWheelValues.c1,c2:serverWheelValues.c2})
				
			}
		});

		return () => {
			socketConnection.disconnect();
		};
	}, []);

	// Send user selections to server
	useEffect(() => {
		if (socket && (a1 !== undefined || a2 !== undefined || b1 !== undefined || b2 !== undefined || c1 !== undefined || c2 !== undefined)) {
			socket.emit('user-selection', {
				a1, a2, b1, b2, c1, c2,
				timestamp: Date.now()
			});
		}
	}, [socket, a1, a2, b1, b2, c1, c2]);

	// Trigger save when 30 seconds before round end
	useEffect(() => {
		if (socket && roundTimeLeft === 30 && isGameActive) { // 30 seconds before round end
			socket.emit('save-round', { roundNumber: currentRound });
		}
	}, [socket, roundTimeLeft, currentRound, isGameActive]);

	// Trigger spin when 30 seconds left in round
	const handleSpinTrigger = useCallback(() => {
		if (roundTimeLeft === 30 && isGameActive && !spinner && !isWaiting) {
			setSpinner(true);
			setIsWaiting(true);

			// Wait for spin animation, show results until round ends
			setTimeout(() => {
				setSpinner(false);
				// Keep isWaiting true to show results until round ends
				if (socket) {
					socket.emit('round-complete', { roundNumber: currentRound });
				}
				// isWaiting will be reset by next round-start
			}, 7200); // 7.2 seconds for spin animation (matches SpinWheel duration)
		}
	}, [roundTimeLeft, isGameActive, spinner, isWaiting, socket, currentRound]);

	useEffect(() => {
		handleSpinTrigger();
	}, [handleSpinTrigger]);

	// Update countdown timer for game closed state
	useEffect(() => {
		if (gameClosed && timeUntilNextGame > 0) {
			const interval = setInterval(() => {
				setTimeUntilNextGame(prev => {
					if (prev <= 1) {
						// When countdown reaches 0, refresh from server
						if (socket) {
							socket.emit('get-game-state');
						}
						return 0;
					}
					return prev - 1;
				});
				sessionStorage.removeItem('token')
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [gameClosed, timeUntilNextGame, socket]);



	const { minutes, seconds } = getMinutesAndSeconds(isGameActive ? roundTimeLeft : timeUntilNextGame);

	// Render select dropdown for wheel input
	const renderSelect = (value: number | undefined, onChange: (val: number | undefined) => void) => (
		<select
			value={value ?? ''}
			onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
			disabled={spinner}
			className='
				w-5 h-6
				sm:w-6 sm:h-9
				md:w-11 md:h-14
				text-center
				text-xs sm:text-sm md:text-xl
				font-extrabold
				text-yellow-300
				bg-gradient-to-b from-black to-zinc-900
				rounded-md
				border border-yellow-500/70
				shadow-[inset_0_0_8px_rgba(255,215,0,0.3)]
				focus:outline-none
				disabled:opacity-50 disabled:cursor-not-allowed
			'>
			<option value='' className='bg-black text-yellow-300'>X</option>
			{digits.map((d) => (
				<option key={d} value={d} className='bg-black text-yellow-300'>
					{d}
				</option>
			))}
		</select>
	);

	// Render wheel section (A, B, or C)
	const renderWheelSection = (
		label: string,
		wheel1Value: number | undefined,
		wheel2Value: number | undefined,
		setWheel1: (val: number | undefined) => void,
		setWheel2: (val: number | undefined) => void,
		wheelKey1: WheelKey,
		wheelKey2: WheelKey
	) => (
		<div className='relative rounded-2xl border border-indigo-500/40 bg-white/5 backdrop-blur-md px-6 pt-1.5 shadow-xl'>
			<span className='absolute -top-4 px-4 py-1 left-[45%] rounded-full bg-indigo-100 text-black lg:text-lg md:text-md font-bold tracking-wider'>
				{label}
			</span>

			<div className='grid grid-cols-2 gap-40 place-items-center relative'>
				<CasinoSpinWheel3D
					onResult={handleWheelResult(wheelKey1)}
					value={wheel1Value}
					spin={spinner}
				/>
				<CasinoSpinWheel3D
					onResult={handleWheelResult(wheelKey2)}
					value={wheel2Value}
					spin={spinner}
				/>

				{token && (
					<div className='absolute bottom-0.5'>
						<div className='relative w-full flex flex-col items-center gap-0.5 rounded-xl bg-black/60 backdrop-blur-md border border-yellow-400/50 px-1 py-1 sm:px-2 sm:py-3 shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-20'>
							<div className='absolute -inset-0.5 rounded-xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 opacity-30 blur-sm' />
							<div className='flex gap-1 z-20'>
								{renderSelect(wheel1Value, setWheel1)}
								{renderSelect(wheel2Value, setWheel2)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);

	// Show game closed overlay if game is closed
	if (gameClosed) {
		const nextGameTime = (nextGameStart && nextGameStart instanceof Date && !isNaN(nextGameStart.getTime()))
			? nextGameStart.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			})
			: '9:00 AM';
		return (
			<section className='min-h-screen w-full bg-gradient-to-br from-[#010341] via-[#050434] to-[#00064c] text-white p-6 relative overflow-hidden flex items-center justify-center'>
				<div className='text-center space-y-8'>
					<div className='text-8xl mb-4'>🌙</div>
					<h1 className='text-4xl font-bold text-yellow-300 mb-4'>Game Closed</h1>
					<p className='text-xl text-gray-300 mb-8'>The game is currently closed. Next game starts tomorrow at {nextGameTime}.</p>

					<div className='bg-black/40 rounded-2xl p-6 backdrop-blur-md border border-yellow-400/30'>
						<p className='text-lg font-semibold mb-4'>Next Game Countdown</p>
						<div className='flex justify-center gap-8 text-center'>
							<div className='bg-indigo-700/50 rounded-xl px-6 py-4'>
								<p className='text-3xl font-bold text-yellow-300'>{Math.floor(timeUntilNextGame / 3600)}</p>
								<p className='text-sm text-gray-300'>Hours</p>
							</div>
							<div className='bg-indigo-700/50 rounded-xl px-6 py-4'>
								<p className='text-3xl font-bold text-yellow-300'>{Math.floor((timeUntilNextGame % 3600) / 60)}</p>
								<p className='text-sm text-gray-300'>Minutes</p>
							</div>
							<div className='bg-indigo-700/50 rounded-xl px-6 py-4'>
								<p className='text-3xl font-bold text-yellow-300'>{timeUntilNextGame % 60}</p>
								<p className='text-sm text-gray-300'>Seconds</p>
							</div>
						</div>
					</div>

					<p className='text-sm text-gray-400 mt-8'>Please check back tomorrow for the next game session.</p>
				</div>
			</section>
		);
	}

	return (
		<section className='min-h-screen w-full bg-gradient-to-br from-[#010341] via-[#050434] to-[#00064c] text-white p-6 relative overflow-hidden'>
			<div className='flex justify-center pt-10 md:p-0'>
				<div className='max-w-fit w-full grid grid-cols-1 lg:grid-cols-2 md:grid-cols-2 gap-12'>
					{/* LEFT SIDE – WHEELS */}
					<div className='space-y-5'>
						{renderWheelSection('A', serverWheelValues.a1 ?? undefined, serverWheelValues.a2 ?? undefined, setA1, setA2, 'a1', 'a2')}
						{renderWheelSection('B', serverWheelValues.b1 ?? undefined, serverWheelValues.b2 ?? undefined, setB1, setB2, 'b1', 'b2')}
						{renderWheelSection('C', serverWheelValues.c1 ?? undefined, serverWheelValues.c2 ?? undefined, setC1, setC2, 'c1', 'c2')}
					</div>

					{/* RIGHT SIDE – INFO PANEL */}
					<div className='flex flex-col justify-center items-center text-center space-y-8'>
						{/* GAME TIMING */}
						<div className='w-full max-w-md rounded-2xl border border-pink-400/40 bg-white/5 backdrop-blur-md px-6 py-4 text-center shadow-[0_10px_40px_rgba(0,0,0,0.6)]'>
							<p className='text-xs font-semibold tracking-[0.25em] text-pink-400 mb-2'>GAME RESULT TIMING</p>
							<div className='flex items-center justify-center gap-3'>
								<span className='px-4 py-1 rounded-lg bg-black/40 text-yellow-300 font-bold text-sm'>09:00 AM</span>
								<span className='text-gray-300 text-xs font-medium'>TO</span>
								<span className='px-4 py-1 rounded-lg bg-black/40 text-yellow-300 font-bold text-sm'>09:00 PM</span>
							</div>
						</div>

						{/* DRAW TIMER */}
						<div className='w-full max-w-md rounded-2xl border border-yellow-400/70 bg-black/40 p-6 shadow-2xl'>
							<p className='text-lg font-semibold mb-5 tracking-wide'>Results On Time</p>
							{!isWaiting ? (
								<div className='grid grid-cols-2 gap-4'>
									<div className='rounded-xl bg-gradient-to-br from-indigo-700/50 to-indigo-900/50 py-4 shadow-lg'>
										<p className='text-4xl font-bold text-yellow-300'>{minutes}</p>
										<p className='text-xs uppercase tracking-wider text-gray-300 mt-1'>Minute</p>
									</div>
									<div className='rounded-xl bg-gradient-to-br from-indigo-700/50 to-indigo-900/50 py-4 shadow-lg'>
										<p className='text-4xl font-bold text-yellow-300'>{seconds}</p>
										<p className='text-xs uppercase tracking-wider text-gray-300 mt-1'>Second</p>
									</div>
								</div>
							) : (
								<div className='grid grid-cols-1 place-items-center gap-4'>
									<div className='relative w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700/40 via-indigo-800/40 to-indigo-900/50 p-6 shadow-2xl backdrop-blur-md border border-indigo-400/30'>
										<div className='absolute inset-0 -z-10 animate-pulse bg-indigo-500/10 blur-2xl' />
										<div className='flex justify-center mb-4'>
											<div className='h-14 w-14 rounded-full border-4 border-indigo-300/30 border-t-indigo-400 animate-spin' />
										</div>
										<h1 className='text-center text-lg font-semibold text-indigo-100 tracking-wide'>Please wait</h1>
										<div className='mt-1 flex justify-center space-x-1 text-indigo-300 text-xl'>
											<span className='animate-bounce [animation-delay:0ms]'>.</span>
											<span className='animate-bounce [animation-delay:150ms]'>.</span>
											<span className='animate-bounce [animation-delay:300ms]'>.</span>
										</div>
										<p className='mt-3 text-center text-sm text-indigo-300/80'>Preparing next round</p>
									</div>
								</div>
							)}
						</div>

						{/* RESULTS DISPLAY */}
						<div
							className="group relative w-full max-w-md cursor-pointer"
							onClick={() => route.push('/history')}
						>
							<div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 opacity-40 blur transition duration-500 group-hover:opacity-90 group-hover:blur-md animate-pulse" />
							<div className="relative rounded-2xl border border-yellow-400/60 bg-black/60 p-6 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-yellow-500/40">
								<p className="text-center text-lg font-semibold tracking-wider text-yellow-300 transition-all duration-300 group-hover:text-yellow-400">
									Result
								</p>
								<p className="mt-2 text-center text-md text-gray-400 group-hover:text-gray-300">
									Old Result Click here
								</p>

								<div className="mt-6">
									{!Object.values(results).some((result) => result !== null) ? (
										<div className="text-center py-8">
											<div className="text-5xl mb-3">🎡</div>
											<p className="text-gray-500 text-sm">Waiting for results...</p>
										</div>
									) : (
										<div className="grid grid-cols-3 gap-4">
											{['A', 'B', 'C'].map((label, idx) => {
												const key1 = `${label.toLowerCase()}1` as WheelKey;
												const key2 = `${label.toLowerCase()}2` as WheelKey;
												return (
													<div key={label} className="rounded-xl border border-yellow-400/30 bg-black/40 p-4 backdrop-blur-sm">
														<div className="text-center">
															<div className="text-7xl font-semibold text-gray-100 mb-2">{label}</div>
															<div className="text-4xl font-bold text-yellow-300">
																{results[key1] !== null ? results[key1] : '—'}
																{results[key2] !== null ? results[key2] : '—'}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
