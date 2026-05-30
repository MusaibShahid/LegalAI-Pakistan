import type { SearchResponse, Judgment, LawSection } from "@/types";

const demoJudgmentDetails: Record<string, Judgment> = {
  "judgment-001": {
    id: "judgment-001",
    title: "Mst. Nusrat Bibi vs. The State",
    citation: "2006 SCMR 109",
    court: "Supreme Court of Pakistan",
    bench: "Mr. Justice Iftikhar Muhammad Chaudhry, CJ",
    judge: "Mr. Justice Mohammad Nawaz Abbasi",
    date: "2006-03-15",
    case_number: "Crl.A. 234-K/2005",
    sections: ["489-F PPC", "497 CrPC"],
    full_text:
      "This appeal, by leave of the Court, is directed against the judgment dated 22-11-2005 passed by the High Court of Sindh at Karachi whereby the learned Judge-in-Chambers allowed the application for pre-arrest bail filed by the respondent-accused in respect of FIR No. 123/2005 registered under Section 489-F PPC at Police Station Civil Lines, Karachi.\n\nThe learned counsel for the appellant contends that the High Court has erred in granting pre-arrest bail to the respondent without considering the fact that the cheque in question was issued by the respondent to the appellant in discharge of a legally enforceable debt. It was contended that the respondent had issued a cheque for Rs. 500,000/- in favor of the appellant which was dishonoured on presentation.\n\nThe learned counsel further contended that the notice of demand under Section 489-F was duly served upon the respondent, who failed to make payment within the stipulated period. Despite this, the respondent was granted pre-arrest bail on the ground that the dispute was of a civil nature.\n\nWe have heard the learned counsel for the parties and have perused the record. The only ground on which the learned Judge-in-Chambers granted pre-arrest bail was that the dispute was of a civil nature. However, this Court has repeatedly held that the offence under Section 489-F PPC is a serious offence and bail should not be granted as a matter of routine.\n\nFor the foregoing reasons, this appeal is allowed and the impugned judgment of the High Court is set aside. The respondent is directed to surrender before the trial court forthwith.",
    source_url: "https://www.supremecourt.gov.pk/judgments/2006-scmr-109",
    pdf_url: "https://www.supremecourt.gov.pk/judgments/2006-scmr-109.pdf",
  },
  "judgment-002": {
    id: "judgment-002",
    title: "Muhammad Aslam vs. Federation of Pakistan",
    citation: "2006 SCMR 112",
    court: "Supreme Court of Pakistan",
    bench: "Mr. Justice Khalil-ur-Rehman Ramday",
    judge: "Mr. Justice Syed Jamshed Ali",
    date: "2006-02-28",
    case_number: "C.P. 567/2005",
    sections: ["Article 199", "184(3)"],
    full_text:
      "This constitutional petition under Article 184(3) of the Constitution of Islamic Republic of Pakistan has been filed by the petitioner challenging the validity of certain amendments introduced in the Criminal Law Amendment Act.\n\nThe petitioner contends that the impugned amendments are ultra vires the Constitution and violate the fundamental rights guaranteed under Articles 9, 14, and 25 of the Constitution. It is submitted that the amendments confer unguided and arbitrary powers upon the executive which are not subject to any checks and balances.\n\nThe learned Attorney General for Pakistan has opposed this petition on the ground that the amendments are within the legislative competence of the Parliament and are meant to streamline the criminal justice system.\n\nWe have given our anxious consideration to the submissions made by the learned counsel for the parties. This Court has held in a number of judgments that Article 184(3) confers original jurisdiction on this Court only in matters involving questions of public importance with reference to the enforcement of any of the Fundamental Rights.\n\nWe have examined the impugned amendments and are of the considered opinion that they do not, prima facie, violate any fundamental right. The petition is, therefore, dismissed with the observation that the petitioner may avail any other remedy available under the law.",
    source_url: "https://www.supremecourt.gov.pk/judgments/2006-scmr-112",
  },
  "judgment-003": {
    id: "judgment-003",
    title: "State vs. Muhammad Yousaf",
    citation: "2005 SCMR 1456",
    court: "Supreme Court of Pakistan",
    bench: "Mr. Justice Tassaduq Hussain Jillani",
    judge: "Mr. Justice Faqir Muhammad Khokhar",
    date: "2005-12-10",
    case_number: "Crl.A. 189/2005",
    sections: ["489-F PPC", "498-A PPC", "497 CrPC"],
    full_text:
      "The State has filed this appeal against the judgment of the Lahore High Court dated 15-08-2005 whereby the respondent was acquitted of the charge under Section 489-F PPC. The respondent was originally convicted by the trial court under Section 489-F PPC for issuing a cheque without sufficient funds.\n\nThe trial court had found that the respondent had issued a cheque for Rs. 300,000/- to the complainant in respect of a business transaction. The cheque was dishonoured upon presentation due to insufficient funds. A notice of demand was sent to the respondent who failed to make payment within the prescribed period.\n\nThe High Court acquitted the respondent on the ground that the prosecution had failed to prove that the cheque was issued in discharge of a legally enforceable debt or liability. The High Court observed that the transaction between the parties was of a commercial nature and there was no legally enforceable debt.\n\nWe have examined the evidence on record. This Court has consistently held that for a conviction under Section 489-F PPC, it must be proved beyond reasonable doubt that the accused issued the cheque with the intent to defraud or in discharge of a legally enforceable debt or liability.\n\nAfter careful consideration of the evidence, we are of the view that the High Court has correctly appreciated the evidence and the findings recorded by it do not suffer from any legal infirmity. This appeal is, therefore, dismissed.",
    source_url: "https://www.supremecourt.gov.pk/judgments/2005-scmr-1456",
    pdf_url: "https://www.supremecourt.gov.pk/judgments/2005-scmr-1456.pdf",
  },
};

