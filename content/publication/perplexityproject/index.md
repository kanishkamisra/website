---
abstract: >
  Targeted syntactic evaluations of language models ask whether models show stable preferences for syntactically acceptable content over minimal-pair unacceptable inputs. Our best syntactic evaluation datasets, however, provide substantially less linguistic context than models receive during pretraining. This mismatch raises an important question: how robust are models’ syntactic judgements across different contexts? In this paper, we vary the input contexts based on: length, the types of syntactic phenomena it contains, and whether or not there are grammatical violations. We find that model judgements are generally robust when placed in randomly sampled linguistic contexts, but are unstable when contexts match the test stimuli in syntactic structure. Among all tested models (GPT-2 and five variants of OPT), we find that model performance is affected when we provided contexts with matching syntactic structure: performance significantly improves when contexts are acceptable, and it significantly declines when they are unacceptable. This effect is amplified by the length of the context, except for unrelated inputs. We show that these changes in model performance are not explainable by acceptability-preserving syntactic perturbations. This sensitivity to highly specific syntactic features of the context can only be explained by the models’ implicit in-context learning abilities.<br><br>***This paper was recognized as an outstanding paper at ACL 2023!***
authors:
- Koustuv Sinha
- Jon Gauthier
- Aaron Mueller
- admin 
- Keren Fuentes
- Roger Levy
- Adina Williams
date: "2023-07-02T00:00:00Z"
# doi: "10.1109/SMC.2019.8914528"
featured: true
links:
- name: ACL Anthology
  url: https://aclanthology.org/2023.acl-long.333/
publication: In *Proceedings of the Association for Computational Linguistics, 2023*
publication_short: In *ACL 2023*
publication_types: 
- "1"
#publishDate: "2021-08-01T00:00:00Z"
# slides: example
summary: >
  Measuring LM acceptability judgments by systematically manipulating the linguistic context in a few shot setting. (<b>Recipient of an Outstanding Paper Award</b>)
# tags:
# - Source Themes
title: "Language model acceptability judgements are not always robust to context"
#url_code: 'https://github.com/kanishkamisra/comps'
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

