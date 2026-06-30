# PHX Home Loan Marketing Website

This context models the public-facing PHX Home Loan website for educating borrowers and capturing interest for Jimmy Vercellino's lending business. It is not the source of truth for loan origination, underwriting, servicing, or other internal mortgage operations.

## Language

**Marketing Website**:
The public site that presents PHX Home Loan's brand, educational content, and contact pathways.
_Avoid_: App, platform, loan system

**Business Brand**:
The public business identity the **Marketing Website** presents and promotes to visitors.
_Avoid_: Company, person

**Personal Brand**:
The named public persona whose credibility and visibility attract **Prospects** and reinforce the **Business Brand**.
_Avoid_: Job title, company

**Team**:
The group presented on the **Marketing Website** as supporting the **Personal Brand** and helping serve **Prospects** and **Borrowers**.
_Avoid_: Org chart, headcount

**Prospect**:
A visitor who has shown interest by submitting a form, calling, or requesting contact.
_Avoid_: Lead

**Borrower**:
A person pursuing or receiving a mortgage through the business outside the website context.
_Avoid_: Lead, visitor

**Contact Pathway**:
A site-owned route that lets a **Prospect** initiate contact or continue to the next step, including calls, forms, and outbound application links.
_Avoid_: Application, funnel

**Educational Content**:
The informational material the **Marketing Website** publishes to explain mortgage topics, loan options, and next steps to visitors.
_Avoid_: Post, page, asset

**Loan Program**:
A category of mortgage offering that the **Marketing Website** explains so visitors can distinguish which options may fit their needs.
_Avoid_: Product SKU, application type

**Service Area**:
The geographic market the **Business Brand** presents itself as serving through the **Marketing Website**.
_Avoid_: Office location, SEO keyword

**Audience Segment**:
A meaningful visitor group the **Marketing Website** may tailor messaging or **Educational Content** toward.
_Avoid_: Persona, demographic detail

**Trust Signal**:
An element of the **Marketing Website** that increases visitor confidence in the **Business Brand**, **Personal Brand**, or **Team**.
_Avoid_: Badge, widget

## Relationships

- The **Marketing Website** presents information about PHX Home Loan and routes **Prospect** interest into **Contact Pathways**
- The **Marketing Website** presents a **Business Brand** through **Educational Content** and **Contact Pathways**
- The **Personal Brand** reinforces the **Business Brand** by building trust and attracting **Prospects**
- The **Team** supports the **Personal Brand** in serving **Prospects** and **Borrowers**
- The **Marketing Website** publishes **Educational Content** to inform visitors and support **Prospects**
- The **Marketing Website** may tailor **Educational Content** to one or more **Audience Segments**
- The **Marketing Website** uses **Trust Signals** to strengthen confidence in the **Business Brand**, **Personal Brand**, and **Team**
- **Educational Content** explains one or more **Loan Programs** to help visitors understand their options
- The **Service Area** is nationwide, while Phoenix functions as a brand anchor rather than a hard service boundary
- A **Prospect** may become a **Borrower** outside the **Marketing Website** context
- A **Contact Pathway** may move a **Prospect** out of the **Marketing Website** context and into the business's offline or external intake flow
- Formal mortgage application begins outside the **Marketing Website** context

## Example dialogue

> **Dev:** "Should the **Marketing Website** decide whether a borrower qualifies for a loan?"
> **Domain expert:** "No, the **Marketing Website** only educates visitors and captures interest; qualification happens outside this context."
>
> **Dev:** "Does clicking Apply Now mean the website owns the mortgage application?"
> **Domain expert:** "No, that's a **Contact Pathway** out of the site and into an external intake flow."
>
> **Dev:** "Is this blog post just marketing copy, or part of the domain?"
> **Domain expert:** "It's **Educational Content** because its job is to help visitors understand mortgage topics before they decide to reach out."
>
> **Dev:** "Are VA and FHA just page labels, or do they matter to the glossary?"
> **Domain expert:** "They are **Loan Programs** because visitors are expected to distinguish between those options as part of deciding whether to contact us."
>
> **Dev:** "Is Phoenix the actual service boundary?"
> **Domain expert:** "No, the **Service Area** is nationwide; Phoenix is a brand anchor in the positioning."
>
> **Dev:** "Are awards and testimonials just decoration?"
> **Domain expert:** "No, they are **Trust Signals** because they help a **Prospect** decide whether this **Business Brand** and **Team** are credible."

## Flagged ambiguities

- "lead" was used to mean a person interested in PHX Home Loan services; resolved: use **Prospect** in this context and reserve "lead" for marketing/reporting usage only.
- "borrower" could have been used for any interested site visitor; resolved: use **Borrower** only once a person is pursuing or receiving a mortgage outside the website context.
- "application" appears in site copy and outbound links, but the formal **Application** process is outside this context and is intentionally excluded from the glossary.
- "apply" could imply the website owns formal mortgage intake; resolved: site-owned calls, forms, and outbound links are **Contact Pathways**, not the formal application process itself.
- "PHX Home Loan" and "Jimmy Vercellino" should not be collapsed into one concept; resolved: PHX Home Loan is the **Business Brand** and Jimmy Vercellino is the **Personal Brand** in this context.
- "VA Loans For Vets" is part of Jimmy Vercellino's broader business footprint but not this repo's bounded context; resolved: exclude any **Brand Portfolio** concept from this glossary for now.
- "team" could have been treated as just a page layout or staff listing; resolved: use **Team** as a real domain concept because the site presents it as part of trust-building and service delivery.
- "Phoenix" could have been mistaken for the actual **Service Area**; resolved for now from approved site copy: the **Service Area** is nationwide, and Phoenix is a brand anchor rather than a hard service boundary.
- Veteran-focused language appears in parts of the repo due to cloning history from a different website; resolved: do not define **Veteran** as a glossary term here, and treat future audience-specific positioning under the broader **Audience Segment** concept instead.
