---
abstract: >
  Language models learn rare syntactic phenomena, but it has been argued that they rely on rote memorization, as opposed to grammatical generalization. Training on a corpus of human-scale in size (100M words), we iteratively trained transformer language models on systematically manipulated corpora and then evaluated their learning of a particular rare grammatical phenomenon: the English Article+Adjective+Numeral+Noun (AANN) construction ("a beautiful five days"). We first compared how well this construction was learned on the default corpus relative to a counterfactual corpus in which the AANN sentences were removed. AANNs were still learned better than systematically perturbed variants of the construction. Using additional counterfactual corpora, we suggest that this learning occurs through generalization from related constructions (e.g., "a few days"). An additional experiment showed that this learning is enhanced when there is more variability in the input. Taken together, our results provide an existence proof that models learn rare grammatical phenomena by generalization from less rare phenomena.
authors:
- admin 
- Kyle Mahowald
date: "2024-04-11T00:00:00Z"
# doi: "10.1109/SMC.2019.8914528"
featured: true
links:
- name: arxiv
  url: https://arxiv.org/abs/2403.19827
# - name: ACL Anthology
#   url: https://aclanthology.org/2023.eacl-main.213/
# - name: Video
#   url: https://aclanthology.org/2023.eacl-main.213.mp4
# - name: Supplementary
#   url: https://github.com/kanishkamisra/lm-induction/blob/main/supplemental.pdf
publication: In *arxiv 2024*
publication_short: In *arxiv 2024*
publication_types:
- "3"
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
# url_poster: "posters/cogsci22.pdf"
# url_project: ""
#url_slides: "slides/cogsci2021.pdf"
# url_source: '#'
#url_video: '#'
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}