const demoLawDetails: Record<string, LawSection> = {
  "law-001": {
    id: "law-001",
    law_name: "Pakistan Penal Code (Act XLV of 1860)",
    section_number: "489-F",
    section_text:
      "Whoever, being a drawer of a cheque, makes or issues a cheque in favour of any person for the payment of money to satisfy a legally enforceable debt or liability, which cheque is dishonoured due to insufficiency of funds in the account of the drawer or exceeds the amount arranged to be paid from that account, shall, without prejudice to any other provision of this Code, be punished with imprisonment for a term which may extend to three years, or with fine, or with both:\n\nProvided that the said cheque shall have been presented to the bank within a period of six months from the date on which it is drawn or within the period of its validity, whichever is earlier:\n\nProvided further that the holder or payee of the cheque, as the case may be, makes a demand for the payment of the said amount of money by giving a notice in writing to the drawer of the cheque within thirty days of the receipt of information by him from the bank regarding the return of the cheque as unpaid:\n\nProvided also that the drawer of such cheque fails to make the payment of the said amount of money to the holder or payee, as the case may be, within fifteen days of the receipt of the said notice.",
    related_sections: ["489-A PPC — Counterfeiting currency-notes or bank-notes", "489-B PPC — Using as genuine, forged or counterfeit currency-notes or bank-notes", "489-C PPC — Possession of forged or counterfeit currency-notes or bank-notes", "489-D PPC — Making or possessing instruments or materials for forgoing or counterfeiting currency-notes or bank-notes", "489-E PPC — Making or using documents resembling currency-notes or bank-notes"],
    related_judgments: ["2006 SCMR 109 — Mst. Nusrat Bibi vs. The State", "2005 SCMR 1456 — State vs. Muhammad Yousaf", "2023 PCrLJ 789 — Shahzad Akbar vs. The State", "2024 PCrLJ 156 — Muhammad Arif vs. The State"],
    source_url: "https://pakistancode.gov.pk/sections/489-F-PPC",
  },
  "law-002": {
    id: "law-002",
    law_name: "Code of Criminal Procedure (Act V of 1898)",
    section_number: "497",
    section_text:
      "(1) When any person accused of any non-bailable offence is arrested or detained without warrant by an officer-in-charge of a police station, or appears or is brought before a Court, he may be released on bail by such Court or by the Court to which such officer is subordinate:\n\nProvided that the Court may direct that any person under the age of sixteen years or any woman or any sick or infirm person accused of such an offence be released on bail.\n\n(2) If it appears to the officer or Court that there are not reasonable grounds to believe that the accused has committed a non-bailable offence, but that there are sufficient grounds for further inquiry into his guilt, the accused shall, pending such inquiry, be released on bail, or at the discretion of such officer or Court, on the execution of a bond without sureties for his appearance.\n\n(3) When a person accused of a non-bailable offence is released on bail under sub-section (2), the bond shall be for a sum proportionate to the means of the accused and shall be executed by the accused.\n\n(4) Nothing in this section shall be deemed to be in derogation of the provisions of Section 498.\n\n(5) A High Court or Court of Session may, for the purposes of granting bail, direct that a person be released on his own bond.",
    related_sections: ["496 CrPC — Bail in bailable offences", "498 CrPC — Power to direct admission to bail or reduction of bail", "498-A CrPC — Direction for grant of bail to person apprehending arrest"],
    related_judgments: ["2006 SCMR 109 — Mst. Nusrat Bibi vs. The State", "PLD 2022 SC 567 — Muhammad Nawaz vs. The State"],
    source_url: "https://pakistancode.gov.pk/sections/497-CrPC",
  },
};

