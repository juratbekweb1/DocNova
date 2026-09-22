"use client";

/* eslint-disable react-hooks/incompatible-library */
import { useState } from "react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter } from "./AuthFooter";
import { PasswordInput } from "./PasswordInput";
import { PasswordStrength } from "./PasswordStrength";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(9, "Phone number must be at least 9 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type RegisterFormProps = {
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void> | void;
};

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (!val.startsWith("998")) {
      val = "998" + val.replace(/^998/, "");
    }
    let formatted = "+998 ";
    if (val.length > 3) {
      formatted += val.substring(3, 5);
    }
    if (val.length > 5) {
      formatted += " " + val.substring(5, 8);
    }
    if (val.length > 8) {
      formatted += " " + val.substring(8, 10);
    }
    if (val.length > 10) {
      formatted += " " + val.substring(10, 12);
    }
    setValue("phone", formatted, { shouldValidate: true });
  };

  const handleFormSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setServerError(null);

    try {
      await onSubmit({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Create your account"
        subtitle="Start building AI-powered resumes in minutes"
      />
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-8 space-y-6">
        {serverError ? (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {serverError}
          </motion.div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="block text-sm font-medium text-foreground-secondary">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              {...register("firstName")}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground transition placeholder:text-foreground-secondary/50 focus:ring-1 focus:outline-none premium-input ${
                errors.firstName
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/40"
                  : "border-border focus:border-primary focus:ring-primary/40"
              }`}
              placeholder="Jane"
            />
            {errors.firstName ? (
              <p id="firstName-error" className="text-xs text-red-400">
                {errors.firstName.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="block text-sm font-medium text-foreground-secondary">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              {...register("lastName")}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground transition placeholder:text-foreground-secondary/50 focus:ring-1 focus:outline-none premium-input ${
                errors.lastName
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/40"
                  : "border-border focus:border-primary focus:ring-primary/40"
              }`}
              placeholder="Doe"
            />
            {errors.lastName ? (
              <p id="lastName-error" className="text-xs text-red-400">
                {errors.lastName.message}
              </p>
            ) : null}
          </div>
        </div>
        <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground-secondary">
              Email / Gmail <span className="text-red-400">*</span>
            </label>
            <div className="mt-1 relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`block w-full appearance-none rounded-xl border bg-surface-elevated px-4 py-3 placeholder-slate-500 shadow-sm transition-all focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.email
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                    : "border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20"
                }`}
                placeholder="example@gmail.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground-secondary">
              Telefon raqam <span className="text-red-400">*</span>
            </label>
            <div className="mt-1 relative">
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                className={`block w-full appearance-none rounded-xl border bg-surface-elevated px-4 py-3 placeholder-slate-500 shadow-sm transition-all focus:outline-none focus:ring-1 sm:text-sm ${
                  errors.phone
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                    : "border-slate-700 focus:border-cyan-400 focus:ring-cyan-400/20"
                }`}
                placeholder="+998 90 123 45 67"
                {...register("phone")}
                onChange={(e) => {
                  register("phone").onChange(e);
                  handlePhoneChange(e);
                }}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>
          </div>
        <PasswordInput
          id="password"
          label="Password"
          value={watch("password", "")}
          onChange={(value) => {
            setValue("password", value, { shouldValidate: true });
          }}
          error={errors.password?.message}
          placeholder="Create a strong password"
          autoComplete="new-password"
        />
        <PasswordStrength password={password} />
        <PasswordInput
          id="confirmPassword"
          label="Confirm password"
          value={watch("confirmPassword", "")}
          onChange={(value) => {
            setValue("confirmPassword", value, { shouldValidate: true });
          }}
          error={errors.confirmPassword?.message}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 hover:scale-[1.02] premium-button"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <AuthFooter prompt="Already have an account?" linkHref="/login" linkLabel="Sign in" />
    </AuthCard>
  );
}
