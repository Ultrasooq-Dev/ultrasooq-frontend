import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent } from "@/components/ui/dialog";
// import AnswerForm from "./AnswerForm";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type QuestionCardProps = {
  id: number;
  question: string;
  questionByUserDetail?: {
    id: number,
    firstName: string;
    lastName: string;
  };
  answers: {[key: string]: any}[],
  isLastItem: boolean;
};

const QuestionCard: React.FC<QuestionCardProps> = ({
  id,
  question,
  questionByUserDetail,
  answers,
  isLastItem,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  
  // const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  // const handleToggleQuestionModal = () => setIsQuestionModalOpen(!isQuestionModalOpen);

  return (
    <div
      className={cn(
        !isLastItem ? "border-b border-solid border-border" : "",
        "w-full p-3",
      )}
    >
      <article className="space-y-1">
        <h3 className="font-bold">
          <span className="mr-2">Q:</span>
          {question}
        </h3>
        {questionByUserDetail ? <p className="text-xs font-medium text-muted-foreground">
          {`${questionByUserDetail.firstName} ${questionByUserDetail.lastName}`}
        </p> : ''}
        {answers?.length ? answers.map((answer: any) => (
          <React.Fragment key={answer.id}>
            <p>
              <span className="mr-2 font-bold">A:</span>
              {answer.answer}
            </p>
            <p className="text-xs font-medium text-muted-foreground">{answer.userName || ""}</p>
          </React.Fragment>
        )) : null}
        {!answers?.length ? (
          <>
            <p dir={langDir} translate="no">
              <span className="mr-2 font-bold">A:</span>
              {t("no_answer_yet")}
            </p>
            <p className="text-xs font-medium text-muted-foreground"></p>
          </>
        ) : null}

        {/* {hasAccessToken && !answers?.length ? (
          <div className="my-2! text-center">
            <Button variant="secondary" onClick={handleToggleQuestionModal}>
              Reply
            </Button>
          </div>
        ) : null} */}
      </article>

      {/* <Dialog
        open={isQuestionModalOpen}
        onOpenChange={handleToggleQuestionModal}
      >
        <DialogContent>
          <AnswerForm onClose={handleToggleQuestionModal} questionId={id} />
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default QuestionCard;
