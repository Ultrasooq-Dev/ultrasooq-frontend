import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import {
  TextIcon,
  TextAlignJustifyIcon,
  DropdownMenuIcon,
  CheckboxIcon,
  RadiobuttonIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";

type CustomFieldContentProps = {
  setFieldType: (type: string) => void;
  onClose: () => void;
};

const CustomFieldContent: React.FC<CustomFieldContentProps> = ({
  setFieldType,
  onClose,
}) => {
  const handleFieldType = (type: string) => {
    setFieldType(type);
    onClose();
  };

  return (
    <>
      <DialogHeader className="border-b border-light-gray py-4">
        <DialogTitle className="text-center text-xl font-bold">
          Custom Fields
        </DialogTitle>
      </DialogHeader>
      <div className="p-4 text-base font-normal leading-7 text-color-dark">
        <h4 className="mb-2 text-lg">Available Fields</h4>
        <div className="flex flex-col gap-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFieldType("text")}
            className="flex h-12 flex-row justify-start text-lg"
          >
            <TextIcon className="mr-2 h-5 w-5" />
            Text
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFieldType("textarea")}
            className="flex h-12 flex-row justify-start text-lg"
          >
            <TextAlignJustifyIcon className="mr-2 h-5 w-5" />
            Textarea
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFieldType("dropdown")}
            className="flex h-12 flex-row justify-start text-lg"
          >
            <DropdownMenuIcon className="mr-2 h-5 w-5" />
            Dropdown
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFieldType("checkbox")}
            className="flex h-12 flex-row justify-start text-lg"
          >
            <CheckboxIcon className="mr-2 h-5 w-5" />
            Checkbox
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFieldType("radio")}
            className="flex h-12 flex-row justify-start text-lg"
          >
            <RadiobuttonIcon className="mr-2 h-5 w-5" />
            Radio Button
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleFieldType("date")}
            className="flex h-12 flex-row justify-start text-lg"
          >
            <CalendarIcon className="mr-2 h-5 w-5" />
            Date
          </Button>
        </div>
      </div>
    </>
  );
};

export default CustomFieldContent;
