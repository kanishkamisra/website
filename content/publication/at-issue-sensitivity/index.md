---
abstract: >
  Evaluating the naturalness of dialogue in language models (LMs) is not trivial: notions of 'naturalness' vary, and scalable quantitative metrics remain limited. This study leverages the linguistic notion of 'at-issueness' to assess dialogue naturalness and introduces a new method: Divide, Generate, Recombine, and Compare (DGRC). DGRC (i) divides a dialogue as a prompt, (ii) generates continuations for subparts using LMs, (iii) recombines the dialogue and continuations, and (iv) compares the likelihoods of the recombined sequences. This approach mitigates bias in linguistic analyses of LMs and enables systematic testing of discourse-sensitive behavior. Applying DGRC, we find that LMs prefer to continue dialogue on at-issue content, with this effect enhanced in instruct-tuned models. They also reduce their at-issue preference when relevant cues (e.g., "Hey, wait a minute") are present. Although instruct-tuning does not further amplify this modulation, the pattern reflects a hallmark of successful dialogue dynamics.
authors:
- Sanghee J. Kim
- admin 
date: "2025-10-14T00:00:00Z"
featured: true
links:
- name: arxiv
  url: https://arxiv.org/abs/2510.12740
publication: In *Proceedings of the 19th Conference of the European Chapter of the Association for Computational Linguistics*
publication_short: In *EACL 2026*
publication_types:
- "1"
summary: >
  Introducing DGRC, a method that uses the linguistic notion of at-issueness to test whether LMs show human-like dialogue naturalness.
title: "Hey, wait a minute: on at-issue sensitivity in Language Models"
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}
