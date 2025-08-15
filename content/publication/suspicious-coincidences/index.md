---
abstract: >
  Humans are sensitive to suspicious coincidences when generalizing inductively over data, 
  as they make assumptions as to how the data was sampled. This results in more specific hypotheses 
  being favored over more general ones. For instance, when provided the set \{Austin, Dallas, Houston\}, 
  one is more likely to think that this is sampled from "Texas Cities" over "US Cities" even though both are compatible. 
  Suspicious coincidence is strongly connected to pragmatic reasoning, and can serve as a testbed to 
  analyze systems on their sensitivity towards the communicative goals of the task (i.e., figuring out the true category underlying the data). 
  In this paper, we analyze whether suspicious coincidence effects are reflected in language models' (LMs) behavior.
  We do so in the context of two domains: 1) the number game, where humans made judgments of whether a number 
  (e.g., 4) fits a list of given numbers (e.g., 16, 32, 2); and 2) by extending the number game setup to prominent cities. 
  For both domains, the data is compatible with multiple hypotheses and we study which hypothesis is most consistent 
  with the models' behavior. On analyzing five models, we do not find strong evidence for suspicious coincidences in 
  LMs’ zero-shot behavior. However, when provided access to the hypotheses space via chain-of-thought or explicit prompting, 
  LMs start to show an effect resembling suspicious coincidences, sometimes even showing effects consistent with humans.  
  Our study shows that inductive reasoning behavior in LMs can be enhanced with some level of access to the hypothesis landscape.
authors:
- Sriram Padmanabhan
- admin 
- Kyle Mahowald
- Eunsol Choi
date: "2025-04-12T00:00:00Z"
# doi: "10.1109/SMC.2019.8914528"
featured: true
links:
- name: arxiv
  url: https://arxiv.org/abs/2504.09387
# - name: ACL Anthology
#   url: https://aclanthology.org/2023.eacl-main.213/
# - name: Video
#   url: https://aclanthology.org/2023.eacl-main.213.mp4
# - name: Supplementary
#   url: https://github.com/kanishkamisra/lm-induction/blob/main/supplemental.pdf
publication: In *The 1st Workshop on Pragmatic Reasoning in Language Models (PragLM)* (to appear)
publication_short: In *PragLM 2025 (COLM)*
publication_types:
- "1"
#publishDate: "2021-08-01T00:00:00Z"
# slides: example
summary: >
  Investigating the extent to which LMs show a sensitivity to suspicious coincidences in their input.
# tags:
# - Source Themes
title: "On Language Models' Sensitivity to Suspicious Coincidences"
url_code: 'https://github.com/kanishkamisra/number-game'
# url_dataset: '#'
# url_pdf: "papers/fscomps.pdf"
# url_poster: "posters/cogsci22.pdf"
# url_project: ""
#url_slides: "slides/cogsci2021.pdf"
# url_source: '#'
#url_video: '#'
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}

