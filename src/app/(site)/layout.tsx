// Site layout - no admin UI (no Navbar, no LoadingIndicator)
// This just passes children through for a clean customer site experience

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
