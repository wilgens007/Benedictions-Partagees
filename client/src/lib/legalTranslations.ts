import type { Language } from "@shared/schema";

// Legal page translations (Terms of Use and Privacy Policy)
// English source is the hardcoded text in the page components.
// FR and HT drafts reviewed by Wilgens.

export const legalTranslations: Record<Language, { terms: Record<string, string>; privacy: Record<string, string> }> = {
  fr: {
    terms: {
      "intro1": `Bienvenue sur Bénédictions Partagées (« BP », « nous », « notre » ou « nos »). En accédant à notre application mobile et à nos services ou en les utilisant, vous acceptez les présentes Conditions d'utilisation.`,
      "intro2": `Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.`,
      "s10_body": `Pour toute question concernant ces Conditions, des problèmes de facturation ou des préoccupations liées à l'abonnement, contactez :`,
      "s10_title": `10. Coordonnées`,
      "s1_body": `Bénédictions Partagées est une plateforme numérique chrétienne proposant :`,
      "s1_items": `- La diffusion de musique gospel
- Des dévotions quotidiennes
- Des fonctionnalités de demandes de prière
- L'engagement communautaire
- Des services d'abonnement Premium optionnels`,
      "s1_note": `Le contenu est fourni uniquement à des fins spirituelles, inspirantes et de divertissement.`,
      "s1_title": `1. Objet de l'application`,
      "s2_body": `Pour accéder à certaines fonctionnalités, vous devrez peut-être créer un compte. Vous acceptez de :`,
      "s2_items": `- Fournir des informations exactes
- Préserver la confidentialité de vos identifiants de connexion
- Être responsable de l'activité de votre compte`,
      "s2_note1": `Nous nous réservons le droit de suspendre les comptes qui enfreignent ces Conditions.`,
      "s2_note2": `Vous devez avoir au moins 13 ans pour utiliser cette application.`,
      "s2_title": `2. Comptes utilisateurs`,
      "s3_a_items": `- Les paiements sont traités de manière sécurisée via Stripe.
- En vous abonnant, vous autorisez la facturation récurrente selon la formule choisie (mensuelle ou annuelle).
- Les frais d'abonnement sont débités automatiquement au début de chaque cycle de facturation.`,
      "s3_a_title": `A. Facturation`,
      "s3_b_body": `Sauf résiliation avant la date de renouvellement, votre abonnement sera automatiquement renouvelé.`,
      "s3_b_title": `B. Renouvellement automatique`,
      "s3_body": `Bénédictions Partagées propose des formules d'abonnement Premium optionnelles.`,
      "s3_c_body": `Vous pouvez résilier votre abonnement à tout moment via :`,
      "s3_c_items": `- Les paramètres de votre compte
- En nous contactant à : contact@benedictionspartagees.org`,
      "s3_c_note": `La résiliation prendra effet à la fin de la période de facturation en cours. Aucun remboursement partiel ne sera accordé, sauf si la loi l'exige.`,
      "s3_c_title": `C. Résiliation`,
      "s3_d_body": `Tous les paiements sont non remboursables, sauf :`,
      "s3_d_items": `- Si la loi applicable l'exige
- En cas d'erreur de facturation`,
      "s3_d_note": `Si vous pensez avoir été facturé à tort, contactez-nous dans les 7 jours suivant le débit.`,
      "s3_d_title": `D. Politique de remboursement`,
      "s3_title": `3. Abonnement Premium (facturation Stripe)`,
      "s4_body1": `Les utilisateurs peuvent publier des demandes de prière, des commentaires et des témoignages. En publiant du contenu, vous accordez à Bénédictions Partagées une licence non exclusive d'afficher ce contenu dans l'application.`,
      "s4_body2": `Vous acceptez de NE PAS publier :`,
      "s4_items": `- Du contenu abusif ou haineux
- Des informations fausses ou trompeuses
- Du contenu illégal
- Du spam ou du contenu promotionnel`,
      "s4_note": `Nous nous réservons le droit de supprimer tout contenu ou de suspendre les comptes qui enfreignent les normes de la communauté.`,
      "s4_title": `4. Contenu généré par les utilisateurs`,
      "s5_body1": `Toute la musique, l'image de marque, les logos et les éléments de conception de l'application sont la propriété de Bénédictions Partagées ou de ses partenaires sous licence.`,
      "s5_body2": `Vous ne pouvez copier, redistribuer, reproduire ou vendre aucun contenu sans autorisation écrite.`,
      "s5_title": `5. Propriété intellectuelle`,
      "s6_body": `Nous pouvons suspendre ou mettre fin à l'accès à l'application si :`,
      "s6_items": `- Vous enfreignez ces Conditions
- Vous utilisez la plateforme de manière abusive
- Vous adoptez un comportement nuisible`,
      "s6_note": `La résiliation peut entraîner la perte d'accès aux fonctionnalités Premium sans remboursement.`,
      "s6_title": `6. Résiliation`,
      "s7_body": `L'application est fournie « en l'état », sans garantie d'aucune sorte. Nous ne sommes pas responsables des :`,
      "s7_items": `- Interruptions de service
- Problèmes techniques
- Contenus publiés par les utilisateurs
- Dommages indirects ou accessoires`,
      "s7_note": `L'utilisation de l'application se fait à vos propres risques.`,
      "s7_title": `7. Limitation de responsabilité`,
      "s8_body": `Votre utilisation de l'application est également régie par notre Politique de confidentialité. Veuillez la lire attentivement.`,
      "s8_title": `8. Confidentialité`,
      "s9_body": `Nous pouvons mettre à jour ces Conditions périodiquement. La poursuite de l'utilisation de l'application après la publication des modifications constitue l'acceptation des Conditions révisées.`,
      "s9_title": `9. Modifications de ces Conditions`,
      "title": `Conditions d'utilisation`,
      "updated": `Dernière mise à jour : 27 février 2026`,
    },
    privacy: {
      "closing": `Des questions sur cette Politique de confidentialité ? Contactez-nous à {email}`,
      "intro": `Bénédictions Partagées (« BP », « nous », « notre » ou « nos ») respecte votre vie privée et s'engage à protéger vos informations personnelles. La présente Politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos données lorsque vous utilisez notre application et nos services.`,
      "org": `Bénédictions Partagées`,
      "removal_button": `Supprimer mon compte`,
      "removal_contact": `Vous pouvez également nous contacter à {email} si vous avez besoin d'aide.`,
      "removal_email_body": `Bonjour,

Je souhaite demander la suppression de mon compte et de toutes les données associées de Bénédictions Partagées.

Mon adresse e-mail de compte : [veuillez saisir l'adresse e-mail de votre compte ici]

Merci.`,
      "removal_email_subject": `Demande de suppression de données - Bénédictions Partagées`,
      "removal_p1": `Vous avez le droit de demander la suppression complète de votre compte et de toutes les données associées. Cela inclut vos informations de compte, vos versets enregistrés, vos demandes de prière, vos abonnements aux notifications push et tout identifiant lié au paiement.`,
      "removal_p2": `Une fois vos données supprimées, cette action ne peut pas être annulée. Votre abonnement premium (le cas échéant) sera également résilié.`,
      "removal_title": `Demander la suppression des données`,
      "s10_paragraphs": `- Nous pouvons mettre à jour cette Politique de confidentialité périodiquement. Les mises à jour seront publiées dans l'application et sur notre site web.
- La poursuite de l'utilisation de l'application après les mises à jour constitue l'acceptation de la politique révisée.`,
      "s10_title": `10. Modifications de cette politique`,
      "s1_title": `1. Informations que nous collectons`,
      "s1a_intro": `Lorsque vous créez un compte, nous collectons :`,
      "s1a_items": `- Adresse e-mail
- Nom d'utilisateur
- Mot de passe (chiffré de manière sécurisée par hachage bcrypt)`,
      "s1a_title": `A. Informations de compte`,
      "s1b_intro": `Si vous souscrivez à une formule premium :`,
      "s1b_items": `- ID client Stripe et ID d'abonnement (pour les paiements web)
- Jeton d'achat Google Play (pour les paiements Android)
- Nous ne stockons PAS les numéros de carte bancaire, les adresses de facturation ni autres données financières. Tous les paiements sont traités de manière sécurisée par Stripe ou Google Play.`,
      "s1b_title": `B. Informations d'abonnement et de paiement`,
      "s1c_intro": `Lorsque vous soumettez une demande de prière, nous collectons :`,
      "s1c_items": `- Votre nom (ou le pseudonyme choisi)
- Adresse e-mail
- Le message de demande de prière`,
      "s1c_note": `Les demandes de prière peuvent être visibles par d'autres utilisateurs sur le mur de prière, selon vos préférences d'affichage.`,
      "s1c_title": `C. Demandes de prière`,
      "s1d_intro": `Lorsque vous enregistrez des versets bibliques :`,
      "s1d_items": `- La référence du verset, le texte et la langue sont stockés dans votre compte`,
      "s1d_title": `D. Versets enregistrés`,
      "s1e_intro": `Si vous activez les notifications push :`,
      "s1e_items": `- Point d'accès de l'abonnement push du navigateur
- Votre langue préférée pour les notifications`,
      "s1e_title": `E. Abonnements aux notifications push`,
      "s1f_intro": `Nous collectons des données d'utilisation minimales :`,
      "s1f_items": `- Nombre de lectures de chansons (agrégés, pas par utilisateur)`,
      "s1f_note": `Nous ne collectons PAS de données de localisation, d'historique de navigation, de contacts ni d'identifiants d'appareil.`,
      "s1f_title": `F. Données d'utilisation`,
      "s2_intro": `Nous utilisons vos informations pour :`,
      "s2_items": `- Créer et gérer votre compte
- Donner accès à la musique, aux dévotions, aux versets quotidiens et aux fonctionnalités premium
- Traiter les abonnements premium via Stripe ou Google Play
- Afficher les demandes de prière sur le mur de prière
- Envoyer des notifications push de dévotion quotidienne dans votre langue préférée
- Envoyer des e-mails de réinitialisation de mot de passe sur demande
- Notifier les administrateurs des nouvelles demandes de prière par e-mail`,
      "s2_note": `Nous ne vendons, ne louons ni n'échangeons vos données personnelles à des tiers.`,
      "s2_title": `2. Comment nous utilisons vos informations`,
      "s3_intro": `Vos données sont stockées en toute sécurité grâce à :`,
      "s3_items": `- Base de données PostgreSQL hébergée sur l'infrastructure sécurisée de Replit
- Mots de passe chiffrés par hachage bcrypt (nous ne stockons jamais les mots de passe en clair)
- Cookies HTTP-only pour la gestion des sessions
- Chiffrement HTTPS pour toutes les données en transit`,
      "s3_note": `Nous mettons en œuvre des mesures de sécurité conformes aux standards du secteur. Toutefois, aucun système numérique n'est sécurisé à 100 %. Nous vous encourageons à utiliser un mot de passe fort et unique.`,
      "s3_title": `3. Stockage et sécurité des données`,
      "s4_intro": `Nous ne vendons ni ne louons vos informations personnelles. Nous partageons des données uniquement avec :`,
      "s4_items": `- Stripe — pour le traitement des abonnements payants web
- Google Play — pour le traitement des abonnements payants Android
- Resend — pour l'envoi d'e-mails transactionnels (notifications de demandes de prière, réinitialisations de mot de passe)
- Lorsque la loi ou une ordonnance judiciaire l'exige
- Pour protéger les droits et la sécurité de nos utilisateurs`,
      "s4_title": `4. Partage des données`,
      "s5_items": `- Est abusif, nuisible ou offensant
- Enfreint les normes de la communauté
- Contient du matériel illégal ou inapproprié`,
      "s5_paragraphs": `- Le contenu tel que les demandes de prière peut être visible par d'autres utilisateurs sur le mur de prière. Les utilisateurs sont responsables des informations qu'ils choisissent de partager publiquement.
- Nous nous réservons le droit de supprimer tout contenu qui :`,
      "s5_title": `5. Responsabilité du contenu généré par les utilisateurs`,
      "s6_intro": `Nous conservons les données personnelles :`,
      "s6_items": `- Tant que votre compte reste actif
- Selon les exigences de conformité légale ou financière
- Les jetons de réinitialisation de mot de passe sont automatiquement invalidés après 1 heure`,
      "s6_note": `Vous pouvez demander la suppression de votre compte et de toutes les données associées à tout moment (voir ci-dessous).`,
      "s6_title": `6. Conservation des données`,
      "s7_intro": `Vous avez le droit de :`,
      "s7_items": `- Accéder aux données que nous détenons sur vous
- Corriger les informations inexactes
- Demander la suppression complète de votre compte et de vos données
- Retirer votre consentement aux notifications push à tout moment
- Réinitialiser votre mot de passe en toute sécurité par e-mail`,
      "s7_note": `Pour exercer l'un de ces droits, contactez-nous à : contact@benedictionspartagees.org. Nous répondrons sous 30 jours.`,
      "s7_title": `7. Vos droits`,
      "s8_paragraphs": `- Cette application n'est pas destinée aux enfants de moins de 13 ans. Nous ne collectons pas sciemment de données personnelles d'enfants de moins de 13 ans. Si vous pensez qu'un enfant nous a fourni des informations personnelles, veuillez nous contacter immédiatement.`,
      "s8_title": `8. Confidentialité des enfants`,
      "s9_paragraphs": `- Si vous accédez à l'application depuis l'extérieur des États-Unis, vos informations peuvent être transférées et traitées aux États-Unis, où se trouvent nos serveurs. En utilisant l'application, vous consentez à ce transfert.`,
      "s9_title": `9. Utilisateurs internationaux`,
      "safety_collected": `- Adresse e-mail
- Nom d'utilisateur
- Demandes de prière
- Versets enregistrés
- Préférences de notifications push`,
      "safety_collected_title": `Données collectées :`,
      "safety_practices": `- Chiffrées en transit (HTTPS)
- Mots de passe hachés de manière sécurisée (bcrypt)
- Non vendues ni louées à des tiers
- Supprimables à la demande de l'utilisateur`,
      "safety_practices_title": `Pratiques de sécurité :`,
      "safety_shared": `- Avec Stripe (traitement des paiements)
- Avec Google Play (paiements Android)
- Avec Resend (e-mails transactionnels)`,
      "safety_shared_title": `Données partagées avec :`,
      "safety_title": `Alignement avec la section Sécurité des données de Google Play`,
      "title": `Politique de confidentialité`,
      "updated": `Dernière mise à jour : 6 mars 2026`,
    },
  },
  ht: {
    terms: {
      "intro1": `Byenveni sou Bénédictions Partagées (« BP », « nou » oswa « nou yo »). Lè w ap aksede oswa w ap itilize aplikasyon mobil nou an ak sèvis nou yo, ou dakò ak Kondisyon Itilizasyon sa yo.`,
      "intro2": `Si ou pa dakò, tanpri pa itilize aplikasyon an.`,
      "s10_body": `Pou kesyon konsènan Kondisyon sa yo, pwoblèm fakti, oswa enkyetid sou abònman an, kontakte :`,
      "s10_title": `10. Enfòmasyon Kontak`,
      "s1_body": `Bénédictions Partagées se yon platfòm dijital kretyen ki ofri :`,
      "s1_items": `- Difize mizik gospel
- Devosyonèl chak jou
- Fòm demann lapriyè
- Patisipasyon kominote a
- Sèvis abònman Premium opsyonèl`,
      "s1_note": `Kontni yo bay sèlman pou objektif espirityèl, enspirasyon ak amizman.`,
      "s1_title": `1. Objektif Aplikasyon an`,
      "s2_body": `Pou w jwenn aksè ak kèk fonksyon, ou ka bezwen kreye yon kont. Ou dakò pou :`,
      "s2_items": `- Bay enfòmasyon ki kòrèk
- Kenbe enfòmasyon koneksyon ou yo an sekrè
- Pran responsablite pou aktivite ki fèt sou kont ou a`,
      "s2_note1": `Nou rezève dwa pou nou sispann kont ki vyole Kondisyon sa yo.`,
      "s2_note2": `Ou dwe gen omwen 13 an pou itilize aplikasyon an.`,
      "s2_title": `2. Kont Itilizatè`,
      "s3_a_items": `- Peman yo trete an sekirite atravè Stripe.
- Lè w abònne, ou otorize fakti rekiran dapre fòmil ou chwazi a (chak mwa oswa chak ane).
- Frè abònman yo debite otomatikman nan kòmansman chak peryòd fakti.`,
      "s3_a_title": `A. Fakti`,
      "s3_b_body": `Si ou pa anile l anvan dat renouvèlman an, abònman ou a ap renouvle otomatikman.`,
      "s3_b_title": `B. Renouvèlman otomatik`,
      "s3_body": `Bénédictions Partagées ofri fòmil abònman Premium opsyonèl.`,
      "s3_c_body": `Ou ka anile abònman ou a nenpòt lè atravè :`,
      "s3_c_items": `- Paramèt kont ou a
- Lè w kontakte nou nan : contact@benedictionspartagees.org`,
      "s3_c_note": `Anilasyon an ap pran efè nan fen peryòd fakti aktyèl la. Pa p gen ranbousman pasyèl sof si lalwa egzije l.`,
      "s3_c_title": `C. Anilasyon`,
      "s3_d_body": `Tout peman yo pa ranbousab, eksepte :`,
      "s3_d_items": `- Si lalwa aplikab la egzije l
- Si te gen yon erè nan fakti a`,
      "s3_d_note": `Si ou kwè yo te fè w peye a tò, kontakte nou nan 7 jou apre peman an.`,
      "s3_d_title": `D. Politik ranbousman`,
      "s3_title": `3. Abònman Premium (Peman Stripe)`,
      "s4_body1": `Itilizatè yo ka pibliye demann lapriyè, kòmantè ak temwayaj. Lè w pibliye kontni, ou bay Bénédictions Partagées yon lisans ki pa eksklizif pou montre kontni sa a nan aplikasyon an.`,
      "s4_body2": `Ou dakò pou PA pibliye :`,
      "s4_items": `- Kontni abi oswa ki gen rayisman
- Enfòmasyon ki fo oswa ki twonpe
- Kontni ilegal
- Spam oswa kontni pwomosyonèl`,
      "s4_note": `Nou rezève dwa pou nou retire kontni oswa sispann kont ki vyole nòm kominote a.`,
      "s4_title": `4. Kontni Itilizatè yo Kreye`,
      "s5_body1": `Tout mizik, mak, logo ak eleman konsepsyon aplikasyon an se pwopriyete Bénédictions Partagées oswa patnè lisansye li yo.`,
      "s5_body2": `Ou pa ka kopye, redistribye, repwodui oswa vann okenn kontni san pèmisyon ekri.`,
      "s5_title": `5. Pwopriyete Entèlektyèl`,
      "s6_body": `Nou ka sispann oswa mete fen nan aksè ou nan aplikasyon an si :`,
      "s6_items": `- Ou vyole Kondisyon sa yo
- Ou mal itilize platfòm nan
- Ou adopte yon konpòtman ki fè mal`,
      "s6_note": `Sispansyon an ka lakòz pèt aksè ak fonksyon Premium yo san ranbousman.`,
      "s6_title": `6. Sispansyon`,
      "s7_body": `Yo bay aplikasyon an « jan li ye a », san okenn garanti. Nou pa responsab pou :`,
      "s7_items": `- Entèripsyon sèvis
- Pwoblèm teknik
- Kontni itilizatè yo pibliye
- Dòmaj endirèk oswa akseswa`,
      "s7_note": `W ap itilize aplikasyon an sou pwòp risk ou.`,
      "s7_title": `7. Limitasyon Responsablite`,
      "s8_body": `Itilizasyon ou nan aplikasyon an gouvène tou pa Politik Konfidansyalite nou an. Tanpri li l ak atansyon.`,
      "s8_title": `8. Vi Prive`,
      "s9_body": `Nou ka mete Kondisyon sa yo ajou detanzantan. Si w kontinye itilize aplikasyon an apre chanjman yo pibliye, sa vle di ou aksepte Kondisyon revize yo.`,
      "s9_title": `9. Chanjman nan Kondisyon sa yo`,
      "title": `Kondisyon Itilizasyon`,
      "updated": `Dènye mizajou : 27 fevriye 2026`,
    },
    privacy: {
      "closing": `Kesyon sou Politik Konfidansyalite sa a ? Kontakte nou nan {email}`,
      "intro": `Bénédictions Partagées (« BP », « nou » oswa « nou yo ») respekte vi prive ou epi li angaje pou pwoteje enfòmasyon pèsonèl ou. Politik Konfidansyalite sa a eksplike kijan nou kolekte, itilize, estoke ak pwoteje done ou yo lè w ap itilize aplikasyon nou an ak sèvis nou yo.`,
      "org": `Bénédictions Partagées`,
      "removal_button": `Efase Kont Mwen`,
      "removal_contact": `Ou ka kontakte nou tou nan {email} si ou bezwen èd.`,
      "removal_email_body": `Bonjou,

Mwen ta renmen mande efase kont mwen ak tout done ki asosye l nan Bénédictions Partagées.

Imèl kont mwen : [tanpri antre imèl kont ou isit la]

Mèsi.`,
      "removal_email_subject": `Demann Efase Done - Bénédictions Partagées`,
      "removal_p1": `Ou gen dwa mande efase konplètman kont ou ak tout done ki asosye l. Sa gen ladan enfòmasyon kont ou, vèsè ou anrejistre, demann lapriyè ou, abònman notifikasyon push ou, ak nenpòt idantifyan ki gen rapò ak peman.`,
      "removal_p2": `Yon fwa done ou yo efase, aksyon sa a pa ka anile. Abònman premium ou a (si ou gen youn) ap anile tou.`,
      "removal_title": `Mande Efase Done`,
      "s10_paragraphs": `- Nou ka mete Politik Konfidansyalite sa a ajou detanzantan. Mizajou yo ap pibliye nan aplikasyon an ak sou sit entènèt nou an.
- Si w kontinye itilize aplikasyon an apre mizajou yo, sa vle di ou aksepte politik revize a.`,
      "s10_title": `10. Chanjman nan Politik sa a`,
      "s1_title": `1. Enfòmasyon Nou Kolekte`,
      "s1a_intro": `Lè w kreye yon kont, nou kolekte :`,
      "s1a_items": `- Adrès imèl
- Non itilizatè
- Modpas (an sekirite ak hachaj bcrypt)`,
      "s1a_title": `A. Enfòmasyon sou Kont`,
      "s1b_intro": `Si w abònne nan yon fòmil premium :`,
      "s1b_items": `- ID kliyan Stripe ak ID abònman (pou peman sou entènèt)
- Jeton acha Google Play (pou peman Android)
- Nou PA estoke nimewo kat kredi, adrès fakti oswa lòt detay finansye. Tout pwosesis peman fèt an sekirite pa Stripe oswa Google Play.`,
      "s1b_title": `B. Enfòmasyon sou Abònman ak Peman`,
      "s1c_intro": `Lè w soumèt yon demann lapriyè, nou kolekte :`,
      "s1c_items": `- Non ou (oswa non afichaj ou chwazi)
- Adrès imèl
- Mesaj demann lapriyè a`,
      "s1c_note": `Demann lapriyè yo ka vizib pou lòt itilizatè sou miray lapriyè a, selon preferans afichaj ou.`,
      "s1c_title": `C. Demann Lapriyè`,
      "s1d_intro": `Lè w anrejistre vèsè Biblik :`,
      "s1d_items": `- Referans vèsè a, tèks la ak lang lan estoke nan kont ou`,
      "s1d_title": `D. Vèsè Ou Anrejistre`,
      "s1e_intro": `Si w aktive notifikasyon push :`,
      "s1e_items": `- Pwen final abònman push navigatè a
- Lang ou prefere pou notifikasyon yo`,
      "s1e_title": `E. Abònman Notifikasyon Push`,
      "s1f_intro": `Nou kolekte done itilizasyon minimòm :`,
      "s1f_items": `- Kantite fwa yo jwe chan (agregasyon, pa pa itilizatè)`,
      "s1f_note": `Nou PA kolekte done lokasyon, istwa navigasyon, kontak oswa idantifyan aparèy.`,
      "s1f_title": `F. Done Itilizasyon`,
      "s2_intro": `Nou itilize enfòmasyon ou pou :`,
      "s2_items": `- Kreye ak jere kont ou
- Ba ou aksè ak mizik, devosyonèl, vèsè chak jou ak fonksyon premium
- Trete abònman premium atravè Stripe oswa Google Play
- Afiche demann lapriyè sou miray lapriyè a
- Voye notifikasyon push devosyonèl chak jou nan lang ou prefere a
- Voye imèl reyinisyalizasyon modpas lè ou mande l
- Avèti administratè yo pa imèl sou nouvo demann lapriyè`,
      "s2_note": `Nou PA vann, lwe oswa echanje done pèsonèl ou ak twazyèm pati.`,
      "s2_title": `2. Kijan Nou Itilize Enfòmasyon Ou`,
      "s3_intro": `Done ou yo estoke an sekirite ak :`,
      "s3_items": `- Baz done PostgreSQL sou enfrastrikti an sekirite Replit
- Modpas kache ak hachaj bcrypt (nou pa janm estoke modpas an klè)
- Cookie HTTP-only pou jesyon sesyon
- Kriptaj HTTPS pou tout done an tranzit`,
      "s3_note": `Nou aplike mezi sekirite dapre estanda endistri a. Men, okenn sistèm dijital pa 100% an sekirite. Nou ankouraje w itilize yon modpas solid e inik.`,
      "s3_title": `3. Stokaj ak Sekirite Done`,
      "s4_intro": `Nou pa vann oswa lwe enfòmasyon pèsonèl ou. Nou pataje done sèlman ak :`,
      "s4_items": `- Stripe — pou trete abònman peman sou entènèt
- Google Play — pou trete abònman peman Android
- Resend — pou voye imèl tranzaksyonèl (notifikasyon demann lapriyè, reyinisyalizasyon modpas)
- Lè lalwa oswa yon òd tribinal egzije l
- Pou pwoteje dwa ak sekirite itilizatè nou yo`,
      "s4_title": `4. Pataj Done`,
      "s5_items": `- Ki abi, ki fè mal oswa ki ofansan
- Ki vyole nòm kominote a
- Ki gen materyèl ilegal oswa ki pa apwopriye`,
      "s5_paragraphs": `- Kontni tankou demann lapriyè ka vizib pou lòt itilizatè sou miray lapriyè a. Itilizatè yo responsab enfòmasyon yo chwazi pataje an piblik.
- Nou rezève dwa pou nou retire kontni ki :`,
      "s5_title": `5. Responsablite pou Kontni Itilizatè yo Kreye`,
      "s6_intro": `Nou kenbe done pèsonèl :`,
      "s6_items": `- Toutotan kont ou rete aktif
- Jan konfòmite legal oswa finansye egzije l
- Jeton reyinisyalizasyon modpas yo anile otomatikman apre 1 èdtan`,
      "s6_note": `Ou ka mande efase kont ou ak tout done ki asosye l nenpòt lè (gade anba a).`,
      "s6_title": `6. Konsèvasyon Done`,
      "s7_intro": `Ou gen dwa :`,
      "s7_items": `- Jwenn aksè ak done nou genyen sou ou
- Korije enfòmasyon ki pa kòrèk
- Mande efase konplètman kont ou ak done ou
- Retire konsantman ou pou notifikasyon push nenpòt lè
- Reyinisyalize modpas ou an sekirite pa imèl`,
      "s7_note": `Pou egzèse nenpòt dwa sa yo, kontakte nou nan : contact@benedictionspartagees.org. N ap reponn nan 30 jou.`,
      "s7_title": `7. Dwa Ou`,
      "s8_paragraphs": `- Aplikasyon sa a pa fèt pou timoun ki poko gen 13 an. Nou pa kolekte ak konsyans done pèsonèl timoun ki poko gen 13 an. Si ou kwè yon timoun te bay nou enfòmasyon pèsonèl, tanpri kontakte nou imedyatman.`,
      "s8_title": `8. Vi Prive Timoun`,
      "s9_paragraphs": `- Si w jwenn aksè ak aplikasyon an andeyò Etazini, enfòmasyon ou yo ka transfere ak trete Ozetazini, kote sèvè nou yo ye. Lè w ap itilize aplikasyon an, ou konsanti transfè sa a.`,
      "s9_title": `9. Itilizatè Entènasyonal`,
      "safety_collected": `- Adrès imèl
- Non itilizatè
- Demann lapriyè
- Vèsè anrejistre
- Preferans notifikasyon push`,
      "safety_collected_title": `Done Kolekte :`,
      "safety_practices": `- Kripto an tranzit (HTTPS)
- Modpas kache an sekirite (bcrypt)
- Pa vann oswa lwe bay twazyèm pati
- Ka efase sou demann itilizatè`,
      "safety_practices_title": `Pratik Sekirite :`,
      "safety_shared": `- Ak Stripe (pwosesis peman)
- Ak Google Play (peman Android)
- Ak Resend (imèl tranzaksyonèl)`,
      "safety_shared_title": `Done Pataje Ak :`,
      "safety_title": `Alyenman ak Seksyon Sekirite Done Google Play`,
      "title": `Politik Konfidansyalite`,
      "updated": `Dènye mizajou : 6 mas 2026`,
    },
  },
};

export function getLegalText(page: "terms" | "privacy", key: string, language: Language): string {
  return legalTranslations[language]?.[page]?.[key] ?? key;
}