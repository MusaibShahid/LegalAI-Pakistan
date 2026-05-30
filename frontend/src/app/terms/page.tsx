import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - LegalSearch Pakistan",
  description: "Terms of Service for LegalSearch Pakistan legal search engine.",
};

export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-pk-green-900 dark:text-pk-green-100">Terms of Service</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-pk-green-400">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-8 space-y-8 text-zinc-700 dark:text-pk-green-300">
        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">1. Acceptance of Terms</h2>
          <p className="mt-3 leading-relaxed">
            By accessing and using LegalSearch Pakistan, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">2. Description of Service</h2>
          <p className="mt-3 leading-relaxed">
            LegalSearch Pakistan is a free legal research tool that aggregates and indexes publicly available legal information from Pakistani courts and legal databases. We provide search functionality for judgments, laws, and legal citations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">3. Disclaimer of Legal Advice</h2>
          <p className="mt-3 leading-relaxed">
            <strong>LegalSearch Pakistan is NOT a law firm and does NOT provide legal advice.</strong> The information provided through our service is for general informational and research purposes only. It should not be considered as legal advice or used as a substitute for consultation with a qualified legal professional.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">4. Accuracy of Information</h2>
          <p className="mt-3 leading-relaxed">
            While we strive to provide accurate and up-to-date information, we make no warranties or representations about the accuracy, completeness, or reliability of any content available through our service. Users should always verify legal references against official published sources.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">5. User Responsibilities</h2>
          <p className="mt-3 leading-relaxed">Users agree to:</p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Use the service for lawful purposes only</li>
            <li>Not attempt to disrupt or overload our systems</li>
            <li>Not use automated tools to scrape or download content excessively</li>
            <li>Verify all legal information against official sources before relying on it</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">6. Intellectual Property</h2>
          <p className="mt-3 leading-relaxed">
            The content available through LegalSearch Pakistan is sourced from publicly available legal databases and government websites. We respect intellectual property rights and provide attribution and links to original sources where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">7. Limitation of Liability</h2>
          <p className="mt-3 leading-relaxed">
            LegalSearch Pakistan shall not be liable for any damages arising from the use of or inability to use our service, including but not limited to direct, indirect, incidental, consequential, or punitive damages.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">8. Changes to Terms</h2>
          <p className="mt-3 leading-relaxed">
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">9. Contact</h2>
          <p className="mt-3 leading-relaxed">
            For questions about these Terms of Service, please contact us through our website.
          </p>
        </section>
      </div>
    </div>
  );
}
