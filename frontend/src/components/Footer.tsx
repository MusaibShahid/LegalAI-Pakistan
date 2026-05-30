export default function Footer() {
  return (
    <footer className="border-t border-pk-green-800 bg-pk-green-900 dark:border-pk-green-950 dark:bg-pk-green-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pk-gold-500/20 text-sm font-bold text-pk-gold-400">
              PL
            </div>
            <div>
              <p className="text-sm font-medium text-white dark:text-pk-green-100">Pakistan Legal Search Engine</p>
              <p className="text-xs text-pk-green-400 dark:text-pk-green-500">For legal research purposes only</p>
            </div>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
              Privacy
            </a>
            <a href="#" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
              Terms
            </a>
            <a href="#" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
              Data Sources
            </a>
          </div>
        </div>
        <div className="mt-6 border-t border-pk-green-800 pt-6 text-center dark:border-pk-green-950">
          <p className="text-xs text-pk-green-500 dark:text-pk-green-600">
            &copy; {new Date().getFullYear()} PLSE. All source links open official government websites.
          </p>
        </div>
      </div>
    </footer>
  );
}
