"""Free legal tools for Pakistani law."""
from app.schemas.tools import (
    LimitationInfo,
    CourtFeeInfo,
    ProcedureStep,
    LegalProcedure,
    ProcedureCategory,
    BailInfo,
    LegalToolkit,
)


# =============================================================================
# Limitation Periods under the Limitation Act 1908
# =============================================================================

LIMITATION_PERIODS = [
    LimitationInfo(
        article="Schedule - Article 120",
        description="Suit for possession of immovable property",
        period="12 years",
        time_start="When the right to possession accrues",
        notes="Most common limitation period for property disputes. Applies when the defendant has dispossessed the plaintiff.",
    ),
    LimitationInfo(
        article="Schedule - Article 64",
        description="Suit for possession of immovable property based on title",
        period="12 years",
        time_start="When the defendant's possession becomes adverse to the plaintiff",
        notes="Applies in adverse possession cases.",
    ),
    LimitationInfo(
        article="Schedule - Article 65",
        description="Suit for possession of immovable property by a mortgagee",
        period="12 years",
        time_start="When the mortgage money becomes due",
    ),
    LimitationInfo(
        article="Schedule - Article 35",
        description="Suit on a promissory note or bond payable in installments",
        period="3 years",
        time_start="Default in payment of each installment",
    ),
    LimitationInfo(
        article="Schedule - Article 36",
        description="Suit on a bill of exchange or promissory note payable on demand",
        period="3 years",
        time_start="When the bill or note is presented for payment",
    ),
    LimitationInfo(
        article="Schedule - Article 52",
        description="Suit for recovery of money lent or advanced",
        period="3 years",
        time_start="When the loan is made or when repayment is demanded",
    ),
    LimitationInfo(
        article="Schedule - Article 25",
        description="Suit for arrears of rent",
        period="3 years",
        time_start="When the arrears become due",
    ),
    LimitationInfo(
        article="Schedule - Article 7",
        description="Suit for specific performance of a contract",
        period="3 years",
        time_start="When the contract ought to have been performed",
        notes="Extended to 3 years from the date fixed for performance or when the plaintiff has notice of repudiation.",
    ),
    LimitationInfo(
        article="Schedule - Article 91",
        description="Suit for compensation for breach of contract",
        period="3 years",
        time_start="When the contract is broken",
    ),
    LimitationInfo(
        article="Schedule - Article 22",
        description="Suit for compensation for malicious prosecution",
        period="1 year",
        time_start="When the plaintiff is acquitted or the prosecution is terminated in his favor",
    ),
    LimitationInfo(
        article="Schedule - Article 72",
        description="Suit for recovery of movable property",
        period="3 years",
        time_start="When the right to possession accrues",
    ),
    LimitationInfo(
        article="Section 5",
        description="Appeal or application for review/revision (condonation of delay)",
        period="Discretionary",
        time_start="After expiry of limitation period",
        notes="Court may admit appeal if sufficient cause for delay is shown. This is discretionary, not a right.",
    ),
    LimitationInfo(
        article="Schedule - Article 163",
        description="Suit on a foreign judgment",
        period="3 years",
        time_start="When the judgment is delivered or when it becomes enforceable in Pakistan",
    ),
    LimitationInfo(
        article="Schedule - Article 44",
        description="Suit for partition of joint property",
        period="12 years",
        time_start="When the right to partition accrues or when exclusive possession is taken by a co-sharer",
        notes="Partition suits have a longer limitation period as co-ownership implies continuing rights.",
    ),
    LimitationInfo(
        article="Schedule - Article 134",
        description="Suit for declaration and consequential relief",
        period="3 years",
        time_start="When the right to sue first accrues",
        notes="Declaratory suits must be filed within 3 years of the cause of action.",
    ),
    LimitationInfo(
        article="Schedule - Article 142",
        description="Suit for recovery of land by a landlord from a tenant",
        period="12 years",
        time_start="When the tenancy is determined and notice to quit has expired",
    ),
    LimitationInfo(
        article="Criminal Procedure Code 1898 Section 468",
        description="Criminal prosecution for offenses punishable with fine only",
        period="6 months",
        time_start="When the offense is committed",
        notes="Cognizance of certain offenses is barred by time under CrPC Section 468.",
    ),
    LimitationInfo(
        article="Schedule - Article 105",
        description="Suit for recovery of dower (mehr) by a Muslim wife",
        period="3 years",
        time_start="When the marriage is dissolved or when demand is made",
    ),
    LimitationInfo(
        article="Schedule - Article 32",
        description="Suit to enforce payment of a legacy or share in inheritance",
        period="12 years",
        time_start="When the legacy or share becomes payable",
        notes="Inheritance and succession matters have a longer limitation period due to the nature of family property.",
    ),
]

