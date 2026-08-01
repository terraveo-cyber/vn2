import { ClassicalBookSearchResult, EbookProject } from '../types';

export const SAMPLE_CLASSICAL_LIBRARY: ClassicalBookSearchResult[] = [
  {
    id: 'cicero-de-officiis',
    title: 'De Officiis (On Duties)',
    author: 'Marcus Tullius Cicero',
    sourceLanguage: 'latin',
    era: '44 BCE (Classical Latin)',
    sourceLibrary: 'Perseus Digital Library',
    description: "Cicero's masterwork on moral obligation, honor, and public ethics addressed to his son Marcus in Athens.",
    coverStyle: 'from-amber-900 to-stone-900',
    originalEdition: {
      editionType: 'original_first',
      editionTitle: 'Editio Princeps (Subiaco Codex, 1465)',
      year: '1465 CE (First Printed Edition)',
      publisher: 'Conrad Sweynheym & Arnold Pannartz (Subiaco)',
      authorInputNotes: 'Direct manuscript transcription from Cicero’s 44 BCE dictation to Tiro, preserved in the Vatican Palatinus Latinus codices.',
      authenticityScore: 97.4,
      variantsCount: 14,
      chapters: [
        {
          title: 'Liber Primus: Caput I - De Honestat',
          originalXhtml: `<h2 class="chapter-title" id="ch1">LIBER PRIMUS</h2>
<h3 class="section-heading">Caput I: De Morali Honestate</h3>
<p class="chapter-lead"><span class="dropcap">Q</span>uamquam te, Marce fili, annum iam audientem Cratippum, idque Athenis, abundare oportet praeceptis institutisque philosophiae propter summam et doctoris auctoritatem et urbis, quorum alter te scientia augere potest, altera exemplis.</p>
<p class="body-text">Tamen, ut ipse ad meam utilitatem semper cum Graecis Latina coniunxi, neque id in philosophia solum, sed etiam in dicendi exercitatione feci, idem tibi censui faciendum, ut par sis in utriusque orationis facultate.</p>
<blockquote class="ancient-quote">
  <p class="quote-text"><em>"Honestum quod vere dicimus, etsi decorum non est, tamen per se laudabile est."</em></p>
  <cite class="quote-source">— M. T. Cicero, 44 a.C.n.</cite>
</blockquote>
<p class="body-text">Qua de re, cum te hortarer ad philosophiae studia, vehementer te incitavi ut has nostras lucubrationes non sperneres, quae ex fontibus Stoicorum haustae sunt.</p>`,
          textualNotes: ['Preserves archaic spelling "honestate" without medieval orthographic interpolation.']
        },
        {
          title: 'Liber Primus: Caput II - De Quattuor Virtutibus',
          originalXhtml: `<h2 class="chapter-title" id="ch2">LIBER PRIMUS</h2>
<h3 class="section-heading">Caput II: De Fontibus Honestatis</h3>
<p class="chapter-lead"><span class="dropcap">S</span>ed omne quod est honestum id oritur ex aliquo quattuor partium. Nam aut in perspicienda veritate sollertiaque versatur, aut in hominum societate tuenda tributendoque suum cuique.</p>
<p class="body-text">Aut in animi magnitudine sublimitateque cernitur, aut in ordine et modo eorum quae fiunt quaeque dicuntur, in quo inest modestia et temperantia.</p>
<ul class="virtues-list">
  <li class="virtue-item"><strong class="virtue-name">Prudentia:</strong> In cognitione veritatis occupata est.</li>
  <li class="virtue-item"><strong class="virtue-name">Iustitia:</strong> In conservanda societate hominum.</li>
  <li class="virtue-item"><strong class="virtue-name">Fortitudo:</strong> In animi elatione et magnitudine.</li>
  <li class="virtue-item"><strong class="virtue-name">Temperantia:</strong> In ordine et moderatione.</li>
</ul>`,
          textualNotes: ['Features original Stoic division terms used in Republican Rome.']
        }
      ]
    },
    latestAuthorRevisedEdition: {
      editionType: 'author_revised_latest',
      editionTitle: 'Author-Revised Critical Text (Teubner Editio Major)',
      year: '43 BCE (Final Author Revision)',
      publisher: 'Teubneriana Critical Classical Series / Perseus',
      authorInputNotes: 'Final revised dictation incorporating Cicero’s late corrections sent from Tusculum prior to December 43 BCE, featuring full marginal glosses and refined rhetorical transitions.',
      authenticityScore: 99.8,
      variantsCount: 3,
      chapters: [
        {
          title: 'Liber Primus: Caput I - De Honestat (Revised)',
          originalXhtml: `<h2 class="chapter-title" id="ch1">LIBER PRIMUS — EDITIO REVISI</h2>
<h3 class="section-heading">Caput I: De Summo Bono et Morali Honestate</h3>
<p class="chapter-lead"><span class="dropcap">Q</span>uamquam te, Marce fili, annum iam audientem Cratippum, idque Athenis, abundare oportet praeceptis institutisque philosophiae propter summam et doctoris auctoritatem et urbis, quorum alter te scientia augere potest, altera exemplis virtutis.</p>
<p class="body-text">Tamen, ut ipse ad meam utilitatem semper cum Graecis Latina coniunxi, neque id in philosophia solum, sed etiam in dicendi exercitatione feci, idem tibi censui faciendum, ut par sis in utriusque orationis ac facultatis maiestate.</p>
<blockquote class="ancient-quote">
  <p class="quote-text"><em>"Honestum quod vere dicimus, etsi a multitudine decorum non iudicatur, tamen per se atque sua natura laudabile est."</em></p>
  <cite class="quote-source">— M. T. Cicero, Tusculano, 43 a.C.n.</cite>
</blockquote>
<p class="body-text">Qua de re, cum te hortarer ad philosophiae studia, vehementer te incitavi ut has nostras lucubrationes non sperneres, quae ex puris fontibus Stoicorum haustae sunt.</p>`,
          textualNotes: ['Author expanded phrase to "exemplis virtutis" and added "sua natura laudabile" for philosophical precision.']
        },
        {
          title: 'Liber Primus: Caput II - De Quattuor Virtutibus (Revised)',
          originalXhtml: `<h2 class="chapter-title" id="ch2">LIBER PRIMUS — EDITIO REVISI</h2>
<h3 class="section-heading">Caput II: De Fontibus et Radicibus Honestatis</h3>
<p class="chapter-lead"><span class="dropcap">S</span>ed omne quod est honestum id oritur ex aliquo quattuor partium. Nam aut in perspicienda veritate sollertiaque perspicua versatur, aut in hominum societate tuenda tribuendoque suum cuique in aequitate.</p>
<p class="body-text">Aut in animi magnitudine sublimitateque cernitur, aut in ordine et modo eorum quae fiunt quaeque dicuntur, in quo inest modestia, continentia et temperantia.</p>
<ul class="virtues-list">
  <li class="virtue-item"><strong class="virtue-name">Prudentia (Sapientia):</strong> In perspicua cognitione veritatis occupata est.</li>
  <li class="virtue-item"><strong class="virtue-name">Iustitia (Beneficentia):</strong> In conservanda hominum societate et aequitate.</li>
  <li class="virtue-item"><strong class="virtue-name">Fortitudo (Magnanmitas):</strong> In animi elatione et sublimi magnitudine.</li>
  <li class="virtue-item"><strong class="virtue-name">Temperantia (Modestia):</strong> In ordine, verecundia et moderatione.</li>
</ul>`,
          textualNotes: ['Cicero added Latin equivalents in parentheses to map Stoic Greek virtue terms directly.']
        }
      ]
    },
    chapters: [
      {
        title: 'Liber Primus: Caput I - De Honestat',
        originalXhtml: `<h2 class="chapter-title" id="ch1">LIBER PRIMUS</h2>
<h3 class="section-heading">Caput I: De Morali Honestate</h3>
<p class="chapter-lead"><span class="dropcap">Q</span>uamquam te, Marce fili, annum iam audientem Cratippum, idque Athenis, abundare oportet praeceptis institutisque philosophiae propter summam et doctoris auctoritatem et urbis, quorum alter te scientia augere potest, altera exemplis.</p>
<p class="body-text">Tamen, ut ipse ad meam utilitatem semper cum Graecis Latina coniunxi, neque id in philosophia solum, sed etiam in dicendi exercitatione feci, idem tibi censui faciendum, ut par sis in utriusque orationis facultate.</p>
<blockquote class="ancient-quote">
  <p class="quote-text"><em>"Honestum quod vere dicimus, etsi decorum non est, tamen per se laudabile est."</em></p>
  <cite class="quote-source">— M. T. Cicero, 44 a.C.n.</cite>
</blockquote>
<p class="body-text">Qua de re, cum te hortarer ad philosophiae studia, vehementer te incitavi ut has nostras lucubrationes non sperneres, quae ex fontibus Stoicorum haustae sunt.</p>`
      },
      {
        title: 'Liber Primus: Caput II - De Quattuor Virtutibus',
        originalXhtml: `<h2 class="chapter-title" id="ch2">LIBER PRIMUS</h2>
<h3 class="section-heading">Caput II: De Fontibus Honestatis</h3>
<p class="chapter-lead"><span class="dropcap">S</span>ed omne quod est honestum id oritur ex aliquo quattuor partium. Nam aut in perspicienda veritate sollertiaque versatur, aut in hominum societate tuenda tributendoque suum cuique.</p>
<p class="body-text">Aut in animi magnitudine sublimitateque cernitur, aut in ordine et modo eorum quae fiunt quaeque dicuntur, in quo inest modestia et temperantia.</p>
<ul class="virtues-list">
  <li class="virtue-item"><strong class="virtue-name">Prudentia:</strong> In cognitione veritatis occupata est.</li>
  <li class="virtue-item"><strong class="virtue-name">Iustitia:</strong> In conservanda societate hominum.</li>
  <li class="virtue-item"><strong class="virtue-name">Fortitudo:</strong> In animi elatione et magnitudine.</li>
  <li class="virtue-item"><strong class="virtue-name">Temperantia:</strong> In ordine et moderatione.</li>
</ul>`
      }
    ]
  },
  {
    id: 'homer-iliad-greek',
    title: 'Ἰλιάς (Iliad - Book I)',
    author: 'Homer',
    sourceLanguage: 'greek',
    era: 'c. 8th Century BCE (Archaic Greek)',
    sourceLibrary: 'Wikisource Classical',
    description: "The foundational epic of Western literature opening with the wrath of Achilles at the siege of Troy.",
    coverStyle: 'from-blue-900 to-indigo-950',
    originalEdition: {
      editionType: 'original_first',
      editionTitle: 'Venetus A Codex (10th Century Recension)',
      year: 'c. 8th Century BCE / 950 CE Codex',
      publisher: 'Biblioteca Marciana (Venice Ms. Gr. 454)',
      authorInputNotes: 'Earliest complete manuscript carrying Aristarchus of Samothrace critical signs and Alexandrian scholarly scholia.',
      authenticityScore: 98.1,
      variantsCount: 18,
      chapters: [
        {
          title: 'Rhapsody A (Lines 1–32) - Venetus A',
          originalXhtml: `<h2 class="chapter-title" id="hom-1">ΙΛΙΑΔΟΣ ΡΑΨΩΙΔΙΑ Α</h2>
<h3 class="section-heading">Μῆνις Ἀχιλλῆος</h3>
<p class="verse-lead"><span class="dropcap">Μ</span>ῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος<br/>
οὐλομένην, ἣ μυρί’ Ἀχαιοῖς άλγε’ ἔθηκε,<br/>
πολλὰς δ’ ἰφθίμους ψυχὰς Ἄϊδι προΐαψεν<br/>
ἡρώων, αὐτοὺς δὲ ἑλώρια τεῦχε κύνεσσιν<br/>
οἰωνοῖσί τε πᾶσι, Διὸς δ’ ἐτελείετο βουλή.</p>
<p class="verse-body">ἐξ οὗ δὴ τὰ πρῶτα διαστήτην ἐρίσαντε<br/>
Ἀτρεΐδης τε ἄναξ ἀνδρῶν καὶ δῖος Ἀχιλλεύς.</p>`,
          textualNotes: ['Preserves archaic Ionic dative plurals and epic uncontracted verb forms.']
        }
      ]
    },
    latestAuthorRevisedEdition: {
      editionType: 'author_revised_latest',
      editionTitle: 'Aristarchus Authoritative Recension (Oxford Classical Text)',
      year: 'c. 150 BCE / 1920 OCT',
      publisher: 'Oxford University Press Classical Texts',
      authorInputNotes: 'Standard critical edition following Aristarchus of Samothrace’s direct recension based on authentic rhapsodic oral dictation records.',
      authenticityScore: 99.5,
      variantsCount: 4,
      chapters: [
        {
          title: 'Rhapsody A (Lines 1–32) - Aristarchian Recension',
          originalXhtml: `<h2 class="chapter-title" id="hom-1">ΙΛΙΑΔΟΣ ΡΑΨΩΙΔΙΑ Α (OCT)</h2>
<h3 class="section-heading">Μῆνις Ἀχιλλῆος — Editio Critica</h3>
<p class="verse-lead"><span class="dropcap">Μ</span>ῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος<br/>
οὐλομένην, ἣ μυρί’ Ἀχαιοῖς άλγε’ ἔθηκε,<br/>
πολλὰς δ’ ἰφθίμους ψυχὰς Ἄϊδι προΐαψεν<br/>
ἡρώων, αὐτοὺς δὲ ἑλώρια τεῦχε κύνεσσιν<br/>
οἰωνοῖσί τε δαῖτα, Διὸς δ’ ἐτελείετο βουλή.</p>
<p class="verse-body">ἐξ οὗ δὴ τὰ πρῶτα διαστήτην ἐρίσαντε<br/>
Ἀτρεΐδης τε ἄναξ ἀνδρῶν καὶ δῖος Ἀχιλλεύς.</p>`,
          textualNotes: ['Reads "δαῖτα" (feast for birds) as attested in Alexandrian rhapsodic papyri instead of "πᾶσι".']
        }
      ]
    },
    chapters: [
      {
        title: 'Rhapsody A (Lines 1–32)',
        originalXhtml: `<h2 class="chapter-title" id="hom-1">ΙΛΙΑΔΟΣ ΡΑΨΩΙΔΙΑ Α</h2>
<h3 class="section-heading">Μῆνις Ἀχιλλῆος</h3>
<p class="verse-lead"><span class="dropcap">Μ</span>ῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος<br/>
οὐλομένην, ἣ μυρί’ Ἀχαιοῖς άλγε’ ἔθηκε,<br/>
πολλὰς δ’ ἰφθίμους ψυχὰς Ἄϊδι προΐαψεν<br/>
ἡρώων, αὐτοὺς δὲ ἑλώρια τεῦχε κύνεσσιν<br/>
οἰωνοῖσί τε πᾶσι, Διὸς δ’ ἐτελείετο βουλή.</p>
<p class="verse-body">ἐξ οὗ δὴ τὰ πρῶτα διαστήτην ἐρίσαντε<br/>
Ἀτρεΐδης τε ἄναξ ἀνδρῶν καὶ δῖος Ἀχιλλεύς.</p>`
      }
    ]
  },
  {
    id: 'victor-hugo-les-mis',
    title: 'Les Misérables (Tome I)',
    author: 'Victor Hugo',
    sourceLanguage: 'french',
    era: '1862 (19th Century French)',
    sourceLibrary: 'Gallica (BnF)',
    description: "Victor Hugo's monumental masterwork examining social justice, redemption, and human dignity in 19th-century France.",
    coverStyle: 'from-red-950 to-stone-900',
    originalEdition: {
      editionType: 'original_first',
      editionTitle: 'Édition Originale Hetzel-Lacroix (1862)',
      year: '1862 (First Edition)',
      publisher: 'Albert Lacroix, Verboeckhoven et Cie (Bruxelles/Paris)',
      authorInputNotes: 'Original 1862 printed proof sheets published simultaneously in Paris and Brussels.',
      authenticityScore: 96.8,
      variantsCount: 22,
      chapters: [
        {
          title: 'Livre Premier: Chapitre I - M. Myriel (1862)',
          originalXhtml: `<h2 class="chapter-title" id="vh-ch1">LIVRE PREMIER — UN JUSTE</h2>
<h3 class="section-heading">Chapitre I: Monsieur Myriel</h3>
<p class="chapter-lead"><span class="dropcap">E</span>n 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C’était un vieillard d’environ soixante-quinze ans; il occupait le siège de Digne depuis 1806.</p>
<p class="body-text">Quoique ce détail ne touche en rien au fond même de ce que nous avons à raconter, il n’est peut-être pas inutile, ne fût-ce que pour être exact en tout, d’indiquer ici les bruits et les propos qui couraient sur son compte au moment où il arrivait dans le diocèse.</p>
<blockquote class="french-quote">
  <p class="quote-text">« Vrai ou faux, ce qu’on dit des hommes tient souvent autant de place dans leur vie et surtout dans leur destinée que ce qu’ils font. »</p>
</blockquote>`,
          textualNotes: ['First edition layout without Hugo’s later expanded biographical notes on Bishop Myriel.']
        }
      ]
    },
    latestAuthorRevisedEdition: {
      editionType: 'author_revised_latest',
      editionTitle: 'Édition Definitive Ne Varietur (Victor Hugo Last Revised Text)',
      year: '1880 (Author-Revised Final Text)',
      publisher: 'J. Hetzel & Cie / Gallica BnF',
      authorInputNotes: 'Final revised edition corrected personally by Victor Hugo in 1880 with extensive authorial manuscript notes and preface additions.',
      authenticityScore: 99.9,
      variantsCount: 2,
      chapters: [
        {
          title: 'Livre Premier: Chapitre I - M. Myriel (Ne Varietur 1880)',
          originalXhtml: `<h2 class="chapter-title" id="vh-ch1">LIVRE PREMIER — UN JUSTE (ÉDITION DEFINITIVE)</h2>
<h3 class="section-heading">Chapitre I: Monsieur Myriel</h3>
<p class="chapter-lead"><span class="dropcap">E</span>n 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C’était un vieillard d’environ soixante-quinze ans; il occupait le siège de Digne depuis l’année 1806, après la réorganisation consulaire.</p>
<p class="body-text">Quoique ce détail ne touche en rien au fond même de ce que nous avons à raconter, il n’est peut-être pas inutile, ne fût-ce que pour être exact en tout, d’indiquer ici les bruits et les propos qui couraient sur son compte au moment où il arrivait dans le diocèse.</p>
<blockquote class="french-quote">
  <p class="quote-text">« Vrai ou faux, ce qu’on dit des hommes tient souvent autant de place dans leur vie et surtout dans leur destinée que ce qu’ils font. »</p>
  <cite class="quote-source">— Victor Hugo, Notes manuscrites de Hauteville House, 1880</cite>
</blockquote>`,
          textualNotes: ['Includes Hugo’s exact political and historical precision clause on the consular reorganization.']
        }
      ]
    },
    chapters: [
      {
        title: 'Livre Premier: Chapitre I - M. Myriel',
        originalXhtml: `<h2 class="chapter-title" id="vh-ch1">LIVRE PREMIER — UN JUSTE</h2>
<h3 class="section-heading">Chapitre I: Monsieur Myriel</h3>
<p class="chapter-lead"><span class="dropcap">E</span>n 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. C’était un vieillard d’environ soixante-quinze ans; il occupait le siège de Digne depuis 1806.</p>
<p class="body-text">Quoique ce détail ne touche en rien au fond même de ce que nous avons à raconter, il n’est peut-être pas inutile, ne fût-ce que pour être exact en tout, d’indiquer ici les bruits et les propos qui couraient sur son compte au moment où il arrivait dans le diocèse.</p>
<blockquote class="french-quote">
  <p class="quote-text">« Vrai ou faux, ce qu’on dit des hommes tient souvent autant de place dans leur vie et surtout dans leur destinée que ce qu’ils font. »</p>
</blockquote>`
      }
    ]
  },
  {
    id: 'descartes-discours',
    title: 'Discours de la méthode',
    author: 'René Descartes',
    sourceLanguage: 'french',
    era: '1637 (Early Modern French)',
    sourceLibrary: 'Gallica (BnF)',
    description: "Descartes' foundational philosophical treatise introducing Cartesian doubt and rationalism in 17th century French.",
    coverStyle: 'from-emerald-950 to-slate-900',
    originalEdition: {
      editionType: 'original_first',
      editionTitle: 'Édition Originale Leyde (1637)',
      year: '1637 (Leyden Anonymous Printing)',
      publisher: 'Jan Maire (Leyde, Hollande)',
      authorInputNotes: 'First published edition printed anonymously by Descartes in Leyden to bypass French royal censorship.',
      authenticityScore: 97.2,
      variantsCount: 11,
      chapters: [
        {
          title: 'Première Partie - Leyde 1637',
          originalXhtml: `<h2 class="chapter-title" id="des-1">DISCOURS DE LA MÉTHODE</h2>
<h3 class="section-heading">Première Partie</h3>
<p class="chapter-lead"><span class="dropcap">L</span>e bon sens est la chose du monde la mieux partagée; car chacun pense en être si bien pourvu que ceux même qui sont les plus difficiles à contenter en toute autre thing n’ont point coutume d’en désirer plus qu’ils en ont.</p>`
        }
      ]
    },
    latestAuthorRevisedEdition: {
      editionType: 'author_revised_latest',
      editionTitle: 'Édition Revisée d’Amsterdam avec Annotations Latines',
      year: '1644 (Descartes Authorized Revision)',
      publisher: 'Louis Elzevier (Amsterdam)',
      authorInputNotes: 'Revised edition published alongside the Latin translation (Specimina Philosophiae) containing Descartes’ final inline terminology refinements.',
      authenticityScore: 99.7,
      variantsCount: 2,
      chapters: [
        {
          title: 'Première Partie - Amsterdam 1644',
          originalXhtml: `<h2 class="chapter-title" id="des-1">DISCOURS DE LA MÉTHODE (1644)</h2>
<h3 class="section-heading">Première Partie: De la raison humaine</h3>
<p class="chapter-lead"><span class="dropcap">L</span>e bon sens est la chose du monde la mieux partagée; car chacun pense en être si bien pourvu que ceux même qui sont les plus difficiles à contenter en toute autre chose n’ont point coutume d’en désirer plus qu’ils en ont.</p>`
        }
      ]
    },
    chapters: [
      {
        title: 'Première Partie: Considérations touchant les sciences',
        originalXhtml: `<h2 class="chapter-title" id="des-1">DISCOURS DE LA MÉTHODE</h2>
<h3 class="section-heading">Première Partie</h3>
<p class="chapter-lead"><span class="dropcap">L</span>e bon sens est la chose du monde la mieux partagée; car chacun pense en être si bien pourvu que ceux même qui sont les plus difficiles à contenter en toute autre chose n’ont point coutume d’en désirer plus qu’ils en ont.</p>`
      }
    ]
  },
  {
    id: 'augustine-confessiones',
    title: 'Confessiones (Book I)',
    author: 'Aurelius Augustinus (St. Augustine)',
    sourceLanguage: 'latin',
    era: '397–400 CE (Late Antique Latin)',
    sourceLibrary: 'Perseus Digital Library',
    description: "Augustine's spiritual autobiography and philosophical meditation written in late classical Latin.",
    coverStyle: 'from-purple-950 to-neutral-900',
    originalEdition: {
      editionType: 'original_first',
      editionTitle: 'Codex Sessorianus (6th Century Vellum)',
      year: 'c. 400 CE / 550 CE Codex',
      publisher: 'Biblioteca Nazionale Central di Roma (Ms. Sess. 55)',
      authorInputNotes: 'Earliest surviving vellum codex of Augustine’s Confessions.',
      authenticityScore: 97.9,
      variantsCount: 15,
      chapters: [
        {
          title: 'Liber I: Caput I - Sessorianus',
          originalXhtml: `<h2 class="chapter-title" id="aug-1">CONFESSIONUM LIBER PRIMUS</h2>
<p class="chapter-lead"><span class="dropcap">M</span>agnus es, Domine, et laudabilis valde: magna virtus tua, et sapientiae tuae non est numerus.</p>`
        }
      ]
    },
    latestAuthorRevisedEdition: {
      editionType: 'author_revised_latest',
      editionTitle: 'Retractationes Revised Recension (Maurist Critical Edition)',
      year: '427 CE (Augustine Retractations) / 1689 Maurist',
      publisher: 'Congregation of Saint Maur / Perseus Digital Library',
      authorInputNotes: 'Includes Augustine’s own 427 CE Retractationes corrections reviewing and clarifying his early theological phrasing.',
      authenticityScore: 99.8,
      variantsCount: 1,
      chapters: [
        {
          title: 'Liber I: Caput I - Retractationes Revised',
          originalXhtml: `<h2 class="chapter-title" id="aug-1">CONFESSIONUM LIBER PRIMUS (RETRACTATUS)</h2>
<p class="chapter-lead"><span class="dropcap">M</span>agnus es, Domine, et laudabilis valde: magna virtus tua, et sapientiae tuae non est numerus. Et laudare te vult homo, aliqua portio creaturae tuae, et homo circumferens mortalitatem suam, testimonium peccati sui.</p>`
        }
      ]
    },
    chapters: [
      {
        title: 'Liber I: Caput I - Magnus es, Domine',
        originalXhtml: `<h2 class="chapter-title" id="aug-1">CONFESSIONUM LIBER PRIMUS</h2>
<h3 class="section-heading">Caput I: Invocatio Dei</h3>
<p class="chapter-lead"><span class="dropcap">M</span>agnus es, Domine, et laudabilis valde: magna virtus tua, et sapientiae tuae non est numerus. Et laudare te vult homo, aliqua portio creaturae tuae, et homo circumferens mortalitatem suam.</p>`
      }
    ]
  }
];

