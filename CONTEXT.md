# Mini Schedule Context

Mini Schedule is a multi-brand fitness SaaS product. This glossary keeps product language consistent across platform, brand, and learner-facing surfaces.

## Language

**Brand**:
A tenant organization that offers fitness courses, plans, and training services.
_Avoid_: Merchant, gym, account

**Platform Administrator**:
A platform-level operator who manages brand onboarding and platform admin accounts.
_Avoid_: Admin when the scope is ambiguous

**Platform Backoffice**:
The operational backoffice used by Platform Administrators to manage platform-level resources.
_Avoid_: Brand Backoffice, App, Dashboard when referring to the whole surface

**Brand Administrator**:
A user working for a Brand who manages that brand's learners, courses, and training records.
_Avoid_: Platform Administrator, Coach

**Brand Backoffice**:
The operational backoffice used by Brand Administrators to manage brand-scoped resources.
_Avoid_: Platform Backoffice, App

**Learner**:
An end user who consumes Brand-published courses and records training activity.
_Avoid_: Customer, member, C-end user

## Relationships

- A **Platform Administrator** manages zero or more **Brands**.
- A **Brand** has one or more **Brand Administrators**.
- A **Brand** owns zero or more **Learners**.
- A **Learner** belongs to exactly one **Brand** in the MVP model.
- The **Platform Backoffice** is separate from the **Brand Backoffice**.

## Example dialogue

> **Dev:** "Should this dashboard show learner training records?"
> **Domain expert:** "Only in the Brand Backoffice. The Platform Backoffice should summarize brand onboarding and platform operations."

## Flagged ambiguities

- "admin" appears in docs and code for both platform-level and brand-level work. Resolved: use **Platform Administrator** for platform operators and **Brand Administrator** for brand-scoped operators.
