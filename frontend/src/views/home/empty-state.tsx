import illustration from "@/assets/illustration-empty.svg";
import Image from "next/image";

export default function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <Image src={illustration} alt="" className="h-40 w-auto md:h-50" />
      <h2 className="text-heading mt-10.5 md:mt-16.5">There is nothing here</h2>
      <p className="text-meta mt-5.75 max-w-44 md:max-w-48">
        Create an invoice by clicking the New
        <span className="sr-only md:not-sr-only"> Invoice</span> button and get
        started
      </p>
    </div>
  );
}
