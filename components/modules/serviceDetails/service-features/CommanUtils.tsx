
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { timeOptions } from "@/components/shared/Forms/ControlledTimePicker";
export const DatePicker = ({
    selectedFeature,
    updateFeatureField,
    feature,
    langDir,
    t,
}: any) => {
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);
    return (
        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline-solid"}
                    className={cn(
                        "h-12! rounded border-border pl-3 text-left font-normal focus-visible:ring-0!",
                        !selectedFeature?.date && "text-muted-foreground",
                    )}
                    translate="no"
                >
                    {selectedFeature?.date ? (
                        format(selectedFeature.date, "PPP")
                    ) : (
                        <span>{t("select") + " " + t("date")}</span>
                    )}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[320px] p-0" // Increased width here
                align={langDir == 'rtl' ? 'end' : 'start'}
            >
                <Calendar
                    mode="single"
                    selected={selectedFeature?.date || undefined}
                    onSelect={(val: Date | undefined) => {
                        updateFeatureField(feature.id, "date", val);
                        setDatePopoverOpen(false); // Close after select
                    }}
                    disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                    }}
                    initialFocus
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 100}
                    captionLayout="dropdown"
                    classNames={{
                        vhidden: "vhidden hidden",
                        day_selected: "bg-dark-orange text-white",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}
export const TimePicker = ({
    selectedFeature,
    updateFeatureField,
    feature,
    langDir,
    t,
}: any) => {
    const [timePopoverOpen, setTimePopoverOpen] = useState(false);
    return (
        <Popover open={timePopoverOpen} onOpenChange={setTimePopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline-solid"}
                    className={cn(
                        "h-12! rounded border-border pl-3 text-left font-normal focus-visible:ring-0!",
                        !selectedFeature?.time && "text-muted-foreground",
                    )}
                    translate="no"
                >
                    {selectedFeature?.time ? (
                        selectedFeature.time
                    ) : (
                        <span className="w-full whitespace-pre-wrap break-words">
                            {t("select")} {t("time")}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="max-h-64 w-auto overflow-y-auto p-2"
                align={langDir == "rtl" ? "end" : "start"}
            >
                <select
                    className="w-full cursor-pointer rounded-lg border border-border p-2 text-lg"
                    value={selectedFeature?.time || ""}
                    onChange={(e) => {
                        const selectedTime = e.target.value;
                        updateFeatureField(feature.id, "time", selectedTime);
                        setTimePopoverOpen(false);
                    }}
                    dir={langDir}
                >
                    <option value="" translate="no" disabled>
                        {t("select_time")}
                    </option>
                    {timeOptions.map((time) => (
                        <option key={time} value={time}>
                            {time}
                        </option>
                    ))}
                </select>
            </PopoverContent>
        </Popover>
    );
};