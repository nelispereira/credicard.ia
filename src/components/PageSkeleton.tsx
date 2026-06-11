type Layout = "list" | "table" | "form-list" | "grid-2";

interface PageSkeletonProps {
  titleWidth?: string;
  layout?: Layout;
  rows?: number;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`} />;
}

function ListLayout({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center gap-4"
        >
          <SkeletonBlock className="h-4 w-2/5" />
          <SkeletonBlock className="h-3 w-1/4 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function TableLayout({ rows }: { rows: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex gap-8">
        {[...Array(4)].map((_, i) => (
          <SkeletonBlock key={i} className="h-3 w-20" />
        ))}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-8 items-center">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormListLayout({ rows }: { rows: number }) {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <SkeletonBlock className="h-4 w-40 mb-2" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-9" />
          <SkeletonBlock className="h-9" />
          <SkeletonBlock className="h-9" />
          <SkeletonBlock className="h-9" />
        </div>
        <SkeletonBlock className="h-9 w-32" />
      </div>
      <div className="space-y-2 mt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 flex items-center gap-4"
          >
            <SkeletonBlock className="h-3 w-1/3" />
            <SkeletonBlock className="h-3 w-1/4" />
            <SkeletonBlock className="h-3 w-1/5 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Grid2Layout({ rows }: { rows: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 h-48">
          <SkeletonBlock className="h-4 w-32 mb-4" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 h-48">
          <SkeletonBlock className="h-4 w-32 mb-4" />
          <SkeletonBlock className="h-3 w-full mb-2" />
          <SkeletonBlock className="h-3 w-4/5 mb-2" />
          <SkeletonBlock className="h-3 w-3/5" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 flex items-center gap-4"
          >
            <SkeletonBlock className="h-3 w-1/3" />
            <SkeletonBlock className="h-3 w-1/4 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({
  titleWidth = "w-32",
  layout = "list",
  rows = 5,
}: PageSkeletonProps) {
  return (
    <div className="animate-pulse mt-4">
      <SkeletonBlock className={`h-7 ${titleWidth} mb-6`} />
      {layout === "list" && <ListLayout rows={rows} />}
      {layout === "table" && <TableLayout rows={rows} />}
      {layout === "form-list" && <FormListLayout rows={rows} />}
      {layout === "grid-2" && <Grid2Layout rows={rows} />}
    </div>
  );
}
