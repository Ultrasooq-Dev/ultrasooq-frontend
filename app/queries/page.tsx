"use client"; // Add this at the top
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useHelpCenterQueries } from "@/apis/queries/help-center.queries";
import { Dialog, DialogContent, DialogTitle } from "@/components/plate-ui/dialog";
import Pagination from "@/components/shared/Pagination";
import { FiEye } from "react-icons/fi";
import { Button } from "@/components/plate-ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { query } from "urlcat";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const QueriesPage = () => {
    const t = useTranslations();
    const { langDir } = useAuth();
    const [isQueryModalOpen, setIsQueryModalOpen] = useState<boolean>(false);
    const [selectedQuery, setSelectedQuery] = useState<any>();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const wrapperRef = useRef(null);
    const handleQueryModal = () => setIsQueryModalOpen(!isQueryModalOpen);

    const helpCenterQueriesQuery = useHelpCenterQueries({
        page: page,
        limit: limit,
    }, true);

    const helpCenterQueries = useMemo(() => {
        return helpCenterQueriesQuery?.data?.data || [];
    }, [
        helpCenterQueriesQuery?.data?.data,
        page,
        limit,
    ]);

    // Helper function to format date
    const convertDateTime = (dateString: string) => {
        if (!dateString) {
            return "-";
        }
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            minute: "numeric",
            hour: "numeric",
            hour12: true,
            second: "numeric",
        };
        const formattedDate = date.toLocaleDateString("en-GB", options);
        return formattedDate;
    };

    return (
        <>
            <section className="team_members_section">
                <div className="container relative z-10 m-auto px-3">
                    <div className="flex w-full flex-wrap">
                        <div className="team_members_heading w-full" dir={langDir}>
                            <h1 dir={langDir} translate="no">{t("queries")}</h1>
                        </div>

                        <div className="team_members_table w-full">
                            {!helpCenterQueriesQuery?.isLoading && helpCenterQueries.length ? (
                                <>
                                    <table cellPadding={0} cellSpacing={0} border={0}>
                                        <thead>
                                            <tr>
                                                <th dir={langDir} translate="no">{t("query")}</th>
                                                <th dir={langDir} translate="no">{t("response")}</th>
                                                <th dir={langDir} translate="no">{t("date_n_time")}</th>
                                                <th dir={langDir} translate="no">{t("action")}</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {helpCenterQueries?.map((query: any) => {
                                                return (
                                                    <tr key={query.id}>
                                                        <td>{query.query?.length > 30 ? query.query?.substr(0, 30) + '...' : query.query}</td>
                                                        <td>{query.response?.length > 30 ? query.response?.substr(0, 30) + '...' : query.response}</td>
                                                        <td>{convertDateTime(query.createdAt)}</td>
                                                        <td>
                                                            <button
                                                                className="relative flex h-8 w-8 items-center justify-center rounded-full bg-card text-foreground shadow-md!"
                                                                onClick={() => {
                                                                    handleQueryModal();
                                                                    setSelectedQuery(query);
                                                                }}
                                                            >
                                                                <FiEye size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </>
                            ) : null}

                            {!helpCenterQueriesQuery?.isLoading && !helpCenterQueries.length ? (
                                <p className="py-10 text-center text-sm font-medium" dir={langDir} translate="no">
                                    {t("no_data_found")}
                                </p>
                            ) : null}

                            {helpCenterQueriesQuery.data?.totalCount > limit ? (
                                <Pagination
                                    page={page}
                                    setPage={setPage}
                                    totalCount={helpCenterQueriesQuery.data?.totalCount}
                                    limit={limit}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>

                {selectedQuery ? (<Dialog open={isQueryModalOpen} onOpenChange={handleQueryModal}>
                    <DialogContent
                        className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
                        ref={wrapperRef}
                    >
                        <div className="modal-header justify-between!">
                            <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
                                {t("query")}
                            </DialogTitle>
                            <Button
                                onClick={handleQueryModal}
                                className="absolute right-2 top-2 z-10 bg-card! text-foreground! shadow-none"
                            >
                                <IoCloseSharp size={20} />
                            </Button>
                        </div>
                        <form className="card-item card-payment-form px-5 pb-5 pt-3">
                            <div>
                                <Label htmlFor="query" dir={langDir} translate="no">{t("query")}</Label>
                                <Textarea
                                    disabled={true}
                                    defaultValue={selectedQuery.query}
                                    rows={5}
                                />
                            </div>
                            <div className="pt-3">
                                <Label htmlFor="reply" dir={langDir} translate="no">{t("reply")}</Label>
                                <Textarea
                                    disabled={true}
                                    defaultValue={selectedQuery.response}
                                    rows={5}
                                />
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>) : null}
            </section>
        </>
    );
};

export default QueriesPage;