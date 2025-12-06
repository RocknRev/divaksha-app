import React from "react";
import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className, ...rest }) => {
  return (
    <input
      className={clsx(
        "px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400",
        className
      )}
      {...rest}
    />
  );
};

export default Input;
