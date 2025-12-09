import React, { useRef } from "react";
import { Input } from "../UI/input";
import { cn } from "../../utils/cn";

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, length = 6 }) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return; // allow only digits

    const newOtp = value.split("");
    newOtp[index] = val;
    const otpString = newOtp.join("");

    onChange(otpString);

    // move forward automatically
    if (val && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    const newOtp = pasted.split("").concat(Array(length).fill("")).slice(0, length);
    onChange(newOtp.join(""));

    // focus next empty box
    const nextIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();

    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, idx) => (
        <Input
          key={idx}
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={idx === 0 ? handlePaste : undefined}
          ref={(el) => (inputsRef.current[idx] = el)}
          className={cn("w-12 h-14 text-center text-xl font-bold tracking-wider",
            idx === length - 1 ? "mr-4" : "")}
        />
      ))}
    </div>
  );
};
