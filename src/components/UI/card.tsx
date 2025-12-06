import React from "react";
import clsx from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  shadow?: boolean;
  rounded?: boolean;
};

export const Card: React.FC<CardProps> = ({ children, className, shadow = true, rounded = true, ...rest }) => {
  return (
    <div
      className={clsx(
        "bg-white",
        shadow ? "shadow-lg" : "",
        rounded ? "rounded-xl" : "",
        "overflow-hidden",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
