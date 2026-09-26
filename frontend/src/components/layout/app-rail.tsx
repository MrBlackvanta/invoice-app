import avatar from "@/assets/avatar.webp";
import { LogoMarkIcon } from "@/components/icons";
import Image from "next/image";
import ThemeToggle from "./theme-toggle";

export default function AppRail() {
  return (
    <header className="bg-rail lg:rounded-r-rail flex h-18 items-center md:h-20 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:h-auto lg:w-25.75 lg:flex-col lg:items-stretch lg:justify-between">
      <div className="bg-accent rounded-r-rail relative grid size-18 shrink-0 place-items-center overflow-hidden text-white md:size-20 lg:size-25.75">
        <span className="bg-accent-soft rounded-tl-rail absolute inset-x-0 bottom-0 h-1/2" />
        <LogoMarkIcon className="relative h-auto w-7 md:w-7.75 lg:w-10" />
      </div>
      <div className="ml-auto flex h-full items-center gap-6 pr-6 md:gap-8 md:pr-8 lg:ml-0 lg:h-auto lg:flex-col lg:gap-0 lg:pr-0 lg:pb-6">
        <ThemeToggle className="lg:mb-8" />
        <span className="bg-divider w-px self-stretch lg:mb-6 lg:h-px lg:w-auto" />
        <Image
          src={avatar}
          alt=""
          loading="eager"
          className="size-8 rounded-full lg:size-10"
        />
      </div>
    </header>
  );
}
