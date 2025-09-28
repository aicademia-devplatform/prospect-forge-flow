import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Sélectionner une période",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      return placeholder
    }

    if (range.from && !range.to) {
      return `Depuis ${format(range.from, "dd MMM yyyy", { locale: fr })}`
    }

    if (range.from && range.to) {
      return `${format(range.from, "dd MMM yyyy", { locale: fr })} - ${format(range.to, "dd MMM yyyy", { locale: fr })}`
    }

    return placeholder
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setIsOpen(true)
    } else {
      setIsAnimating(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsAnimating(false)
      }, 150)
    }
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    onDateRangeChange?.(range)
    // Animation de confirmation visuelle
    if (range?.from && range?.to) {
      setIsAnimating(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsAnimating(false)
      }, 300)
    }
  }

  const handleClear = () => {
    onDateRangeChange?.(undefined)
    setIsAnimating(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsAnimating(false)
    }, 200)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal date-range-button",
              "transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
              !dateRange?.from && "text-muted-foreground",
              dateRange?.from && "border-primary/50 bg-primary/5 shadow-sm",
              isOpen && "ring-2 ring-primary/20 border-primary scale-[1.01]"
            )}
          >
            <CalendarIcon className={cn(
              "mr-2 h-4 w-4 transition-all duration-300",
              isOpen && "text-primary rotate-12 scale-110"
            )} />
            <span className="transition-all duration-200 truncate">
              {formatDateRange(dateRange)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-auto p-0 date-popover-content border-primary/20 shadow-xl",
            "transition-all duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
            isAnimating && "animate-out fade-out-0 zoom-out-95 slide-out-to-top-2"
          )} 
          align="start"
        >
          <div className="animate-in slide-in-from-top-2 duration-300">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 animate-in fade-in-50 duration-300",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium transition-colors duration-200",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-primary/10 rounded-md"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] opacity-70",
                row: "flex w-full mt-2",
                cell: cn(
                  "h-9 w-9 text-center text-sm p-0 relative transition-all duration-200",
                  "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                  "[&:has([aria-selected].day-outside)]:bg-accent/50", 
                  "[&:has([aria-selected])]:bg-gradient-to-r [&:has([aria-selected])]:from-primary/20 [&:has([aria-selected])]:to-primary/10",
                  "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                  "focus-within:relative focus-within:z-20"
                ),
                day: cn(
                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:scale-110",
                  "focus:bg-accent focus:text-accent-foreground",
                  "rounded-md"
                ),
                day_range_end: "day-range-end",
                day_selected: cn(
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  "focus:bg-primary focus:text-primary-foreground",
                  "transform scale-105 shadow-md transition-all duration-200"
                ),
                day_today: "bg-accent text-accent-foreground font-semibold ring-1 ring-primary/30",
                day_outside: cn(
                  "day-outside text-muted-foreground opacity-50", 
                  "aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  "hover:opacity-75 transition-opacity duration-200"
                ),
                day_disabled: "text-muted-foreground opacity-30 hover:opacity-30",
                day_range_middle: cn(
                  "aria-selected:bg-gradient-to-r aria-selected:from-primary/20 aria-selected:to-primary/20",
                  "aria-selected:text-accent-foreground"
                ),
                day_hidden: "invisible",
              }}
            />
          </div>
          <div className={cn(
            "p-3 border-t border-border bg-muted/30 transition-all duration-200",
            "animate-in slide-in-from-bottom-2 duration-300 delay-100"
          )}>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className={cn(
                  "transition-all duration-200 hover:scale-105 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
                  dateRange?.from ? "animate-in fade-in-50 slide-in-from-left-2 duration-300" : "opacity-50"
                )}
                disabled={!dateRange?.from}
              >
                Effacer
              </Button>
              {dateRange?.from && dateRange?.to && (
                <Button
                  size="sm"
                  onClick={() => handleOpenChange(false)}
                  className={cn(
                    "animate-in fade-in-50 slide-in-from-right-2 duration-300 delay-150",
                    "hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                  )}
                >
                  Appliquer
                </Button>
              )}
              {dateRange?.from && !dateRange?.to && (
                <div className={cn(
                  "text-xs text-muted-foreground animate-pulse",
                  "animate-in fade-in-50 duration-300"
                )}>
                  Sélectionnez la date de fin
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}