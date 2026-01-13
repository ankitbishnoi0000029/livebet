'use client';

import React, { useState, useTransition } from "react";
import { Lock, Phone, Eye, EyeOff } from "lucide-react";
import { loginAction } from "./actions";
import { useRouter } from "next/navigation";

export default function Page() {
	const [loginData, setLoginData] = useState({ phone: "", password: "" });
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isPending, startTransition] = useTransition();
	const router = useRouter();
	// ✅ INPUT CHANGE HANDLER
	const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setLoginData((prev) => ({ ...prev, [name]: value }));

		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	// ✅ LOGIN HANDLER (SERVER ACTION CALL)
	const handleLogin = async (formData: FormData) => {
		const phone = formData.get('phone') as string;
		const password = formData.get('password') as string;

		const newErrors: Record<string, string> = {};

		if (!phone) newErrors.phone = "Phone is required";
		if (!password) newErrors.password = "Password is required";

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setErrors({});

		startTransition(async () => {
			try {
				const res = await loginAction(formData);

				if (!res.success) {
					setErrors({ submit: res.message });
					return;
				}
				sessionStorage.setItem("token", res.token);
				sessionStorage.setItem("user", JSON.stringify(res.user));
				router.push("/");

			} catch (error) {
				setErrors({ submit: "Login failed. Try again." });
			}
		});
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
			<div className="relative w-full max-w-md">
				<form action={handleLogin} className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
					<div className="space-y-5">

						{/* PHONE */}
						<div>
							<label className="block text-sm font-medium text-gray-200 mb-2">
								Phone Number
							</label>
							<div className="relative">
								<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type="tel"
									name="phone"
									value={loginData.phone}
									onChange={handleLoginChange}
									className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${errors.phone ? "border-red-500" : "border-white/20"
										} rounded-xl text-white`}
									placeholder="Enter your phone number"
								/>
							</div>
							{errors.phone && (
								<p className="mt-1 text-sm text-red-400">{errors.phone}</p>
							)}
						</div>

						{/* PASSWORD */}
						<div>
							<label className="block text-sm font-medium text-gray-200 mb-2">
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
								<input
									type={showPassword ? "text" : "password"}
									name="password"
									value={loginData.password}
									onChange={handleLoginChange}
									className={`w-full pl-10 pr-12 py-3 bg-white/10 border ${errors.password ? "border-red-500" : "border-white/20"
										} rounded-xl text-white`}
									placeholder="Enter your password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2"
								>
									{showPassword ? (
										<EyeOff className="w-5 h-5 text-gray-400" />
									) : (
										<Eye className="w-5 h-5 text-gray-400" />
									)}
								</button>
							</div>
							{errors.password && (
								<p className="mt-1 text-sm text-red-400">{errors.password}</p>
							)}
						</div>

						{/* ERROR */}
						{errors.submit && (
							<div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
								{errors.submit}
							</div>
						)}

						{/* BUTTON */}
						<button
							type="submit"
							disabled={isPending}
							className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl text-white font-semibold"
						>
							{isPending ? "Signing In..." : "Sign In"}
						</button>

					</div>
				</form>
			</div>
		</div>
	);
}
