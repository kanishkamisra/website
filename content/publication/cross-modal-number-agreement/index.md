---
abstract: >
  Language models learn about grammatical number primarily from co-occurrence, and show frequency effects as a result---sometimes taken to indicate that they do not learn abstract ``rules'', and are instead dependent on specific lexical items. Testing generalization with text stimuli alone cannot settle this debate, since distributional cues (is/are, this/these) easily give number away. We instead use cross-modal generalization as a tool to investigate abstractions in LMs that can also accept visual inputs (VLMs), restricting the evidence that diagnoses number to an extra-linguistic modality. We teach VLMs pairs of new nouns by adding new embeddings and only updating them during learning, comparing conditions where number is diagnosed by visual cues alone against ones where it is disambiguated by text. Across behavior, representational dynamics, and causal mechanisms, we find non-trivial evidence for cross-modal generalization across both exposure conditions, and that linguistic vs. extra-linguistic cue conditions are treated in similar ways in the internal mechanisms of the model. This suggests that statistical learners like VLMs can generalize beyond surface-level co-occurrence and show genuine abstraction-compatible behavior.
authors:
- Zach Studdiford
- admin
date: "2026-08-31T00:00:00Z"
# doi: "10.1109/SMC.2019.8914528"
featured: true
links:
- name: arxiv
  url: https://arxiv.org/abs/2609.00443
publication: "arXiv preprint"
publication_short: "arXiv preprint"
publication_types:
- "3"
#publishDate: "2021-08-01T00:00:00Z"
# slides: example
summary: >
  Using cross-modal generalization in vision-language models to test whether number agreement is learned as an abstraction rather than through surface-level co-occurrence.
# tags:
# - Source Themes
title: "(V)LMs generalize beyond surface co-occurrence: Evidence from cross-modal number agreement"
#url_code: '#'
# url_dataset: '#'
# url_pdf: "papers/fuzzy-risk.pdf"
# url_poster: "posters/cogsci22.pdf"
# url_project: ""
#url_slides: "slides/cogsci2021.pdf"
# url_source: '#'
#url_video: '#'
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}