const demoJudgments: SearchResponse = {
  query: "2006 SCMR 109",
  search_type: "citation",
  page: 1,
  page_size: 10,
  total: 24,
  results: [
    {
      id: "judgment-001",
      title: "Mst. Nusrat Bibi vs. The State",
      citation: "2006 SCMR 109",
      court: "Supreme Court of Pakistan",
      date: "2006-03-15",
      sections: ["489-F PPC", "497 CrPC"],
      description:
        "Appeal against grant of pre-arrest bail in a case under Section 489-F PPC. The Court examined the parameters for granting anticipatory bail in cheque dishonour cases and held that the High Court had erred in granting pre-arrest bail without considering the severity of the offence and the quantum of punishment prescribed.",
      source_url: "https://www.supremecourt.gov.pk/judgments/2006-scmr-109",
      pdf_url: "https://www.supremecourt.gov.pk/judgments/2006-scmr-109.pdf",
      score: 100,
      type: "judgment",
    },
    {
      id: "judgment-002",
      title: "Muhammad Aslam vs. Federation of Pakistan",
      citation: "2006 SCMR 112",
      court: "Supreme Court of Pakistan",
      date: "2006-02-28",
      sections: ["Article 199", "184(3)"],
      description:
        "Constitutional petition challenging the validity of certain provisions of the Criminal Law Amendment Act. The Supreme Court examined the scope of original jurisdiction under Article 184(3) and the parameters for judicial review of legislation.",
      source_url: "https://www.supremecourt.gov.pk/judgments/2006-scmr-112",
      score: 92,
      type: "judgment",
    },
    {
      id: "judgment-003",
      title: "State vs. Muhammad Yousaf",
      citation: "2005 SCMR 1456",
      court: "Supreme Court of Pakistan",
      date: "2005-12-10",
      sections: ["489-F PPC", "498-A PPC", "497 CrPC"],
      description:
        "Criminal appeal against conviction under Section 489-F PPC for cheque dishonour. The Supreme Court upheld the conviction and discussed the evidentiary requirements for proving a legally enforceable debt or liability under Section 489-F.",
      source_url: "https://www.supremecourt.gov.pk/judgments/2005-scmr-1456",
      pdf_url: "https://www.supremecourt.gov.pk/judgments/2005-scmr-1456.pdf",
      score: 88,
      type: "judgment",
    },
    {
      id: "judgment-004",
      title: "Shahzad Akbar vs. The State",
      citation: "2023 PCrLJ 789",
      court: "Lahore High Court",
      date: "2023-05-22",
      sections: ["489-F PPC", "497 CrPC", "498 CrPC"],
      description:
        "Bail petition in a case under Section 489-F PPC. The Lahore High Court examined the distinction between pre-arrest and post-arrest bail in cheque dishonour cases and laid down guidelines for courts dealing with such applications.",
      source_url: "https://data.lhc.gov.pk/judgments/2023-pcrlj-789",
      score: 85,
      type: "judgment",
    },
    {
      id: "judgment-005",
      title: "Altaf Hussain vs. Mst. Zahida Parveen",
      citation: "2022 YLR 2345",
      court: "Sindh High Court",
      date: "2022-08-14",
      sections: ["489-F PPC", "Article 199"],
      description:
        "Constitutional petition against dismissal of maintenance claim. The Sindh High Court examined the interplay between family law provisions and the constitutional jurisdiction under Article 199, holding that alternative remedy does not bar constitutional petition in exceptional circumstances.",
      source_url: "https://caselaw.shc.gov.pk/judgments/2022-ylr-2345",
      pdf_url: "https://caselaw.shc.gov.pk/judgments/2022-ylr-2345.pdf",
      score: 82,
      type: "judgment",
    },
    {
      id: "judgment-006",
      title: "Muhammad Arif vs. The State",
      citation: "2024 PCrLJ 156",
      court: "Lahore High Court",
      date: "2024-01-10",
      sections: ["489-F PPC"],
      description:
        "Criminal revision against conviction under Section 489-F PPC. The Court examined the requirement of notice under Section 138 of the Negotiable Instruments Act as a condition precedent for prosecution under Section 489-F PPC.",
      source_url: "https://data.lhc.gov.pk/judgments/2024-pcrlj-156",
      score: 78,
      type: "judgment",
    },
    {
      id: "law-001",
      title: "Pakistan Penal Code — Section 489-F",
      citation: "489-F PPC",
      court: "Pakistan Code",
      date: "1860 (amended)",
      sections: ["489-F PPC", "489-A PPC", "489-B PPC", "489-C PPC", "489-D PPC", "489-E PPC"],
      description:
        "Section 489-F of the Pakistan Penal Code deals with dishonour of cheques. It prescribes punishment for issuance of a cheque without sufficient funds or with the intent to defraud. The section requires a valid notice of demand and failure to pay within the prescribed period.",
      source_url: "https://pakistancode.gov.pk/sections/489-F-PPC",
      score: 95,
      type: "law",
    },
    {
      id: "judgment-008",
      title: "Federation of Pakistan vs. Abdul Qadir Jilani",
      citation: "2021 SCMR 2041",
      court: "Supreme Court of Pakistan",
      date: "2021-07-19",
      sections: ["Section 21 PECA", "Article 199", "Article 184(3)"],
      description:
        "Landmark judgment examining the scope of Section 21 of the Prevention of Electronic Crimes Act (PECA) 2016. The Supreme Court interpreted the parameters of 'electronic evidence' and the admissibility of digital records in criminal proceedings.",
      source_url: "https://www.supremecourt.gov.pk/judgments/2021-scmr-2041",
      pdf_url: "https://www.supremecourt.gov.pk/judgments/2021-scmr-2041.pdf",
      score: 91,
      type: "judgment",
    },
    {
      id: "judgment-009",
      title: "Muhammad Nawaz vs. The State",
      citation: "PLD 2022 SC 567",
      court: "Supreme Court of Pakistan",
      date: "2022-03-28",
      sections: ["497 CrPC", "498 CrPC", "Article 185(2)"],
      description:
        "Appeal against rejection of bail in a murder case. The Supreme Court examined the principles governing bail under Section 497 CrPC and the distinction between 'further inquiry' and 'reasonable grounds' for believing the accused is guilty.",
      source_url: "https://www.supremecourt.gov.pk/judgments/pld-2022-sc-567",
      score: 87,
      type: "judgment",
    },
    {
      id: "law-002",
      title: "Code of Criminal Procedure — Section 497",
      citation: "497 CrPC",
      court: "Pakistan Code",
      date: "1898 (amended)",
      sections: ["497 CrPC", "496 CrPC", "498 CrPC", "498-A CrPC"],
      description:
        "Section 497 CrPC deals with the grant of bail in non-bailable offences. It provides that a person accused of a non-bailable offence may be released on bail if there are no reasonable grounds to believe that the accused is guilty of an offence punishable with death or imprisonment for life.",
      source_url: "https://pakistancode.gov.pk/sections/497-CrPC",
      score: 90,
      type: "law",
    },
  ],
};

