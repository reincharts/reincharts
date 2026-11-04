/** Placeholder shown while an example chunk loads. */
export function ChartSkeleton() {
    return (
        <div className="flex size-full items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-fd-border border-t-fd-muted-foreground" />
        </div>
    );
}
