export default function DetailSkeleton() {
  return (
    <main className="flex flex-1 flex-col px-6 pt-8.25 md:px-10 md:pt-12.25 lg:px-12 lg:pt-16.25">
      <div aria-hidden="true" className="max-w-content mx-auto w-full">
        <div className="bg-surface v-skeleton h-4 w-20 rounded-full" />
        <div className="bg-surface shadow-card rounded-card v-skeleton mt-7.75 h-22.75 md:h-22" />
        <div className="bg-surface shadow-card rounded-card v-skeleton mt-4 h-160 md:mt-6 md:h-125" />
      </div>
    </main>
  );
}
