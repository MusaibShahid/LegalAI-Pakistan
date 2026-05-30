import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-pk-green-800 bg-pk-green-900 dark:border-pk-green-950 dark:bg-pk-green-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pk-gold-500/20 text-lg font-bold text-pk-gold-400">
                LS
              </div>
              <div>
                <p className="text-base font-bold text-white dark:text-pk-green-100">LegalSearch Pakistan</p>
                <p className="text-xs text-pk-green-400 dark:text-pk-green-500">Free Legal Research Engine</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-pk-green-300 dark:text-pk-green-400">
              Search Pakistani laws, judgments, and citations across Supreme Court, High Courts, and statutory sources.
            </p>
          </div>

          {/* Search Links */}
          <div>
            <h3 className="text-sm font-semibold text-pk-gold-400 mb-4">Quick Search</h3>
            <ul className="space-y-2">
              <li><Link href="/search?q=bail" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Bail Judgments</Link></li>
              <li><Link href="/search?q=murder" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Murder Cases</Link></li>
              <li><Link href="/search?q=cybercrime" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Cybercrime Laws</Link></li>
              <li><Link href="/search?q=property" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Property Disputes</Link></li>
              <li><Link href="/search?q=divorce" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Family Law</Link></li>
            </ul>
          </div>

          {/* Law Sections */}
          <div>
            <h3 className="text-sm font-semibold text-pk-gold-400 mb-4">Popular Sections</h3>
            <ul className="space-y-2">
              <li><Link href="/search?q=302+PPC" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Section 302 PPC (Murder)</Link></li>
              <li><Link href="/search?q=497+CrPC" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Section 497 CrPC (Bail)</Link></li>
              <li><Link href="/search?q=420+PPC" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Section 420 PPC (Fraud)</Link></li>
              <li><Link href="/search?q=489F+PPC" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Section 489-F PPC (Cheque)</Link></li>
              <li><Link href="/search?q=Article+199" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Article 199 (Writ)</Link></li>
            </ul>
          </div>

          {/* Courts */}
          <div>
            <h3 className="text-sm font-semibold text-pk-gold-400 mb-4">Courts</h3>
            <ul className="space-y-2">
              <li><Link href="/search?q=Supreme+Court" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Supreme Court</Link></li>
              <li><Link href="/search?q=Lahore+High+Court" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Lahore High Court</Link></li>
              <li><Link href="/search?q=Sindh+High+Court" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Sindh High Court</Link></li>
              <li><Link href="/search?q=Islamabad+High+Court" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Islamabad High Court</Link></li>
              <li><Link href="/tools" className="text-sm text-pk-green-300 hover:text-pk-gold-300 dark:text-pk-green-400 dark:hover:text-pk-gold-400">Legal Tools</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-pk-green-800 pt-6 dark:border-pk-green-950">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-pk-green-500 dark:text-pk-green-600">
              &copy; {new Date().getFullYear()} LegalSearch Pakistan. For legal research purposes only. Always verify against official sources.
            </p>
            <div className="flex gap-6">
              <Link href="/" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
                Home
              </Link>
              <Link href="/search" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
                Search
              </Link>
              <Link href="/tools" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
                Tools
              </Link>
              <Link href="/sources" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
                Sources
              </Link>
              <Link href="/privacy" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
                Privacy
              </Link>
              <Link href="/terms" className="text-xs text-pk-green-400 transition-colors hover:text-pk-gold-400 dark:text-pk-green-500 dark:hover:text-pk-gold-400">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
