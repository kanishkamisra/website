---
abstract: >
  Language models learn rare syntactic phenomena, but the extent to which this is attributable to generalization vs. memorization is a major open question. To that end, we iteratively trained transformer language models on systematically manipulated corpora which were human-scale in size, and then evaluated their learning of a rare grammatical phenomenon: the English Article+Adjective+Numeral+Noun (AANN) construction (“a beautiful five days”). We compared how well this construction was learned on the default corpus relative to a counterfactual corpus in which AANN sentences were removed. We found that AANNs were still learned better than systematically perturbed variants of the construction. Using additional counterfactual corpora, we suggest that this learning occurs through generalization from related constructions (e.g., “a few days”). An additional experiment showed that this learning is enhanced when there is more variability in the input. Taken together, our results provide an existence proof that LMs can learn rare grammatical phenomena by generalization from less rare phenomena. Data and code: <a href='https:// github.com/kanishkamisra/aannalysis'>here</a>.
authors:
- admin 
- Kyle Mahowald
date: "2024-04-11T00:00:00Z"
# doi: "10.1109/SMC.2019.8914528"
featured: true
links:
- name: arxiv
  url: https://arxiv.org/abs/2403.19827
- name: ACL Anthology
  url: https://aclanthology.org/2024.emnlp-main.53/
# - name: Video
#   url: https://aclanthology.org/2023.eacl-main.213.mp4
# - name: Supplementary
#   url: https://github.com/kanishkamisra/lm-induction/blob/main/supplemental.pdf
publication: In *EMNLP 2024*
publication_short: In *EMNLP 2024*
publication_types:
- "1"
#publishDate: "2021-08-01T00:00:00Z"
# slides: example
summary: >
  Analysis of how statistical learners of language acquire rare linguistic phenomena such as the article+adjective+numeral+noun construction.
# tags:
# - Source Themes
title: "Language Models Learn Rare Phenomena from Less Rare Phenomena: The Case of the Missing AANNs"
url_code: 'https://github.com/kanishkamisra/aannalysis'
# url_dataset: '#'
# url_pdf: "papers/fscomps.pdf"
url_poster: "posters/AANN-Poster.pdf"
# url_project: ""
#url_slides: "slides/cogsci2021.pdf"
# url_source: '#'
#url_video: '#'
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}

