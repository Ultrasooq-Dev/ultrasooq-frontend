import React, { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestions } from "@/apis/queries/question.queries";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AnswerForm from "../productDetails/AnswerForm";
import Pagination from "@/components/shared/Pagination";
import { useMe } from "@/apis/queries/user.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type QuestionAndAnswersProps = {
  productId: number;
  productAddedBy: number;
};

const QuestionAndAnswers: React.FC<QuestionAndAnswersProps> = ({
  productId,
  productAddedBy
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionId, setQuestionId] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [userType, setUserType] = useState<string>("CUSTOMER");
  const questionQuery = useQuestions(
    {
      page: page,
      limit: limit,
      productId: productId.toString(),
      sortType: "newest",
      userType: userType,
    },
    !!productId,
  );

  const me = useMe();

  const memoizedQuestions = useMemo(() => {
    return (
      questionQuery?.data?.data?.map((item: any) => {
        let question: { [key: string]: any } = {
          id: item.id,
          question: item.question,
          questionByUserId: item.questionByUserId,
          answers: [],
        };

        if (item.questionByuserIdDetail) {
          question.questionBy = `${item.questionByuserIdDetail.firstName} ${item.questionByuserIdDetail.lastName}`;
        }

        if (item.productQuestionAnswerDetail.length > 0) {
          item.productQuestionAnswerDetail.forEach((elem: any, i: number) => {
            let answer: { [key: string]: any } = {
              id: elem.id,
              answer: elem.answer,
              answeredBy: "",
            };
            if (elem.answerByUserDetail) {
              answer.answeredBy = `${elem.answerByUserDetail.firstName} ${elem.answerByUserDetail.lastName}`;
            }
            question.answers.push(answer);
          });
        } else if (item.answer) {
          question.answers.push({
            id: 0,
            answer: item.answer,
            answeredBy: "",
          });
        }

        return question;
      }) || []
    );
  }, [
    questionQuery?.data?.data,
    questionQuery?.data?.data?.length,
    productId,
    page,
    limit,
    userType,
  ]);

  const handleToggleQuestionModal = () =>
    setIsQuestionModalOpen(!isQuestionModalOpen);

  const reply = (id: number) => {
    handleToggleQuestionModal();
    setQuestionId(id);
  };

  const onReplySuccess = (answer: string) => {
    setQuestions(
      questions.map((question: any) => {
        if (question.id == questionId) {
          question.answer = answer;
        }
        return question;
      }),
    );
  };

  return (
    <div className="w-full border-r border-solid border-gray-300 lg:w-[67%]">
      <div className="flex min-h-[55px] w-full items-center justify-between border-b border-solid border-gray-300 px-[10px] py-[10px] text-base font-normal text-foreground" dir={langDir}>
        <span translate="no">{t("question_n_comments")}</span>
        <select onChange={(e) => setUserType(e.target.value)} value={userType}>
          <option value="CUSTOMER" dir={langDir} translate="no">{t("customer").toUpperCase()}</option>
          <option value="VENDOR" dir={langDir} translate="no">{t("vendor").toUpperCase()}</option>
        </select>
      </div>
      <div className="flex w-full border-t-2 border-gray-300 py-5">
        <div className="w-full space-y-3">
          {questionQuery?.isLoading ? (
            <>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : null}

          {!questionQuery?.isLoading && !memoizedQuestions?.length ? (
            <p className="text-center text-sm font-normal text-gray-500" dir={langDir} translate="no">
              {t("no_data_found")}
            </p>
          ) : null}

          {!questionQuery.isLoading && memoizedQuestions.length > 0 ?
            memoizedQuestions.map((question: any) => (
              <div className="w-full border-b p-3" key={question.id}>
                <article className="space-y-2">
                  <h3 className="solid w-full rounded-md border-[5px] border-[#b5b5b5] bg-gray-300 px-3 py-2 font-bold">
                    <span className="mr-2">Q:</span>
                    {question.question}
                  </h3>
                  {question.questionBy ? (
                    <p className="text-xs font-medium text-gray-500">
                      {question.questionBy}
                    </p>
                  ) : null}
                  <div className="w-full pl-3">
                    {question.answers.length ?
                      question.answers.map((answer: any) => (
                        <React.Fragment key={answer.id}>
                          <div className="solid text-md mb-1 w-full rounded-md border-[5px] border-[#b5b5b5] bg-gray-300 px-3 py-2">
                            <p>
                              <span className="mr-2 font-bold">A:</span>
                              {answer.answer}
                            </p>
                          </div>
                          {answer.answeredBy ? (
                            <p className="mb-3 text-xs font-medium text-gray-500">
                              {answer.answeredBy}
                            </p>
                          ) : null}
                        </React.Fragment>
                      )) : ''}
                    {productAddedBy == me?.data?.data?.id ? (<div className="my-2! text-center">
                      <Button
                        variant="secondary"
                        onClick={() => reply(question.id)}
                      >
                        Reply
                      </Button>
                    </div>) : null}
                  </div>
                </article>
              </div>
            )) : null}
        </div>
      </div>

      <Dialog
        open={isQuestionModalOpen}
        onOpenChange={handleToggleQuestionModal}
      >
        <DialogContent className="max-h-[93vh] max-w-[90%] gap-0 md:max-w-[90%]! lg:max-w-5xl!">
          <AnswerForm
            onClose={handleToggleQuestionModal}
            questionId={questionId}
            onReplySuccess={onReplySuccess}
          />
        </DialogContent>
      </Dialog>

      {questionQuery?.data?.data?.totalCount > 10 ? (
        <Pagination
          page={page}
          setPage={setPage}
          totalCount={questionQuery.data?.totalCount}
          limit={limit}
        />
      ) : null}
    </div>
  );
};

export default QuestionAndAnswers;
