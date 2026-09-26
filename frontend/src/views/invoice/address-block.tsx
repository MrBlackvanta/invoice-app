import type { Address } from "@/data";

export default function AddressBlock({
  address,
  className,
}: {
  address: Address;
  className?: string;
}) {
  return (
    <p className={`text-prose ${className ?? ""}`}>
      {address.street}
      <br />
      {address.city}
      <br />
      {address.postCode}
      <br />
      {address.country}
    </p>
  );
}
