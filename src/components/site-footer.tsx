export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 text-sm text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} Галерея художников
      </div>
    </footer>
  );
}
