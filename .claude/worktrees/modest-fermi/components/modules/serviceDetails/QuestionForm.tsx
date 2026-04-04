import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import ControlledTextareaInput from "@/components/shared/Forms/ControlledTextareaInput";
import { Button } from "@/components/ui/button";
import { useAddServiceQuestion } from "@/apis/queries/question.queries";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type QuestionFormProps = {
  onClose: () => void;
};

const formSchema = (t: any) => {
  return z.object({
    question: z
      .string()
      .trim()
      .min(2, {
        message: t("question_required"),
      })
      .max(200, {
        message: t("question_must_be_less_than_n_chars", { n: 200 }),
      }),
  });
};

const QuestionForm: React.FC<QuestionFormProps> = ({ onClose }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const searchParams = useParams();
  const { toast } = useToast();
  const defaultValues = {
    question: "",
  }
  const form = useForm({
    resolver: zodResolver(formSchema(t)),
    defaultValues: defaultValues,
  });

  const addQuestion = useAddServiceQuestion();

  const onSubmit = async (values: typeof defaultValues) => {
    const response = await addQuestion.mutateAsync({
      serviceId: Number(searchParams?.id),
      question: values.question,
    });

    if (response.status) {
      toast({
        title: t("question_add_successful"),
        description: response.message,
        variant: "success",
      });

      form.reset();
      onClose();
    } else {
      toast({
        title: t("question_add_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle className="mb-5 text-center text-xl font-semibold" dir={langDir} translate="no">
          {t("post_your_question")}
        </DialogTitle>
      </DialogHeader>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="pl-5">
          <ul className="list-disc">
            <li dir={langDir} translate="no">{t("question_instruction_1")}</li>
            <li dir={langDir} translate="no">{t("question_instruction_2")}</li>
            <li dir={langDir} translate="no">{t("question_instruction_3")}</li>
          </ul>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="card-item card-payment-form"
          >
            <ControlledTextareaInput
              label={t("type_your_question_here")}
              name="question"
              placeholder={t("enter_your_question_here")}
              rows={6}
              dir={langDir}
              translate="no"
            />

            <Button
              disabled={addQuestion.isPending}
              type="submit"
              className="theme-primary-btn h-12 w-full rounded bg-dark-orange text-center text-lg font-bold leading-6"
              dir={langDir}
              translate="no"
            >
              {addQuestion.isPending ? (
                <>
                  <Image
                    src="/images/load.png"
                    alt="loader-icon"
                    width={20}
                    height={20}
                    className="mr-2 animate-spin"
                  />
                  {t("please_wait")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  );
};

export default QuestionForm;
