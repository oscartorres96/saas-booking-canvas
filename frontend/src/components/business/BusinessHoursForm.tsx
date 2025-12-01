import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Plus, X } from "lucide-react";

export const daysOfWeek = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
];

interface BusinessHoursFormProps {
    form: UseFormReturn<any>;
    fieldName?: string;
}

export function BusinessHoursForm({ form, fieldName = "businessHours" }: BusinessHoursFormProps) {
    return (
        <div className="space-y-4">
            {daysOfWeek.map((day, index) => {
                // Watch values to render conditionally
                const intervals = form.watch(`${fieldName}.${index}.intervals`);
                const isOpen = form.watch(`${fieldName}.${index}.isOpen`);

                return (
                    <div key={day.key} className="flex flex-col gap-3 p-3 border rounded-md bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <FormField
                                control={form.control}
                                name={`${fieldName}.${index}.isOpen`}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormLabel className="w-24 cursor-pointer">{day.label}</FormLabel>
                                    </FormItem>
                                )}
                            />
                            {!isOpen && (
                                <span className="text-muted-foreground text-sm italic">Cerrado</span>
                            )}
                        </div>
                        {isOpen && (
                            <div className="space-y-3">
                                {intervals?.map((interval: any, intervalIndex: number) => (
                                    <div key={intervalIndex} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`${fieldName}.${index}.intervals.${intervalIndex}.startTime`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input type="time" {...field} className="w-full" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <span className="text-center sm:w-auto">a</span>
                                        <FormField
                                            control={form.control}
                                            name={`${fieldName}.${index}.intervals.${intervalIndex}.endTime`}
                                            render={({ field }) => (
                                                <FormItem className="flex-1">
                                                    <FormControl>
                                                        <Input type="time" {...field} className="w-full" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        {intervals.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="self-start"
                                                onClick={() => {
                                                    const currentIntervals = form.getValues(`${fieldName}.${index}.intervals`);
                                                    const next = currentIntervals.filter((_: any, i: number) => i !== intervalIndex);
                                                    form.setValue(`${fieldName}.${index}.intervals`, next, { shouldDirty: true });
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                {(intervals?.length ?? 0) < 3 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full sm:w-auto"
                                        onClick={() => {
                                            const currentIntervals = form.getValues(`${fieldName}.${index}.intervals`) || [];
                                            const next = [
                                                ...currentIntervals,
                                                { startTime: "09:00", endTime: "18:00" },
                                            ];
                                            form.setValue(`${fieldName}.${index}.intervals`, next, { shouldDirty: true });
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Agregar intervalo
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
