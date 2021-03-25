---
abstract: Models trained to estimate word probabilities in context have become ubiquitous in natural language processing. How do these models use lexical cues in context to inform their word probabilities? To answer this question, we present a case study analyzing the pre-trained BERT model with tests informed by semantic priming. Using English lexical stimuli that show priming in humans, we find that BERT too shows **priming**,  predicting a word with greater probability when the context includes a related word versus an unrelated one. This effect decreases as the amount of information provided by the context increases. Follow-up analysis shows BERT to be increasingly distracted by related prime words as context becomes more informative, assigning *lower* probabilities to related words. Our findings highlight the importance of considering contextual constraint effects when studying word prediction in these models, and highlight possible parallels with human processing.
authors:
- admin 
- Allyson Ettinger
- Julia Taylor Rayz
date: "2020-10-15T00:00:00Z"
# doi: "10.1109/SMC.2019.8914528"
featured: true
image:
  # caption: 'Image credit: [**Unsplash**](https://unsplash.com/photos/pLCdAaMFLTE)'
  # focal_point: ""
  preview_only: false
links:
- name: arxiv
  url: "https://arxiv.org/abs/2010.03010"
- name: Anthology
  url: "https://www.aclweb.org/anthology/2020.findings-emnlp.415"
publication: "In *Findings of the Association for Computational Linguistics: EMNLP 2020*"
publication_short: "In *Findings of ACL: EMNLP 2020*"
publication_types:
- "1"
#publishDate: "2020-06-01T00:00:00Z"
# slides: example
summary: Using semantic priming to investigate how BERT utilizes lexical relations to inform word probabilities in context. Presented at *Blackbox NLP 2021*.
# tags:
# - Source Themes
title: Exploring BERT’s Sensitivity to Lexical Cues using Tests from Semantic Priming
# url_code: '#'
# url_dataset: '#'
# url_pdf: "papers/cogsci20abstract.pdf"
url_poster: "posters/findings2020.pdf"
# url_project: ""
# url_slides: "slides/fuzzy-risk.pdf"
# url_source: '#'
# url_video: 'https://cutt.ly/bert-priming'
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}

