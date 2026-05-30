interface StructuredDataProps {
  type: "judgment" | "law" | "search";
  data: Record<string, unknown>;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  let jsonLd: Record<string, unknown> = {};

  if (type === "judgment") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "LegalCase",
      name: data.title,
      description: data.description,
      url: `https://legalsearch.pk/judgment/${data.id}`,
      datePublished: data.date,
      author: {
        "@type": "Organization",
        name: data.court,
      },
      identifier: {
        "@type": "PropertyValue",
        propertyID: "citation",
        value: data.citation,
      },
      jurisdiction: {
        "@type": "Country",
        name: "Pakistan",
      },
      ...(data.judge && {
        judge: {
          "@type": "Person",
          name: data.judge,
        },
      }),
    };
  } else if (type === "law") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Legislation",
      name: `${data.law_name} - Section ${data.section_number}`,
      description: data.section_text,
      url: `https://legalsearch.pk/law/${data.id}`,
      legislationIdentifier: data.section_number,
      legislationType: "statute",
      jurisdiction: {
        "@type": "Country",
        name: "Pakistan",
      },
    };
  } else if (type === "search") {
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      name: `Search results for "${data.query}"`,
      url: `https://legalsearch.pk/search?q=${encodeURIComponent(data.query as string)}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: data.total,
        itemListElement: ((data.results as Array<Record<string, unknown>>) || []).slice(0, 10).map(
          (result: Record<string, unknown>, index: number) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": result.type === "judgment" ? "LegalCase" : "Legislation",
              name: result.title,
              url: `https://legalsearch.pk/${result.type === "judgment" ? "judgment" : "law"}/${result.id}`,
            },
          })
        ),
      },
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
