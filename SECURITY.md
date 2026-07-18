# Security Policy

Project Green takes the security of buyer data, staff accounts, commercial
records, uploaded files, and payment workflows seriously. Thank you for helping
us identify and resolve security problems responsibly.

## Supported version

Security fixes are applied to the latest code on the `main` branch. Historical
branches, superseded audit branches, forks, and locally modified deployments
are not supported.

| Version | Supported |
|---|---|
| Latest `main` | Yes |
| Older commits or branches | No |

## Reporting a vulnerability

**Do not open a public GitHub issue, discussion, or pull request for a suspected
vulnerability.** Public disclosure can place installations and their users at
risk before a fix is available.

Submit the report through GitHub's
[private vulnerability reporting form](https://github.com/ronithrashmikara/Project-Green-Orchids/security/advisories/new).
This creates a confidential security advisory visible only to the reporter and
repository maintainers.

Please include as much of the following information as possible:

- The affected route, module, file, commit, or configuration.
- The vulnerability type and its likely impact.
- Clear reproduction steps or a minimal proof of concept.
- Required account role, permissions, configuration, or environment.
- Whether exploitation requires user interaction.
- Relevant request/response samples with credentials and personal data removed.
- A suggested remediation, if you have one.

Never include real passwords, API keys, access tokens, buyer information,
payment data, or other secrets in the report. Use redacted or synthetic values.

## What to expect

Maintainers will review the report privately, attempt to reproduce it, assess
its severity, and coordinate a remediation. Status updates and any requests for
additional information will be sent through the private advisory. A validated
issue may be credited to the reporter when the advisory is published, unless
the reporter prefers to remain anonymous.

Please allow maintainers a reasonable opportunity to investigate and release a
fix before publishing technical details.

## Scope

Examples of issues that are in scope include:

- Authentication or session bypasses.
- Incorrect role or permission enforcement.
- Cross-buyer or cross-account data exposure.
- SQL injection, command injection, path traversal, or unsafe file upload.
- Server-side request forgery or cross-site request forgery.
- Exposure of credentials, tokens, personal data, or commercial records.
- Payment-verification bypasses or unauthorized financial state changes.
- Dependency vulnerabilities that are exploitable in this application.

The following generally do not qualify unless they create a concrete security
impact:

- Missing security headers without a demonstrated exploit path.
- Automated scanner output without reproduction evidence.
- Denial-of-service testing that could disrupt shared or production systems.
- Social engineering, phishing, physical attacks, or attacks against third-party
  services outside this repository's control.
- Vulnerabilities that require a deliberately compromised local environment.

## Safe research

Use only accounts, databases, and deployments that you own or are explicitly
authorized to test. Avoid accessing, modifying, retaining, or destroying other
people's data. Do not perform destructive testing, service disruption, spam,
credential attacks, or broad automated scanning against a live deployment.

Good-faith research that follows this policy, stays within authorized systems,
and avoids privacy violations or service disruption will be treated as an
effort to improve Project Green rather than misuse it.
