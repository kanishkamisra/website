---
header:
  caption: ""
  image: "KOALAB.png"
  share_only: true
summary: "KOALAB — a community of linguists, computer scientists, and cognitive scientists studying how abstractions emerge in language learners."
layout: docs
title: KOALAB
hide_title: true
---

<!-- <img src="/img/KOALAB.png" alt="koalab logo" width="600" height="300" style="background-color:transparent; box-shadow: none !important;">
 -->

 <img src="/img/KOALAB.png" alt="koalab logo" width="600" height="300" class="logo-tight" style="background-color:transparent; box-shadow: none !important;">

<!-- ## About Us -->

Koalab is a community of linguists, computer scientists, and cognitive scientists excited about the use of computational methods to study language in humans and artificial intelligence. Our ultimate goal is to track down how abstractions---generalized representations or computations over more specific instances---emerge in language learners. We are specifically interested in tracing the origins of abstractions that underlie linguistic generalization (surface-form competition, word order, selection restrictions, etc.) and general purpose conceptual behaviors (inductive generalization, property inheritance, conceptual organization, etc.). To this end, we:

* **Develop tests for AI systems that target their ability to capture these abstractions** -- e.g., [COMPS @ EACL 2023 (Best Paper Award)](https://aclanthology.org/2023.eacl-main.213/), [Padmanabhan et al., 2026 @ ACL Findings](https://aclanthology.org/2026.findings-acl.1842/).
  <!-- * [Misra et al., 2022](), [] -->
* **Develop methods that allow us to understand what cues in a computational model's learning environment facilitate its ability to demonstrate a specific abstraction** -- e.g., [Misra and Mahowald, 2024 @ EMNLP (Outstanding paper award)](https://aclanthology.org/2024.emnlp-main.53/)
* **Develop analysis methods to answer long standing philosophical questions about the nature of representations that can learned from language alone (vs. those requiring extra-linguistic information)** -- e.g., [Qin et al., 2025 @ NeurIPS](https://arxiv.org/abs/2507.13328), [Xu et al., 2026 @ ACL](https://aclanthology.org/2026.acl-long.742/)
* **Use interpretability methods to understand the representational basis of abstraction-like phenomena** -- e.g., [Rodriguez, Mueller, and Misra, 2025 @ NAACL](https://aclanthology.org/2025.naacl-long.574/)
* **Use AI models as simulated learners to test and generate *novel* hypotheses about linguistic abstraction and generalization** -- e.g., [Misra and Kim, 2024/6](https://arxiv.org/abs/2408.05086).

Our work has been recognized with paper awards at NAFIPS 2021, EACL 2023, ACL 2023, and EMNLP 2024.

koalab was officially lauched in Fall 2025, shortly after the name was proposed by [Najoung Kim](https://najoung.kim), long time friend of the lab.

**Note:** It is ok to pronounce our name as Koala-lab.

<!-- ## Projects

### Understanding Linguistic Generalization

AANN
Dative
Dative

### Understanding Conceptual Behavior

Typicality
COMPS
Sim vs. Tax
Bears

### Assessing Discourse Sensitive Properties in LMs -->


{{< people >}}

## Alumni

<!--Just a list-->
* Siyuan Song - PhD Student at Princeton University
* Daniel Brubaker - PhD student at Georgetown University
* Jwalanthi Ranganathan - SWE at Apple


<!-- ## Long Term Koalaborators

<div class="people-grid">
{{< person-card name="Najoung Kim" role="Namer of Lab, Asst. Prof @ BU" photo="" href="/home" affiliation="Boston University" >}}
{{< person-card name="Kyle Mahowald" role="Assistant Prof @ UT" photo="" href="/home" affiliation="UT Austin" >}}
{{< person-card name="Jessy Li" role="Associate Prof @ UT" photo="" href="/home" affiliation="UT Austin" >}}
{{< person-card name="Freda Shi" role="Assistant Prof @ Waterloo" photo="" href="/home" affiliation="UT Austin" >}}
{{< person-card name="Leonie Weissweiler" role="Postdoc @ Uppsala" photo="" href="/home" affiliation="Uppsala University" >}}
{{< person-card name="Jaap Jumelet" role="Postdoc @ Groningen" photo="" href="/home" affiliation="UT Austin" >}}
</div> -->



<!-- ## Alumni -->

<!-- - Jwalanthi Ranganathan (Now at Apple) -->



<style>
/* .person-card {
  display: inline-block;
  width: 200px;
  margin: 15px;
  text-align: center;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.person-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.person-photo {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.person-name {
  margin: 12px 0 5px 0;
  font-size: 18px;
  font-weight: bold;
}

.person-role {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.person-name a {
  color: inherit;
  text-decoration: none;
}

.person-name a:hover {
  color: #1b6ca8;
}

.person-affiliation {
  margin: 0 0 12px 0;
  color: #999;
  font-size: 12px;
} */

 .person-card {
  display: inline-block;
  width: 160px;
  /* margin: 1px 1px; */
  margin: 0;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
}

.person-photo {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  margin: 0 auto;
  border: 4px solid #1b6ca8;
  box-shadow: 0 8px 20px rgba(0,102,204,0.3);
  transition: all 0.3s ease;
}

.person-card:hover .person-photo {
  border-color: #1b6ca8;
  box-shadow: 0 8px 20px rgba(27,108,168,0.3);
  transform: rotate(5deg);
}

.person-name {
  margin: 12px 0 4px 0;
  font-size: 18px;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: -0.2px;
}

.person-name a {
  color: #1b6ca8;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.person-name a:hover {
  background-color: #ffe599;
  padding: 1px 3px;
  border-radius: 4px;
}

.person-role {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
  font-weight: 400;
}

.person-affiliation {
  margin: 0;
  padding: 8px 12px;
  background: #f0f0f0;
  border-radius: 20px;
  color: #999;
  font-size: 12px;
  display: inline-block;
}

.people-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 18px;
  padding: 2px;
  /* Cap at 5 tiles per row: 5 * 160px card + 4 * 18px gap = 872px, plus a
     few px of headroom so the 5th tile never wraps on sub-pixel rounding.
     A 6th tile needs 1050px and wraps. Fewer than 5 pack left (no stretch). */
  max-width: 880px;
}

.logo-tight {
  margin-top: -80px !important;
  display: block;
}
</style>