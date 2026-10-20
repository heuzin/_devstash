import { HomeNavbar } from "@/components/homepage/home-navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HomeNavbar />
      <div className="flex min-h-screen flex-col items-center justify-center px-6 pt-22 pb-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </>
  );
}
