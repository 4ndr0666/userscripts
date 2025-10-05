# Bug Bounty Report: Critical Vulnerability Chain Enabling Infinite Premium Compute Abuse & Content Policy Evasion

**Report ID:** GSD-2024-001
**Author:** 4ndr0666
**Severity:** **Critical** (CVSS 9.1)
**Target:** `create.wan.video` and associated API endpoints.

---

### Summary

A catastrophic cascade of security failures, originating from a flawed server-side business logic implementation, allows any user to gain infinite, free, and prioritized access to the platform's most expensive compute features. This core vulnerability, when chained with several other client-side and server-side weaknesses, completely dismantles the platform's monetization model and exposes the service to severe operational and reputational risks.

Our engagement uncovered a malicious UserScript in active development (codenamed "WanChimera") which weaponizes these flaws. Analysis of this tool reveals a sophisticated understanding of the target's infrastructure. The primary exploit vector is a server-side logic flaw in the video extension API endpoint (`/wanx/api/common/v2/task/extend`). By injecting a simple `priority: true` parameter into the request, an attacker can completely bypass all credit and payment validation, forcing the task into a privileged processing queue.

This allows a free user to perform the following actions:
1.  **Gain infinite, credit-less usage of the premium "Extend Video" feature.**
2.  **Force their tasks into a priority queue, starving paying customers of compute resources.**
3.  **Bypass all content and NSFW filters to generate and host prohibited material.**
4.  **Unlock all premium models and features, including watermark removal, at zero cost.**

The result is a complete breakdown of the service's economic and security integrity. Malicious actors can consume unlimited GPU resources for free, degrade the service for legitimate customers, and use the platform to generate and distribute harmful content, creating a perfect storm for financial loss and brand destruction.

---

### Vulnerability Details

The attack is a chain of vulnerabilities, with the server-side logic flaw being the lynchpin.

#### **Primary Vulnerability: CWE-840: Business Logic Errors - Infinite Premium Feature Usage via Priority Queue Bypass**

The core of this exploit lies in the `/wanx/api/common/v2/task/extend` endpoint. This endpoint is responsible for extending the duration of a generated video, a premium feature that consumes significant compute resources and costs user credits.

Our analysis, corroborated by intelligence gathered from the attacker's own development logs, confirms that the endpoint's logic is critically flawed. When a request to this endpoint includes the JSON parameter `"priority": true`, the server correctly places the task into a high-priority queue. However, it **fails to trigger the corresponding credit deduction or account balance validation logic**. The authorization and payment checks are completely skipped for priority tasks.

An attacker can simply intercept their own "Extend Video" request and inject this parameter to receive the service for free. As there is no server-side validation, this can be repeated indefinitely.

**Evidence from Attacker's Tool (`VECTOR_MODULE.modifyRequest`):**
```javascript
// Vector: Priority Queue Exploit for task extension
if (CONFIG.priorityQueueExploit && HELPERS.matchesEndpoint(url, "taskExtend")) {
    if(modifiedBody.priority !== true) {
        modifiedBody.priority = true;
        bodyWasModified = true;
        HELPERS.vector(`Priority Queue Exploit: Injected 'priority:true' into task extend request.`);
    }
}
```

#### **Supporting Vulnerability 1: CWE-602: Client-Side Enforcement of Server-Side Security**

The application's front-end implicitly trusts API responses to control access to premium features. The attacker's toolkit demonstrates that responses from endpoints like `/userInfo/get` and `/model/v2/list` can be modified client-side to unlock the entire UI. This includes displaying infinite credits, granting a "PREMIUM" member level, and making all generation models selectable. While this is only a visual deception, it is the crucial first step that lowers the barrier to entry and encourages an attacker to discover and exploit the more severe server-side flaw.

**Evidence from Attacker's Tool (`VECTOR_MODULE.spoofUserInfo`):**
```javascript
spoofUserInfo: (data) => {
    // ...
    clone.data.taskQuota.image = clone.data.taskQuota.video = CONFIG.taskQuotaValue; 
    clone.data.active.memberLevel = CONFIG.spoofedMemberLevel;
    // ...
}
```

#### **Supporting Vulnerability 2: CWE-804: Incomplete Blacklist for Prohibited Content**

The platform's content filtering mechanism is trivially bypassed. The server-side filter fails to normalize or sanitize user input, making it vulnerable to simple obfuscation techniques. The attacker's toolkit implements two methods: **homoglyph substitution** (replacing characters like 'o' with the Cyrillic 'о') and **zero-width space (ZWSP) injection**. By layering these techniques, an attacker can submit prompts containing explicitly prohibited terms that will pass the filter and be processed by the AI model.

