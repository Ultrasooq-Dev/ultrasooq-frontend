import Image from "next/image";
import React from "react";
import LoaderIcon from "@/public/images/load.png";

type LoaderWithMessageProps = {
  message: string;
};

const LoaderWithMessage: React.FC<LoaderWithMessageProps> = ({ message }) => {
  return (
    <>
      <Image
        src={LoaderIcon}
        alt="loader-icon"
        width={20}
        height={20}
        className="mr-2 animate-spin"
      />
      {message || "Please wait"}
    </>
  );
};

export default LoaderWithMessage;