# =============================================================================
# Court Fee Information
# =============================================================================

COURT_FEES = [
    CourtFeeInfo(
        proceeding="Civil Suit (plaint)",
        fee_type="Ad Valorem",
        fee_description="Court fee as a percentage of the suit value. Generally ranges from 1% to 5% depending on the nature of the suit and jurisdiction.",
        estimated_fee="Varies (1-5% of suit value)",
        notes="Court Fees Act 1870 governs the applicable fees. Suits for possession, recovery of money, and specific performance require ad valorem fees.",
    ),
    CourtFeeInfo(
        proceeding="Writ Petition (Constitutional)",
        fee_type="Fixed",
        fee_description="Fixed court fee for filing a writ petition under Article 199 of the Constitution. Generally nominal.",
        estimated_fee="Rs. 100 - 500",
        notes="Writ petitions (constitutional jurisdiction) have nominal fixed fees. This makes constitutional remedies accessible.",
    ),
    CourtFeeInfo(
        proceeding="Civil Appeal",
        fee_type="Fixed + Ad Valorem",
        fee_description="Court fee for filing a civil appeal. Usually a fixed fee plus a small percentage of the disputed amount.",
        estimated_fee="Rs. 500 - 5,000 + ad valorem",
    ),
    CourtFeeInfo(
        proceeding="Criminal Appeal",
        fee_type="Fixed",
        fee_description="Nominal fixed fee for criminal appeals.",
        estimated_fee="Rs. 50 - 200",
        notes="Criminal appeals have very low court fees to ensure access to justice.",
    ),
    CourtFeeInfo(
        proceeding="Family Case (Dissolution of Marriage)",
        fee_type="Fixed",
        fee_description="Fixed court fee for family cases including dissolution of marriage, khula, and maintenance.",
        estimated_fee="Rs. 100 - 500",
        notes="Family cases have nominal fees under the Family Courts Act 1964.",
    ),
    CourtFeeInfo(
        proceeding="Execution Petition",
        fee_type="Fixed + Ad Valorem",
        fee_description="Fee for filing an execution application to enforce a decree.",
        estimated_fee="Rs. 200 - 1,000",
    ),
    CourtFeeInfo(
        proceeding="Bail Application",
        fee_type="Fixed",
        fee_description="Nominal fee for filing bail applications before Sessions Court or High Court.",
        estimated_fee="Rs. 50 - 200",
        notes="Bail applications have minimal fees as they relate to personal liberty.",
    ),
    CourtFeeInfo(
        proceeding="Review Application",
        fee_type="Fixed",
        fee_description="Fixed fee for filing a review petition against a judgment.",
        estimated_fee="Rs. 200 - 500",
    ),
    CourtFeeInfo(
        proceeding="Civil Revision",
        fee_type="Fixed",
        fee_description="Fee for filing a civil revision petition before the High Court.",
        estimated_fee="Rs. 500 - 1,000",
    ),
]

# =============================================================================
# Legal Procedures
# =============================================================================