const demoSearchesByQuery: Record<string, SearchResponse> = {
  "2006 SCMR 109": demoJudgments,
};

export function getDemoResults(query: string, page: number = 1): SearchResponse | null {
  // Check for exact match first
  if (demoSearchesByQuery[query]) {
    return demoSearchesByQuery[query];
  }

  // Check for citation pattern
  const citationMatch = query.match(/(\d{4})\s+(SCMR|PLD|YLR|PCrLJ|MLD|CLD)\s+(\d+)/i);
  if (citationMatch) {
    const filtered = demoJudgments.results.filter(
      (r) => r.citation && r.citation.toLowerCase().includes(query.toLowerCase())
    );
    if (filtered.length > 0) {
      return {
        ...demoJudgments,
        query,
        search_type: "citation",
        total: filtered.length,
        results: filtered,
      };
    }
  }

  // Check for section pattern
  const sectionMatch = query.match(/(\d+[A-Z]?)\s+(PPC|CrPC|PECA|QSO|SO)/i);
  if (sectionMatch) {
    const filtered = demoJudgments.results.filter(
      (r) =>
        r.sections.some((s) => s.toLowerCase().includes(query.toLowerCase())) ||
        r.title.toLowerCase().includes(query.toLowerCase())
    );
    if (filtered.length > 0) {
      return {
        ...demoJudgments,
        query,
        search_type: "section",
        total: filtered.length,
        results: filtered,
      };
    }
  }

  // Keyword search
  const keywords = query.toLowerCase().split(/\s+/);
  const filtered = demoJudgments.results.filter((r) =>
    keywords.some(
      (k) =>
        r.title.toLowerCase().includes(k) ||
        r.description.toLowerCase().includes(k) ||
        r.court.toLowerCase().includes(k) ||
        r.sections.some((s) => s.toLowerCase().includes(k))
    )
  );

  if (filtered.length > 0) {
    return {
      ...demoJudgments,
      query,
      search_type: "keyword",
      total: filtered.length,
      results: filtered,
    };
  }

  // Court-specific
  const courtNames = ["supreme court", "lahore high court", "sindh high court", "islamabad high court"];
  const matchedCourt = courtNames.find((c) => query.toLowerCase().includes(c));
  if (matchedCourt) {
    const filtered = demoJudgments.results.filter((r) =>
      r.court.toLowerCase().includes(matchedCourt)
    );
    return {
      ...demoJudgments,
      query,
      search_type: "court",
      total: filtered.length,
      results: filtered,
    };
  }

  return null;
}

export function getDemoJudgment(id: string): Judgment | null {
  return demoJudgmentDetails[id] || null;
}

export function getDemoLawSection(id: string): LawSection | null {
  return demoLawDetails[id] || null;
}
