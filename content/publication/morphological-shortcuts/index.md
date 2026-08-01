---
abstract: >
  The morphological form of a word can often give cues to its meaning, but purely relying on these mappings can lead to overgeneralization in high-stakes domains. In the medical domain, for instance, LLMs can confidently reason about fictitious drugs from their affixes alone (e.g., wugcillin) and generate plausible-looking clinical content. We present a behavioral and mechanistic study of LLM "affix heuristics" in pharmacology. Using fictitious drug names built from real affixes, we show that affix signals alone elicit class-level pharmacological responses. We introduce a framework for identifying whether a model's drug semantics are driven mainly by the affix, the stem, or the drug name as a whole. Applied across 653 drugs, our framework reveals that models often induce drug meaning primarily through affix cues, yet rarely explicitly indicate this reliance, and sometimes incorrectly conflate properties among affix-sharing drugs. Activation patching across models further localizes this behavior to early-mid layers. These findings show that morphological shortcuts pose a subtle but measurable risk to safety.
authors:
- Kaijie Mo
- Thomas Yang
- Chantal Shaib
- Qing Yao
- William Rudman
- Ramez Kouzy
- admin 
- Byron C. Wallace
- Junyi Jessy Li
date: "2026-06-04T00:00:00Z"
featured: true
links:
- name: arxiv
  url: https://arxiv.org/abs/2606.05616
publication: In *arxiv Preprint* (Under review)
publication_short: In *arxiv*
publication_types:
- "3"
summary: >
  Showing that LLMs often infer pharmacological meaning of drug names from affixes alone, and localizing this "morphological shortcut" behavior mechanistically.
title: "What's in a Name? Morphological Shortcuts by LLMs in Pharmacology"
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}
