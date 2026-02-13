---
header:
  caption: ""
  image: ""
layout: docs
title: 
---

<!-- <img src="/img/KOALAB.png" alt="koalab logo" width="600" height="300" style="background-color:transparent; box-shadow: none !important;">
 -->

 <img src="/img/KOALAB.png" alt="koalab logo" width="600" height="300" class="logo-tight" style="background-color:transparent; box-shadow: none !important;">

## About Us

We are a community of linguists, computer scientists, and cognitive scientists excited about the use of computational methods to study language in humans and artificial intelligence. Our ultimate goal is to track down how abstractions---generalized representations or computations over more specific instances---emerge in language learners. We are specifically interested in tracing the origins of abstractions that underlie linguistic generalization (surface-form competition, word order, selection restrictions, etc.) and general purpose conceptual behaviors (inductive generalization, property inheritance, conceptual organization, etc.). To this end, we:

* Develop tests for AI systems that target their ability to capture these abstractions.
  <!-- * [Misra et al., 2022](), [] -->
* Develop methods that allow us to understand what cues in a computational model's learning environment facilitate its ability to demonstrate a specific abstraction.
* Use AI models as simulated learners to test and generate *novel* hypotheses about linguistic abstraction and generalization.

Our work has been recognized with paper awards at NAFIPS 2021, EACL 2023, ACL 2023, and EMNLP 2024.

Koalab was officially lauched in Fall 2025, shortly after the name was proposed by [Najoung Kim](https://najoung.kim), long time friend of the lab.

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


## Members
<div class="people-grid">
  <!-- Repeat person-card div for each person -->
  <!-- <div class="person-card">
  <img src="images/avatar.jpg" alt="Person Name" class="person-photo">
  <h3 class="person-name"><a href="https://kanishka.website">Kanishka Misra</a></h3>
  <p class="person-role">Principal Investigator</p>
  <p class="person-affiliation">UT Austin</p>
  </div>  -->
  {{< person-card name="Kanishka Misra" role="Principal Investigator" photo="images/avatar.jpg" href="/" affiliation="UT Austin" >}}
  {{< person-card name="Daniel Brubaker" role="Undergrad (Senior)" photo="/img/person2.jpg" href="." affiliation="UT Austin" >}}
  {{< person-card name="Sriram Padmanabhan" role="Undergrad (Senior)" photo="/img/people/sriram.jpg" href="." affiliation="UT Austin" >}}
  {{< person-card name="Siyuan Song" role="Undergrad (Senior)" photo="/img/people/siyuan.jpg" href="." affiliation="UT Austin" >}}
</div>

## Student Affiliates

<div class="people-grid">
  {{< person-card name="Sasha Boguraev" role="PhD Student (advised by Kyle Mahowald)" photo="/img/people/sasha.jpg" href="https://sashaboguraev.github.io/" affiliation="UT Austin" >}}
  {{< person-card name="Lalchand Pandia" role="PhD Student (advised by Allyson Ettinger)" photo="/img/people/lalchand.jpg" href="." affiliation="University of Chicago" >}}
  {{< person-card name="Yulu Qin" role="PhD Student (advised by Najoung Kim)" photo="/img/people/yulu.jpg" href="." affiliation="Boston University" >}}
  {{< person-card name="Juan Diego Rodriguez" role="PhD Student (advised by Greg Durrett and Katrin Erk)" photo="/img/people/JuanDiegoRodriguez.jpg" href="." affiliation="UT Austin" >}}
  {{< person-card name="William Sheffield" role="PhD Student (advised by Jessy Li)" photo="/img/people/willsheff.jpg" href="." affiliation="UT Austin" >}}
  {{< person-card name="Tianyang Xu" role="PhD Student (advised by Karen Livescu)" photo="" href="." affiliation="TTIC" >}}
  {{< person-card name="Qing Yao" role="PhD Student (advised by Kyle Mahowald)" photo="/img/people/qing-yao.jpg" href="." affiliation="UT Austin" >}}
  <!-- {{< person-card name="Youn-Gyu Park" role="PhD Student (advised by John Beavers)" photo="" href="." affiliation="UT Austin" >}} -->
  <!-- {{< person-card name="Zach Studdiford" role="Undergrad (Senior)" photo="/img/person3.jpg" href="/authors/person-three/" affiliation="UW Madison" >}} -->
</div>


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
  width: 200px;
  /* margin: 1px 1px; */
  margin: 0;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
}

.person-photo {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 50%;
  margin: 0 auto;
  border: 5px solid #1b6ca8;
  box-shadow: 0 8px 20px rgba(0,102,204,0.3);
  transition: all 0.3s ease;
}

.person-card:hover .person-photo {
  border-color: #1b6ca8;
  box-shadow: 0 8px 20px rgba(27,108,168,0.3);
  transform: rotate(5deg);
}

.person-name {
  margin: 15px 0 5px 0;
  font-size: 22px;
  font-weight: 900;
  color: #1a1a1a;
}

.person-name a {
  color: #1b6ca8;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.person-name a:hover {
  background-color: #ffe599;
  padding: 2px 6px;
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
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;  /* Changed from 20px */
  padding: 2px;
}

.logo-tight {
  margin-top: -80px !important;
  display: block;
}
</style>