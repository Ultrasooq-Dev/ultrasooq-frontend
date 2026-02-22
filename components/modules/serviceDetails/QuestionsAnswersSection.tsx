import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import QuestionForm from "./QuestionForm";
import QuestionCard from "./QuestionCard";
import { useServiceQuestions } from "@/apis/queries/question.queries";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type QuestionsAnswersSectionProps = {
  hasAccessToken?: boolean;
  serviceId?: string;
};

const QuestionsAnswersSection: React.FC<QuestionsAnswersSectionProps> = ({
  hasAccessToken,
  serviceId,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [sortType, setSortType] = useState<"latest" | "oldest">("latest");

  const handleToggleQuestionModal = () => setIsQuestionModalOpen(!isQuestionModalOpen);

  const questionQuery = useServiceQuestions(
    {
      page: 1,
      limit: 20,
      serviceId: serviceId ?? "",
      sortType,
    },
    !!serviceId,
  );

  return (
    <div className="w-full">
      <div className="flex w-full flex-wrap items-center justify-between">
        <div className="flex w-auto flex-wrap items-start justify-start">
          <h2 className="mb-0 text-2xl font-semibold leading-7 text-color-dark" dir={langDir} translate="no">
            {t("question_n_answers")}
          </h2>
        </div>
        <div className="w-auto">
          {hasAccessToken ? (
            <button
              type="button"
              onClick={handleToggleQuestionModal}
              className="flex rounded-sm bg-dark-orange p-3 text-sm font-bold leading-5 text-white"
              dir={langDir}
              translate="no"
            >
              <Image
                src="/images/pen-icon.svg"
                height={20}
                width={20}
                className="mr-2"
                alt="pen-icon"
              />
              <span>{t("post_a_question")}</span>
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex w-full items-center justify-end py-5">
        <ul className="flex items-center justify-end">
          <li className="ml-2 text-sm font-medium text-color-dark">Sort By:</li>
          <li className="ml-2">
            <Button
              variant={sortType === "latest" ? "secondary" : "ghost"}
              onClick={() => setSortType("latest")}
              className="block rounded-full border border-solid border-border text-sm font-medium text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("newest")}
            </Button>
          </li>

          <li className="ml-2">
            <Button
              variant={sortType === "oldest" ? "secondary" : "ghost"}
              onClick={() => setSortType("oldest")}
              className="block rounded-full border border-solid border-border text-sm font-medium text-muted-foreground"
              dir={langDir}
              translate="no"
            >
              {t("oldest")}
            </Button>
          </li>
        </ul>
      </div>
      <div className="flex w-full border-t-2 border-dashed border-border py-5">
        <div className="w-full space-y-3">
          {!questionQuery?.data?.data?.length ? (
            <div className="w-full text-center text-sm font-bold text-dark-orange" dir={langDir} translate="no">
              {t("no_questions_found")}
            </div>
          ) : null}

          {questionQuery.data?.data?.map(
            (
              question: {
                id: number;
                question: string;
                questionByuserId: number;
                questionByuserIdDetail?: {
                  id: number;
                  firstName: string;
                  lastName: string;
                };
                answer?: string;
                answerByuserIdDetail?: {
                  id: number;
                  firstName: string;
                  lastName: string;
                };
                productQuestionAnswerDetail: {
                  id: number;
                  answer: string;
                  answerByUserDetail?: {[key: string]: any};
                }[]
              },
              index: number,
            ) => {
              const answers: {
                id: number;
                answer: string;
                userName?: string;
              }[] = [];
              if (question.productQuestionAnswerDetail.length > 0) {
                question.productQuestionAnswerDetail.forEach((item: {[key:string]: any}) => {
                  answers.push({
                    id: item.id,
                    answer: item.answer,
                    userName: item.answerByUserDetail ? `${item.answerByUserDetail.firstName} ${item.answerByUserDetail.lastName}` : ''
                  });
                });
              } else if (question.answer) {
                answers.push({
                  id: 0,
                  answer: question.answer,
                  userName: question.answerByuserIdDetail ? `${question.answerByuserIdDetail.firstName} ${question.answerByuserIdDetail.lastName}` : ''
                });
              }

              if (question.questionByuserIdDetail) {
                question.questionByuserIdDetail = {
                  id: question.questionByuserIdDetail.id,
                  firstName: question.questionByuserIdDetail.firstName,
                  lastName: question.questionByuserIdDetail.lastName
                }
              }

              return (
                <QuestionCard
                  key={question.id}
                  id={question.id}
                  question={question.question}
                  questionByUserDetail={question.questionByuserIdDetail}
                  answers={answers}
                  isLastItem={index === questionQuery.data?.data?.length - 1}
                />
              );
            },
          )}
        </div>
      </div>
      
      <Dialog
        open={isQuestionModalOpen}
        onOpenChange={handleToggleQuestionModal}
      >
        <DialogContent className="max-h-[93vh] max-w-[90%] gap-0 md:max-w-[90%]! lg:max-w-5xl!">
          <QuestionForm onClose={handleToggleQuestionModal} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionsAnswersSection;
