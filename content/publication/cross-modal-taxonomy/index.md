---
abstract: >
  What is the interplay between semantic representations learned by language models (LM) from surface form alone to those learned from more grounded evidence? We study this question for a scenario where part of the input comes from a different modality -- in our case, in a vision-language model (VLM), where a pretrained LM is aligned with a pretrained image encoder. As a case study, we focus on the task of predicting hypernyms of objects represented in images. We do so in a VLM setup where the image encoder and LM are kept frozen, and only the intermediate mappings are learned. We progressively deprive the VLM of explicit evidence for hypernyms, and test whether knowledge of hypernyms is recoverable from the LM. We find that the LMs we study can recover this knowledge and generalize even in the most extreme version of this experiment (when the model receives no evidence of a hypernym during training). Additional experiments suggest that this cross-modal taxonomic generalization persists under counterfactual image-label mappings only when the counterfactual data have high visual similarity within each category. Taken together, these findings suggest that cross-modal generalization in LMs arises as a result of both coherence in the extralinguistic input and knowledge derived from language cues.
authors:
- Tianyang Xu
- Marcelo Sandoval-Castaneda
- Greg Shakhnarovich
- Karen Livescu
- admin 
date: "2026-07-15T00:00:00Z"
featured: true
links:
- name: arxiv
  url: https://arxiv.org/abs/2603.07474
publication: In *Proceedings of the 64th Annual Meeting of the Association for Computational Linguistics*
publication_short: In *ACL 2026*
publication_types:
- "1"
summary: >
  Studying whether vision-language models can recover and generalize taxonomic (hypernym) knowledge in their language model component even when explicit visual evidence is withheld.
title: "Cross-Modal Taxonomic Generalization in (Vision-) Language Models"
---

{{% alert note %}}
Click the *Cite* button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /alert %}}
