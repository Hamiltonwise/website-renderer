import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import LoadingIndicator from "@/components/LoadingIndicator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <LoadingIndicator />
      </Suspense>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
