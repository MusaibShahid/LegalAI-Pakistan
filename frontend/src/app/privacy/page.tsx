import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - LegalSearch Pakistan",
  description: "Privacy Policy for LegalSearch Pakistan legal search engine.",
};

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-pk-green-900 dark:text-pk-green-100">Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-pk-green-400">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="mt-8 space-y-8 text-zinc-700 dark:text-pk-green-300">
        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">1. Information We Collect</h2>
          <p className="mt-3 leading-relaxed">
            LegalSearch Pakistan collects minimal information to provide our legal search services:
          </p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li><strong>Search Queries:</strong> We temporarily process your search queries to return relevant results. Queries are not stored permanently.</li>
            <li><strong>Usage Data:</strong> We collect anonymous usage statistics (page views, search frequency) to improve our service.</li>
            <li><strong>Device Information:</strong> Basic browser and device information for compatibility and security purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">2. How We Use Information</h2>
          <p className="mt-3 leading-relaxed">We use collected information to:</p>
          <ul className="mt-3 list-disc pl-6 space-y-2">
            <li>Provide and improve our legal search services</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Ensure security and prevent abuse</li>
            <li>Display relevant advertisements through Google AdSense</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">3. Google AdSense</h2>
          <p className="mt-3 leading-relaxed">
            We use Google AdSense to display advertisements. Google AdSense uses cookies and web beacons to serve ads based on your prior visits to our website or other websites. You may opt out of personalized advertising by visiting{" "}
            <a href="https://www.google.com/settings/ads" className="text-pk-green-600 hover:text-pk-green-800 dark:text-pk-green-400" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">4. Cookies</h2>
          <p className="mt-3 leading-relaxed">
            We use essential cookies for site functionality and analytics cookies to understand usage patterns. Third-party advertisers may also use cookies. You can control cookie settings through your browser preferences.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">5. Data Security</h2>
          <p className="mt-3 leading-relaxed">
            We implement reasonable security measures to protect your information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">6. Third-Party Links</h2>
          <p className="mt-3 leading-relaxed">
            Our service contains links to external legal resources (government websites, legal databases). We are not responsible for the privacy practices of these external sites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">7. Changes to This Policy</h2>
          <p className="mt-3 leading-relaxed">
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-pk-green-800 dark:text-pk-green-200">8. Contact Us</h2>
          <p className="mt-3 leading-relaxed">
            If you have questions about this Privacy Policy, please contact us through our website.
          </p>
        </section>
      </div>
    </div>
  );
}
