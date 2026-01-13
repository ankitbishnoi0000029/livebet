'use server';

import { loginUser } from "@/lib/dbWrk";

export async function loginAction(formData: FormData) {
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;

  if (!phone || !password) {
    return {
      success: false,
      message: "Phone and password are required"
    };
  }

  try {
    const result = await loginUser(phone, password);
    return result;
  } catch (error) {
    return {
      success: false,
      message: "Login failed. Try again."
    };
  }
}
