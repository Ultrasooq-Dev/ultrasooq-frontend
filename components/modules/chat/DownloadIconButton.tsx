import useDownloadFile from "@/hooks/useDownloadFile";
import { useState } from "react";

interface DownloadIconButtonProps {
    attachmentId: number | null;
    filePath: string
}

const DownloadIconButton: React.FC<DownloadIconButtonProps> = ({
    attachmentId,
    filePath
}) => {
    const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null);
    const { downloadLoading, handleDownloadFile } = useDownloadFile();

    return (
        <button
            className="ml-4 p-2 text-gray-500 hover:text-gray-700"
            onClick={() => {
                setSelectedAttachmentId(attachmentId);
                handleDownloadFile(filePath)
            }}
            disabled={downloadLoading}
        >
            {selectedAttachmentId === attachmentId && downloadLoading ? (
                <svg
                    className="animate-spin h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8V12H4z"
                    ></path>
                </svg>
            ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M10 3a1 1 0 00-1 1v7.586l-2.293-2.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 11.586V4a1 1 0 00-1-1z"
                        clipRule="evenodd"
                    />
                    <path
                        fillRule="evenodd"
                        d="M4 15a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            )}
        </button>
    )
}

export default DownloadIconButton;