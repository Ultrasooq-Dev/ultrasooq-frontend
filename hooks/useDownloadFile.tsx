import { useState } from "react";
import { downloadAttachment } from "@/apis/requests/chat.requests";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

const useDownloadFile = () => {
    const t = useTranslations();
    const [downloadLoading, setDownloadLoading] = useState(false);
    const { toast } = useToast();

    const downloadFile = async (presignedUrl?: string) => {
        const link: any = document.createElement('a');
        link.href = presignedUrl;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadFile = async (filePath: string) => {
        try {
            if (filePath) {
                setDownloadLoading(true);
                const response: any = await downloadAttachment(filePath);
                if (response?.data?.url) {
                    downloadFile(response?.data?.url);
                } else {
                    toast({
                        title: t("chat"),
                        description: t("file_download_failed"),
                        variant: "danger",
                    });
                }
                setDownloadLoading(false);
            } else {
                toast({
                    title: t("chat"),
                    description: t("file_path_missing"),
                    variant: "danger",
                });
            }
        } catch (error) {
            setDownloadLoading(false);
            toast({
                title: t("chat"),
                description: t("file_download_failed"),
                variant: "danger",
            });
        }
    };

    return {
        handleDownloadFile,
        downloadLoading
    }
}

export default useDownloadFile