PROCEDURE_CATEGORIES = [
    ProcedureCategory(
        id="criminal",
        name="Criminal Procedure",
        description="Procedural guides for criminal cases including bail, appeals, and trials.",
        icon="scale",
        procedures=[
            LegalProcedure(
                id="bail-procedure",
                title="How to Apply for Bail",
                category="Criminal Procedure",
                overview="This guide explains the procedure for applying for bail in criminal cases in Pakistan, including pre-arrest bail (anticipatory bail), post-arrest bail, and regular bail.",
                applicable_laws=[
                    "Criminal Procedure Code 1898 (Sections 496-498)",
                    "Criminal Procedure Code 1898 (Section 561-A)",
                    "Constitution of Pakistan 1973 (Article 10)",
                ],
                steps=[
                    ProcedureStep(
                        step_number=1,
                        title="Determine Type of Bail",
                        description="Identify whether you need: (1) Pre-arrest bail (Section 498 CrPC) - filed when arrest is imminent; (2) Post-arrest bail (Section 497 CrPC) - filed after arrest for non-bailable offenses; or (3) Regular bail for bailable offenses.",
                        documents_required=["First Information Report (FIR)", "Arrest warrant (if issued)"],
                        tips="For bailable offenses, bail is a matter of right. For non-bailable offenses, the court has discretion.",
                    ),
                    ProcedureStep(
                        step_number=2,
                        title="Prepare Bail Application",
                        description="Draft a bail application stating the grounds for bail. Key grounds include: no prima facie case, accused is a permanent resident, no criminal record, or the offense is bailable.",
                        documents_required=[
                            "Bail application (drafted by advocate)",
                            "Copy of FIR",
                            "Arrest/stay order",
                            "Surety documents",
                            "Affidavit of the applicant",
                        ],
                        tips="A strong bail application emphasizes the weakness of the prosecution's case and the petitioner's roots in the community.",
                    ),
                    ProcedureStep(
                        step_number=3,
                        title="File Before Appropriate Court",
                        description="File the bail application before: (a) Sessions Court for regular bail; (b) High Court for post-arrest bail; or (c) High Court for pre-arrest bail under Section 498 CrPC.",
                        estimated_time="1-3 days for filing",
                    ),
                    ProcedureStep(
                        step_number=4,
                        title="Court Hearing",
                        description="The court hears arguments from both sides. The prosecution may oppose bail on grounds of severity of offense or likelihood of absconding. The court may grant bail with or without conditions.",
                        estimated_time="1-7 days for hearing",
                        tips="Courts typically grant bail on furnishing surety bonds. The quantum of surety depends on the court's discretion.",
                    ),
                    ProcedureStep(
                        step_number=5,
                        title="Furnish Surety",
                        description="If bail is granted, furnish surety bonds as directed by the court. The surety must be a person of means who undertakes to ensure the accused appears for trial.",
                        documents_required=["Surety bond", "CNIC of surety", "Property documents (if required)"],
                        estimated_time="1-2 days",
                    ),
                ],
                notes="Bail is a fundamental right under Article 10 of the Constitution. The principle is 'bail is the rule, jail is the exception' except for certain grave offenses.",
            ),
            LegalProcedure(
                id="criminal-complaint",
                title="How to File a Criminal Complaint",
                category="Criminal Procedure",
                overview="Guide to filing a criminal complaint in Pakistan, whether through FIR at a police station or directly before a Magistrate.",
                applicable_laws=[
                    "Criminal Procedure Code 1898",
                    "Pakistan Penal Code 1860",
                ],
                steps=[
                    ProcedureStep(
                        step_number=1,
                        title="Approach the Police Station",
                        description="Visit the police station having jurisdiction (where the offense occurred). Request the Station House Officer (SHO) to register your FIR under Section 154 CrPC.",
                        documents_required=["Written complaint", "CNIC", "Evidence (if available)"],
                        tips="The police MUST register your FIR if a cognizable offense is disclosed. If they refuse, approach the District Police Officer or the Judicial Magistrate.",
                        estimated_time="1 day",
                    ),
                    ProcedureStep(
                        step_number=2,
                        title="Complaint Before Magistrate",
                        description="If police refuse to register FIR, file a complaint directly before the Judicial Magistrate under Section 200 CrPC. The Magistrate will examine you on oath and may issue process.",
                        documents_required=["Written complaint", "Affidavit", "Evidence", "List of witnesses"],
                        tips="A complaint before Magistrate is also appropriate for non-cognizable offenses where police cannot arrest without warrant.",
                        estimated_time="3-7 days",
                    ),
                    ProcedureStep(
                        step_number=3,
                        title="Investigation Process",
                        description="After FIR registration, the police investigate. They may collect evidence, record statements, and arrest the accused. The investigation should be completed within 14 days (extendable).",
                        estimated_time="14-30 days",
                    ),
                    ProcedureStep(
                        step_number=4,
                        title="Submission of Challan",
                        description="After completing investigation, police submit the challan (charge sheet) before the court. The court takes cognizance and summons the accused.",
                        estimated_time="30-60 days",
                    ),
                ],
            ),
        ],
    ),
    ProcedureCategory(
        id="civil",
        name="Civil Procedure",
        description="Guides for civil litigation including recovery suits, property disputes, and injunctions.",
        icon="file-text",
        procedures=[
            LegalProcedure(
                id="civil-suit",
                title="How to File a Civil Suit",
                category="Civil Procedure",
                overview="Comprehensive guide to filing a civil suit in a Pakistani civil court, from pre-filing considerations to trial.",
                applicable_laws=[
                    "Civil Procedure Code 1908",
                    "Limitation Act 1908",
                    "Court Fees Act 1870",
                ],
                steps=[
                    ProcedureStep(
                        step_number=1,
                        title="Pre-Filing Assessment",
                        description="Assess: (1) Jurisdiction - which court has authority; (2) Limitation period - ensure the suit is within time; (3) Court fee - calculate applicable court fee; (4) Cause of action - ensure there is a valid legal ground.",
                        documents_required=["All relevant documents", "Legal advice from advocate"],
                        tips="Always check limitation first - if the period has expired, you may need to apply for condonation of delay under Section 5 of the Limitation Act.",
                    ),
                    ProcedureStep(
                        step_number=2,
                        title="Draft the Plaint",
                        description="Prepare the plaint (written statement of claim) containing: (1) Name and description of parties; (2) Facts constituting the cause of action; (3) Date when the cause of action arose; (4) Jurisdictional facts; (5) Relief claimed.",
                        documents_required=["Supporting documents", "Property documents (if relevant)", "Contract/agreement (if relevant)"],
                        estimated_time="3-7 days",
                        tips="The plaint must be precise and contain all material facts. Missing a crucial fact can be fatal to the case.",
                    ),
                    ProcedureStep(
                        step_number=3,
                        title="File in Court",
                        description="File the plaint in the appropriate court: Civil Judge (up to Rs. 5 million), Senior Civil Judge, or District Judge as per pecuniary jurisdiction.",
                        documents_required=[
                            "Plaint (with copies for each defendant)",
                            "Court fee (properly affixed)",
                            "Vakalatnama (power of attorney for advocate)",
                            "Process fee",
                        ],
                        estimated_time="1-2 days",
                    ),
                    ProcedureStep(
                        step_number=4,
                        title="Summons to Defendant",
                        description="After filing, the court issues summons to the defendant to appear and file a written statement within 30 days.",
                        estimated_time="7-30 days",
                    ),
                    ProcedureStep(
                        step_number=5,
                        title="Issues and Trial",
                        description="After the written statement is filed, the court frames issues, records evidence, and hears arguments. The trial may involve multiple hearings.",
                        estimated_time="3-12 months (varies widely)",
                    ),
                ],
                notes="Civil litigation can take time. Consider alternative dispute resolution (ADR) mechanisms like arbitration or mediation. Delay is a significant issue in Pakistani courts - be prepared for a lengthy process.",
            ),
        ],
    ),
    ProcedureCategory(
        id="family",
        name="Family Law",
        description="Procedures for family matters including marriage, divorce, maintenance, and custody.",
        icon="users",
        procedures=[
            LegalProcedure(
                id="khula-divorce",
                title="How to File for Khula (Wife's Right to Divorce)",
                category="Family Law",
                overview="Guide for Muslim women seeking dissolution of marriage through Khula under the Dissolution of Muslim Marriages Act 1939 and Muslim Family Laws Ordinance 1961.",
                applicable_laws=[
                    "Dissolution of Muslim Marriages Act 1939",
                    "Muslim Family Laws Ordinance 1961",
                    "Family Courts Act 1964",
                ],
                steps=[
                    ProcedureStep(
                        step_number=1,
                        title="Grounds for Khula",
                        description="Under Muslim law, a wife can seek khula on various grounds including: cruelty, failure to maintain, impotence, desertion for 4+ years, imprisonment of husband, or if the marriage is irretrievably broken down.",
                        tips="No specific 'fault' is strictly required - the wife's unwillingness to continue the marriage, coupled with returning the dower (mehr), is generally sufficient.",
                    ),
                    ProcedureStep(
                        step_number=2,
                        title="File in Family Court",
                        description="File a suit for dissolution of marriage (khula) in the Family Court having jurisdiction. The court fee is nominal.",
                        documents_required=[
                            "Marriage certificate (Nikahnama)",
                            "CNIC of both parties",
                            "Evidence of grounds (if any)",
                            "List of witnesses",
                        ],
                        estimated_time="1 day for filing",
                    ),
                    ProcedureStep(
                        step_number=3,
                        title="Court Proceedings",
                        description="The Family Court attempts reconciliation through conciliation. After failure of conciliation, the court proceeds with the case. The court may order return of dower (mehr) by the wife.",
                        estimated_time="3-6 months for completion",
                        tips="Courts typically grant khula if the wife states she cannot live with the husband within the limits prescribed by Allah.",
                    ),
                    ProcedureStep(
                        step_number=4,
                        title="Decree of Dissolution",
                        description="The court grants a decree of dissolution of marriage. The wife retains custody of minor children (hizanat) up to specified ages.",
                    ),
                ],
            ),
        ],
    ),
    ProcedureCategory(
        id="property",
        name="Property & Land",
        description="Procedures for property disputes, land registration, and revenue matters.",
        icon="home",
        procedures=[
            LegalProcedure(
                id="property-dispute",
                title="How to Handle a Property Dispute",
                category="Property & Land",
                overview="Guide to dealing with property disputes in Pakistan including title disputes, possession claims, and inheritance matters.",
                applicable_laws=[
                    "Transfer of Property Act 1882",
                    "Registration Act 1908",
                    "Specific Relief Act 1877",
                    "Limitation Act 1908",
                    "Land Revenue Act 1967",
                ],
                steps=[
                    ProcedureStep(
                        step_number=1,
                        title="Gather Property Documents",
                        description="Collect all relevant property documents: title deed, registry, mutation (intqal), tax receipts, possession documents, and site plan.",
                        documents_required=[
                            "Sale deed / registry",
                            "Mutation (Intqal) records",
                            "Property tax receipts",
                            "Fard (record of rights)",
                            "Site plan / layout plan",
                        ],
                        tips="Always verify the complete chain of title going back at least 12 years (limitation period for property claims).",
                    ),
                    ProcedureStep(
                        step_number=2,
                        title="Revenue Records Check",
                        description="Check the revenue/jamabandi records at the Patwari/Tehsildar office to verify current ownership, possession, and any encumbrances on the property.",
                        estimated_time="3-7 days",
                    ),
                    ProcedureStep(
                        step_number=3,
                        title="Legal Remedies",
                        description="Based on the nature of the dispute, choose the appropriate remedy: (a) Suit for possession (if dispossessed); (b) Suit for declaration and injunction (if title challenged); (c) Partition suit (if co-owned); (d) Specific performance (if sale agreement breached).",
                        tips="For urgent matters like threatened dispossession, seek a temporary injunction from the civil court immediately.",
                    ),
                    ProcedureStep(
                        step_number=4,
                        title="File in Appropriate Court",
                        description="Property suits are filed in the Civil Court based on property value. Revenue matters may be handled by the Board of Revenue through the Tehsildar/Assistant Commissioner.",
                        estimated_time="1-2 years for resolution (estimated)",
                    ),
                ],
            ),
        ],
    ),
]

