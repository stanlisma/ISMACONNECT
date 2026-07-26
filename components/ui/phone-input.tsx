"use client";

import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";

import { cn, formatPhoneNumber } from "@/lib/utils";

type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PhoneInput({ className, defaultValue, value, onChange, ...props }: PhoneInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => formatPhoneNumber(String(defaultValue ?? "")));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhoneNumber(event.target.value);
    event.target.value = formatted;

    if (!isControlled) {
      setInternalValue(formatted);
    }

    onChange?.(event);
  }

  return (
    <input
      {...props}
      type="tel"
      inputMode="tel"
      className={cn("input", className)}
      value={isControlled ? formatPhoneNumber(String(value ?? "")) : internalValue}
      onChange={handleChange}
    />
  );
}