export const INITIAL_PROJECT: EbookProject = {
  id: 'cicero-de-officiis-project',
  title: 'De Officiis (On Duties)',
  author: 'Marcus Tullius Cicero',
  sourceLanguage: 'latin',
  era: '44 BCE (Classical Latin)',
  description: "Cicero's masterwork on moral obligation, honor, and public ethics addressed to his son Marcus in Athens.",
  cssContent: `/* Ebook Default Stylesheet - Preserved during conversion */
body { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; margin: 2rem; }
h2.chapter-title { font-size: 1.8rem; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 2px solid #d4af37; padding-bottom: 0.5rem; color: #d4af37; }
h3.section-heading { font-size: 1.25rem; font-style: italic; color: #4a90e2; margin-top: 1.5rem; }
p.chapter-lead { font-size: 1.1rem; font-weight: 500; text-indent: 0; margin-top: 1rem; }
span.dropcap { float: left; font-size: 3.2rem; line-height: 0.8; padding-right: 0.3rem; font-family: serif; color: #d4af37; }
p.body-text { margin-top: 0.8rem; text-indent: 1.5rem; }
blockquote.ancient-quote { margin: 1.5rem 2rem; padding: 1rem; border-left: 4px solid #d4af37; background-color: #1c1a14; font-style: italic; color: #e0e0e0; }
cite.quote-source { display: block; text-align: right; font-size: 0.85rem; font-style: normal; color: #aaa; margin-top: 0.5rem; }
ul.virtues-list { margin: 1rem 2rem; list-style-type: square; }
li.virtue-item { margin-bottom: 0.4rem; }
strong.virtue-name { color: #d4af37; font-weight: 600; }
`,
  chapters: [
    {
      id: 'ch-1',
      title: 'Liber Primus: Caput I - De Honestat',
      originalXhtml: `<h2 class="chapter-title" id="ch1">LIBER PRIMUS</h2>
<h3 class="section-heading">Caput I: De Morali Honestate</h3>
<p class="chapter-lead"><span class="dropcap">Q</span>uamquam te, Marce fili, annum iam audientem Cratippum, idque Athenis, abundare oportet praeceptis institutisque philosophiae propter summam et doctoris auctoritatem et urbis, quorum alter te scientia augere potest, altera exemplis.</p>
<p class="body-text">Tamen, ut ipse ad meam utilitatem semper cum Graecis Latina coniunxi, neque id in philosophia solum, sed etiam in dicendi exercitatione feci, idem tibi censui faciendum, ut par sis in utriusque orationis facultate.</p>
<blockquote class="ancient-quote">
  <p class="quote-text"><em>"Honestum quod vere dicimus, etsi decorum non est, tamen per se laudabile est."</em></p>
  <cite class="quote-source">— M. T. Cicero, 44 a.C.n.</cite>
</blockquote>
<p class="body-text">Qua de re, cum te hortarer ad philosophiae studia, vehementer te incitavi ut has nostras lucubrationes non sperneres, quae ex fontibus Stoicorum haustae sunt.</p>`,
      translatedXhtml: `<h2 class="chapter-title" id="ch1">BOOK ONE</h2>
<h3 class="section-heading">Chapter I: On Moral Duty and Honor</h3>
<p class="chapter-lead"><span class="dropcap">A</span>lthough, my son Marcus, you have been listening to Cratippus for a year now, and that in Athens, you ought to be abundantly supplied with the precepts and teachings of philosophy, owing to the supreme authority both of the teacher and of the city, one of which can enrich you with knowledge, the other with noble examples.</p>
<p class="body-text">Nevertheless, just as I have always joined Greek with Latin for my own benefit—and that not in philosophy alone, but also in the practice of public eloquence—I consider that you should do the same, so that you may achieve equal mastery in the expression of both languages.</p>
<blockquote class="ancient-quote">
  <p class="quote-text"><em>"That which we truly call honorable, even if it brings no external glory, remains intrinsically laudable in itself."</em></p>
  <cite class="quote-source">— M. T. Cicero, 44 BCE</cite>
</blockquote>
<p class="body-text">For this reason, while encouraging you toward philosophical studies, I strongly urge you not to despise these writings of ours, which have been drawn directly from the living fountains of the Stoic thinkers.</p>`,
      originalWordCount: 88,
      translatedWordCount: 161,
      sentenceCountOriginal: 4,
      sentenceCountTranslated: 4,
      status: 'completed',
      glossaryNotes: [
        { term: 'Cratippus', translation: 'Peripatetic philosopher', note: 'Head of the Peripatetic school in Athens who instructed Cicero’s son.' },
        { term: 'Lucubrationes', translation: 'Nightly writings / studies', note: 'Refers to scholarly works composed by lamplight late at night.' }
      ]
    },
    {
      id: 'ch-2',
      title: 'Liber Primus: Caput II - De Quattuor Virtutibus',
      originalXhtml: `<h2 class="chapter-title" id="ch2">LIBER PRIMUS</h2>
<h3 class="section-heading">Caput II: De Fontibus Honestatis</h3>
<p class="chapter-lead"><span class="dropcap">S</span>ed omne quod est honestum id oritur ex aliquo quattuor partium. Nam aut in perspicienda veritate sollertiaque versatur, aut in hominum societate tuenda tributendoque suum cuique.</p>
<p class="body-text">Aut in animi magnitudine sublimitateque cernitur, aut in ordine et modo eorum quae fiunt quaeque dicuntur, in quo inest modestia et temperantia.</p>
<ul class="virtues-list">
  <li class="virtue-item"><strong class="virtue-name">Prudentia:</strong> In cognitione veritatis occupata est.</li>
  <li class="virtue-item"><strong class="virtue-name">Iustitia:</strong> In conservanda societate hominum.</li>
  <li class="virtue-item"><strong class="virtue-name">Fortitudo:</strong> In animi elatione et magnitudine.</li>
  <li class="virtue-item"><strong class="virtue-name">Temperantia:</strong> In ordine et moderatione.</li>
</ul>`,
      translatedXhtml: `<h2 class="chapter-title" id="ch2">BOOK ONE</h2>
<h3 class="section-heading">Chapter II: The Four Cardinal Fountains of Honor</h3>
<p class="chapter-lead"><span class="dropcap">B</span>ut everything that is morally honorable arises from one of four sources. For it is concerned either with the insightful perception of truth and intellectual skill, or with safeguarding human society and assigning to each person their rightful due.</p>
<p class="body-text">Or it is revealed in the greatness and loftiness of spirit, or in the orderly measure of all that is done and spoken, wherein resides modesty and self-restraint.</p>
<ul class="virtues-list">
  <li class="virtue-item"><strong class="virtue-name">Prudence:</strong> Engaged in the steadfast search for truth.</li>
  <li class="virtue-item"><strong class="virtue-name">Justice:</strong> Dedicated to preserving human fellowship and equity.</li>
  <li class="virtue-item"><strong class="virtue-name">Fortitude:</strong> Exemplified in elevation and courage of mind.</li>
  <li class="virtue-item"><strong class="virtue-name">Temperance:</strong> Displayed in orderliness and measured restraint.</li>
</ul>`,
      originalWordCount: 68,
      translatedWordCount: 114,
      sentenceCountOriginal: 3,
      sentenceCountTranslated: 3,
      status: 'completed',
      glossaryNotes: [
        { term: 'Honestum', translation: 'Moral Honor / Virtue', note: 'Central Roman concept blending duty, virtue, and nobility.' }
      ]
    }
  ],
  annotations: [
    {
      id: 'ann-1',
      selectedText: 'Cratippus',
      pane: 'source',
      chapterId: 'ch-1',
      chapterTitle: 'Liber Primus: Caput I - De Honestat',
      type: 'historical_character',
      title: 'Cratippus of Pergamum (Peripatetic Philosopher)',
      explanationOrDefinition: 'Head of the Peripatetic Academy in Athens (c. 50 BCE), highly praised by Cicero as equal to the greatest philosophers of Greece.',
      historicalDetails: 'Cratippus was a close personal friend of Cicero and teacher to Marcus Cicero Minor in Athens. Cicero secured Roman citizenship for him through Julius Caesar.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ann-2',
      selectedText: 'Marce fili',
      pane: 'source',
      chapterId: 'ch-1',
      chapterTitle: 'Liber Primus: Caput I - De Honestat',
      type: 'historical_character',
      title: 'Marcus Tullius Cicero Minor (Cicero the Younger)',
      explanationOrDefinition: 'The son of Cicero (born 65 BCE), to whom De Officiis was written as a philosophical guidebook while studying in Athens.',
      historicalDetails: 'Later served as a military tribune under Marcus Junius Brutus, fought at Philippi, and was appointed consul in 30 BCE by Octavian (Augustus).',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ann-3',
      selectedText: 'Lucubrationes',
      pane: 'source',
      chapterId: 'ch-1',
      chapterTitle: 'Liber Primus: Caput I - De Honestat',
      type: 'dictionary',
      title: 'Lucubratio (Latin Noun, f.)',
      explanationOrDefinition: 'Nocturnal study or literary composition carried out by lamp-light; scholarly diligence produced at night.',
      historicalDetails: 'Etymology: From Latin "lucubrare" (to work by lamplight), from "lux" (light). In classical rhetoric, signified supreme intellectual devotion.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ann-4',
      selectedText: 'Stoicorum fontibus',
      pane: 'source',
      chapterId: 'ch-1',
      chapterTitle: 'Liber Primus: Caput I - De Honestat',
      type: 'footnote',
      title: 'Panaetius of Rhodes and the Middle Stoics',
      explanationOrDefinition: 'Cicero explicitly draws the first two books of De Officiis from the lost treatise "On Duty" (Peri Tou Kathekontos) by Panaetius of Rhodes.',
      historicalDetails: 'Panaetius modernized Stoicism for the Roman aristocratic elite, introducing practical duty (kathekon) alongside theoretical virtue.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ann-5',
      selectedText: 'utriusque orationis facultate',
      pane: 'source',
      chapterId: 'ch-1',
      chapterTitle: 'Liber Primus: Caput I - De Honestat',
      type: 'foreign_idiom',
      title: 'Utraque Lingua / Utriusque Orationis',
      explanationOrDefinition: 'Classical Roman idiom referring to bilingual mastery in both Greek (the language of philosophy) and Latin (the language of law and statecraft).',
      historicalDetails: 'Roman elite education demanded equal eloquence in Greek and Latin, as articulated by Quintilian and Suetonius.',
      createdAt: new Date().toISOString()
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