# =============================================================================
# Bail Information
# =============================================================================

BAIL_INFO = [
    BailInfo(
        section="CrPC Section 496",
        offense_type="Bailable offenses",
        bailable=True,
        conditions="Bail is a matter of right. The accused must furnish a surety bond. The police or court shall release the accused on bail.",
        court="Police Station / Any Court",
        notes="For bailable offenses, the accused cannot be kept in custody if they are prepared to furnish bail.",
    ),
    BailInfo(
        section="CrPC Section 497",
        offense_type="Non-bailable offenses (general)",
        bailable=False,
        conditions="Court has discretion to grant bail. Factors considered: nature and gravity of offense, evidence against accused, likelihood of absconding or tampering with evidence, criminal record.",
        court="Sessions Court / High Court",
        notes="Bail is denied if there are reasonable grounds to believe the accused is guilty of an offense punishable with death or life imprisonment.",
    ),
    BailInfo(
        section="CrPC Section 497(2)",
        offense_type="Non-bailable offenses (women/minors/sick)",
        bailable=False,
        conditions="Women, minors under 16, and sick/infirm persons may be granted bail more readily even for serious offenses, at the court's discretion.",
        court="Sessions Court / High Court",
        notes="Courts show more leniency for these categories based on humanitarian considerations.",
    ),
    BailInfo(
        section="CrPC Section 498",
        offense_type="Pre-arrest bail (anticipatory)",
        bailable=False,
        conditions="High Court or Sessions Court may grant anticipatory bail to a person who apprehends arrest for a non-bailable offense. The court may impose conditions.",
        court="High Court / Sessions Court",
        notes="Anticipatory bail is typically granted for a limited period (usually 2-4 weeks) during which the accused must apply for regular bail.",
    ),
    BailInfo(
        section="CrPC Section 561-A",
        offense_type="Inherent powers of High Court",
        bailable=False,
        conditions="High Court may exercise inherent powers to grant bail in exceptional cases to prevent abuse of court process or to secure the ends of justice.",
        court="High Court",
        notes="This is a residuary power and is used sparingly when no other remedy is available.",
    ),
    BailInfo(
        section="ATA Section 11-F",
        offense_type="Anti-Terrorism Act offenses",
        bailable=False,
        conditions="Bail is generally not granted for offenses under the Anti-Terrorism Act 1997. The court must hear the prosecution and record reasons for granting bail.",
        court="High Court",
        notes="Bail under ATA is extremely rare and requires extraordinary circumstances.",
    ),
    BailInfo(
        section="NAO Section 9",
        offense_type="NAB / Corruption offenses",
        bailable=False,
        conditions="National Accountability Bureau (NAB) cases have stringent bail conditions. Bail is not a matter of right and court must consider the gravity of corruption.",
        court="High Court / Supreme Court",
        notes="Accountability courts have jurisdiction, but bail is typically sought from High Court.",
    ),
]

# =============================================================================
# Toolkit Accessor
# =============================================================================


def get_toolkit() -> LegalToolkit:
    """Get the complete legal toolkit with all resources."""
    return LegalToolkit(
        limitation_periods=LIMITATION_PERIODS,
        court_fees=COURT_FEES,
        procedures=PROCEDURE_CATEGORIES,
    )


def get_bail_info() -> list[BailInfo]:
    """Get bail information."""
    return BAIL_INFO


def get_procedure(procedure_id: str) -> LegalProcedure | None:
    """Get a specific legal procedure by ID."""
    for category in PROCEDURE_CATEGORIES:
        for procedure in category.procedures:
            if procedure.id == procedure_id:
                return procedure
    return None


def get_category(category_id: str) -> ProcedureCategory | None:
    """Get a specific procedure category by ID."""
    for category in PROCEDURE_CATEGORIES:
        if category.id == category_id:
            return category
    return None
