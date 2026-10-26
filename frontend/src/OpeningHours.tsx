import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { WeeklyHours } from './api/restaurants';
import { isOpenAt, openingHoursLines } from './openingHoursSchedule';

interface OpeningHoursProps {
  hours: WeeklyHours;
}

// Whether the restaurant is open now, with an arrow that shows the full
// hours, one line per run of days with the same hours.
export function OpeningHours({ hours }: OpeningHoursProps) {
  const [expanded, setExpanded] = useState(false);
  const open = isOpenAt(hours, new Date());

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="group inline-flex min-h-8 cursor-pointer items-center gap-2 font-semibold">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 before:size-[0.55rem] before:rounded-full before:bg-current',
            open ? 'text-primary' : 'text-destructive',
          )}
        >
          {open ? 'Aberto agora' : 'Fechado agora'}
        </span>
        <ChevronDown
          className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      {/* Always in the page, so the hours are part of the panel from the
          start. With forceMount, Radix leaves the hiding to us. */}
      <CollapsibleContent forceMount asChild>
        {/* Each line puts its days and hours in the two columns of the
            list. */}
        <ul
          hidden={!expanded}
          className="mt-1 grid list-none grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 p-0"
        >
          {openingHoursLines(hours).map((line) => (
            <li
              key={line.days}
              className="col-span-full grid grid-cols-subgrid"
            >
              <span>{line.days}</span>
              <span>{line.hours}</span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
