"use client";
import React, { useMemo, useRef, useState } from "react";
import { useTransactions } from "@/apis/queries/transactions.queries";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import Pagination from "@/components/shared/Pagination";
import { convertDateTime } from "@/utils/helper";
import { FiEye } from "react-icons/fi";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const TransactionsPage = () => {
    const t = useTranslations();
    const { langDir } = useAuth();

    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const [selectedTransaction, setSelectedTransaction] = useState<any>();
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);

    const wrapperRef = useRef(null);
    const handleTransactionModal = () => setIsTransactionModalOpen(!isTransactionModalOpen);

    const transactionsQuery = useTransactions({
        page: page,
        limit: limit
    })

    const transactions = useMemo(() => {
        return transactionsQuery?.data?.data || [];
    }, [
        transactionsQuery?.data?.data,
        page,
        limit,
    ]);

    return (
        <>
            <section className="team_members_section">
                <div className="container relative z-10 m-auto px-3">
                    <div className="flex w-full flex-wrap">
                        <div className="team_members_heading w-full" dir={langDir}>
                            <h1 dir={langDir} translate="no">{t("transactions")}</h1>
                        </div>

                        <div className="team_members_table w-full">
                            {!transactionsQuery?.isLoading && transactions.length ? (
                                <>
                                    <table cellPadding={0} cellSpacing={0} border={0}>
                                        <thead>
                                            <tr>
                                                <th dir={langDir} translate="no">{t("transaction_id")}</th>
                                                <th dir={langDir} translate="no">{t("amount")}</th>
                                                <th dir={langDir} translate="no">{t("status")}</th>
                                                <th dir={langDir} translate="no">{t("date_n_time")}</th>
                                                <th dir={langDir} translate="no">{t("action")}</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {transactions?.map((transaction: any) => {
                                                return (
                                                    <tr key={transaction.id}>
                                                        <td>{transaction.id}</td>
                                                        <td>{(transaction.amountCents / 1000).toFixed(2)}</td>
                                                        <td>{transaction.transactionStatus}</td>
                                                        <td>{convertDateTime(transaction.updatedAt)}</td>
                                                        <td>
                                                            <button
                                                                className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-md!"
                                                                onClick={() => {
                                                                    handleTransactionModal();
                                                                    setSelectedTransaction(transaction);
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

                            {!transactionsQuery?.isLoading && !transactions.length ? (
                                <p className="py-10 text-center text-sm font-medium" dir={langDir} translate="no">
                                    {t("no_data_found")}
                                </p>
                            ) : null}

                            {transactionsQuery.data?.totalCount > limit ? (
                                <Pagination
                                    page={page}
                                    setPage={setPage}
                                    totalCount={transactionsQuery.data?.totalCount}
                                    limit={limit}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>

                {selectedTransaction ? (<Dialog open={isTransactionModalOpen} onOpenChange={handleTransactionModal}>
                    <DialogContent
                        className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
                        ref={wrapperRef}
                    >
                        <div className="modal-header justify-between!">
                            <DialogTitle className="text-center text-xl font-bold" dir={langDir} translate="no">
                                {t("transaction")}
                            </DialogTitle>
                            <Button
                                onClick={() => {
                                    handleTransactionModal();
                                    setSelectedTransaction(undefined);
                                }}
                                className="absolute right-2 top-2 z-10 bg-white! text-black! shadow-none"
                            >
                                <IoCloseSharp size={20} />
                            </Button>
                        </div>
                        <form className="card-item card-payment-form px-5 pb-5 pt-3">
                            <div>
                                <Label htmlFor="query" dir={langDir} translate="no">
                                    {t("transaction_id")}
                                </Label>
                                <Input
                                    type="text"
                                    defaultValue={selectedTransaction.id}
                                    readOnly
                                />
                            </div>
                            <div className="pt-3">
                                <Label htmlFor="reply" dir={langDir} translate="no">
                                    {t("date_n_time")}
                                </Label>
                                <Input
                                    type="text"
                                    defaultValue={convertDateTime(selectedTransaction.updatedAt)}
                                    readOnly
                                />
                            </div>
                            <div className="pt-3">
                                <Label htmlFor="reply" dir={langDir} translate="no">
                                    {t("transaction_type")}
                                </Label>
                                <Input
                                    type="text"
                                    defaultValue={selectedTransaction.transactionType}
                                    readOnly
                                />
                            </div>
                            <div className="pt-3">
                                <Label htmlFor="reply" dir={langDir} translate="no">
                                    {t("status")}
                                </Label>
                                <Input
                                    type="text"
                                    defaultValue={selectedTransaction.transactionStatus}
                                    readOnly
                                />
                            </div>
                            {selectedTransaction.transactionStatus == 'SUCCESS' ? (
                                <>
                                    <div className="pt-3">
                                        <Label htmlFor="reply" dir={langDir} translate="no">
                                            {t("amount")}
                                        </Label>
                                        <Input
                                            type="text"
                                            defaultValue={(selectedTransaction.amountCents / 1000).toFixed(2)}
                                            readOnly
                                        />
                                    </div>
                                    <div className="pt-3">
                                        <Label htmlFor="reply" dir={langDir} translate="no">
                                            {t("transaction_reference_number")}
                                        </Label>
                                        <Input
                                            type="text"
                                            defaultValue={selectedTransaction.paymobTransactionId}
                                            readOnly
                                        />
                                    </div>
                                    <div className="pt-3">
                                        <Label htmlFor="reply" dir={langDir} translate="no">
                                            {t("order_reference_number")}
                                        </Label>
                                        <Input
                                            type="text"
                                            defaultValue={selectedTransaction.paymobOrderId}
                                            readOnly
                                        />
                                    </div>
                                </>
                            ) : null}
                        </form>
                    </DialogContent>
                </Dialog>) : null}
            </section>
        </>
    );
};

export default TransactionsPage;