**Evidence from Attacker's Tool (`HELPERS.obfuscatePrompt`):**
```javascript
const applyHomoglyph = (text) => text.replace(NSFW_PROMPT_REGEX(), m => m.split('').map(char => HOMOGLYPH_MAP[char.toLowerCase()] || char).join(''));
const applyZWSP = (text) => text.replace(NSFW_PROMPT_REGEX(), m => m.split('').join('\\u200B'));
// ...
case 'layered': return applyZWSP(applyHomoglyph(prompt));
```

---

### CVSS 3.1 Scoring (Primary Vulnerability)

*   **Vector:** `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:H`
*   **Base Score:** **9.1 (Critical)**

| Metric | Value | Justification |
| :--- | :--- | :--- |
| **Attack Vector** | Network (N) | The vulnerability is exploited by sending a crafted request to the public API. |
| **Attack Complexity** | Low (L) | The exploit requires only the addition of a single JSON key-value pair, which is easily automated. |
| **Privileges Required** | Low (L) | A standard, free user account is sufficient to perform the attack. |
| **User Interaction** | None (N) | The attacker exploits the system directly without needing to trick any other user. |
| **Scope** | Unchanged (U) | The exploit impacts the application server but does not grant access to other systems. |
| **Confidentiality** | None (N) | The attack does not directly lead to the disclosure of sensitive information. |
| **Integrity** | Low (L) | The attack allows for the creation of content (e.g., watermark-free videos) that violates the intended state of the system for free users. |
| **Availability** | **High (H)** | This is the most severe impact. By flooding the **priority queue** with infinite free tasks, an attacker can cause a denial-of-service condition for legitimate, paying customers, rendering the premium service unusable. |

---

### Reproduction Steps

The following steps demonstrate the complete exploit chain, from a free account to infinite, prioritized video generation.

1.  **Prerequisites:** A free user account on `https://create.wan.video` and a browser with a UserScript manager extension (e.g., Tampermonkey).
2.  **Install PoC:** Install the provided `v4.4.0` "Immutability Core" UserScript. This is the most stable version of the attacker's toolkit and contains all necessary exploit vectors.
3.  **Navigate & Verify:** Log in and navigate to `https://create.wan.video`. A "WanChimera" control panel will appear on the screen. Verify that the `Priority Queue Exploit` and `Force Task Success` toggles are enabled by default. The UI will also falsely show a "PREMIUM" status and 999,999 credits.
4.  **Initial Generation:** Create a short video. If you have no credits, the `Force Task Success` feature will intercept the server's rejection and create a "ghost" task on the client, allowing you to proceed.
5.  **Trigger the Exploit:** Once the initial video is available, locate and click the "Extend" button.
6.  **Observe Network Traffic:** Open the browser's Developer Tools and monitor the Network tab. A `POST` request will be sent to `/wanx/api/common/v2/task/extend`.
7.  **Confirm Payload:** Inspect the request payload. You will see that the attacker's script has successfully injected the `"priority": true` parameter into the JSON body.
8.  **Confirm Result:** Observe that the server responds with a `200 OK` and a success message. The video extension task will begin processing in the priority queue. Crucially, no credits will be deducted from your (actual) balance.
9.  **Infinite Abuse:** Repeat step 5 indefinitely. Each click will trigger another free, prioritized extension, allowing for the creation of arbitrarily long videos at no cost.

---

### Impact

The business impact of this vulnerability chain is systemic and severe, threatening the platform's financial viability, operational stability, and brand reputation.

*   **Catastrophic Financial Loss:** The exploit directly targets a core, monetized feature. Every execution consumes expensive GPU compute resources—the primary operational cost of the service—without generating any revenue. A single malicious actor can inflict thousands of dollars in infrastructure costs in a short period, effectively stealing compute time at scale.

*   **Denial of Service for Paying Customers:** The most insidious aspect of this exploit is its targeting of the **priority queue**. This queue is the central value proposition for premium customers. By flooding this queue with infinite free tasks, attackers can completely saturate the high-priority compute resources. This will result in extreme processing delays and service degradation for your most valuable, paying customers, leading to mass frustration, subscription cancellations, and irreversible churn. **The very feature people pay for is rendered useless by those who don't pay at all.**

*   **Brand and Legal Liability:** The trivial nature of the NSFW filter bypass, combined with free and unlimited access to priority generation, creates a nightmare scenario. The platform can be turned into a high-speed factory for generating and hosting prohibited or illegal content. This exposes the company to immense reputational damage, potential de-platforming by hosting and CDN providers (e.g., `cdn.wanxai.com`), and significant legal liability.

*   **Total Annihilation of the Business Model:** This exploit chain invalidates the entire subscription and credit system. There is no longer any incentive for a user to pay for premium tiers, purchase credits, or use the service as intended. The discovery and public disclosure of such a fundamental flaw would lead to widespread abuse and a complete collapse of the platform's revenue streams.
