import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// 1 … 4 5 7 … 20 with ellipsis between non-adjacent numbers.
function pageRange(page: number, totalPages: number): (number | "ellipsis")[] {
  const wanted = new Set([1, page - 1, page, page + 1, totalPages]);
  const numbers = [...wanted]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b);

  const range: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const number of numbers) {
    if (previous > 0 && number - previous > 1) {
      range.push("ellipsis");
    }
    range.push(number);
    previous = number;
  }

  return range;
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** When provided together with pageSize, adds the "Showing …" line. */
  total?: number;
  pageSize?: number;
  /** When provided, adds the rows-per-page select [10, 20, 50]. */
  onPageSizeChange?: (pageSize: number) => void;
}) {
  const hasCountBuffer = total !== undefined && pageSize !== undefined;
  const showingFrom = total === 0 || total === undefined ? 0 : (page - 1) * pageSize! + 1;
  const showingTo = total === undefined ? 0 : Math.min(page * pageSize!, total);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      {hasCountBuffer ? (
        <p className="text-sm text-muted-foreground">
          Showing {showingFrom}-{showingTo} of {total} users
        </p>
      ) : (
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
      )}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger size="sm" aria-label="Rows per page" className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
            Prev
          </Button>
          {totalPages > 0 && hasCountBuffer ? (
            <nav aria-label="Pagination" className="hidden items-center gap-1 md:flex">
              {pageRange(page, totalPages).map((entry, index) =>
                entry === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1 text-sm text-muted-foreground"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={entry}
                    variant={entry === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(entry)}
                    aria-current={entry === page ? "page" : undefined}
                    className="min-w-8"
                  >
                    {entry}
                  </Button>
                ),
              )}
            </nav>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
