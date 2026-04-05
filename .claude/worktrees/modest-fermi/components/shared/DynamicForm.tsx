import React, { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import DatePicker from "./DatePicker";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

type DynamicFormProps = {
  form: {
    categoryId: number;
    // categoryLocation: null;
    createdAt: string;
    deletedAt: string | null;
    formId: number;
    formIdDetail: any;
    id: number;
    status: string;
    updatedAt: string;
  };
};

const DynamicForm: React.FC<DynamicFormProps> = ({ form }) => {
  const [formData] = useState<any>(
    form?.formIdDetail?.formData
      ? JSON.parse(form?.formIdDetail?.formData)
      : {},
  );
  return (
    <>
      {formData ? 
        Object.keys(formData)
          .map((item) => formData[item])
          ?.map((item) => (
            <div key={item?.sectionTitle} className="mb-5 w-full">
              <label className="mb-3.5 block text-left text-lg font-medium capitalize leading-5 text-color-dark">
                {item?.sectionTitle}
              </label>

              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                {item?.fields?.map((field: any) => (
                  <div key={field?.id} className="flex flex-col">
                    <Label className="mb-3.5">{field?.label}</Label>

                    {field?.type === "text" ? (
                      <Input
                        type="text"
                        className="theme-form-control-s1"
                        placeholder={field?.placeholder || "Enter here"}
                      />
                    ) : field?.type === "textarea" ? (
                      <Textarea
                        className="theme-form-control-s1 h-auto!"
                        placeholder={field?.placeholder || "Enter here"}
                      />
                    ) : field?.type === "checkbox" ? (
                      <div className="flex gap-5">
                        {field?.options?.map((option: any) => (
                          <div
                            key={option}
                            className="flex flex-wrap items-center space-x-2"
                          >
                            <Checkbox id={option} />
                            <Label>{option}</Label>
                          </div>
                        ))}
                      </div>
                    ) : field?.type === "select" ? (
                      <Select>
                        <SelectTrigger className="theme-form-control-s1 data-placeholder:text-muted-foreground">
                          <SelectValue placeholder={field?.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {field?.options?.map((option: any) => (
                            <SelectItem
                              key={option}
                              className="py-2!"
                              value={option}
                            >
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field?.type === "radio" ? (
                      <RadioGroup
                        // defaultValue="comfortable"
                        className="flex flex-wrap gap-5"
                      >
                        {field?.options?.map((option: any) => (
                          <div
                            key={option}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem value={option} id={option} />
                            <Label htmlFor={option}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : field?.type === "date" ? (
                      <DatePicker placeholder={field?.placeholder} />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )) : null}
    </>
  );
};

export default DynamicForm;
