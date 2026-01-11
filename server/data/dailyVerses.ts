import type { DailyVerse, Language } from "@shared/schema";

export const dailyVerses: Record<Language, DailyVerse[]> = {
  en: [
    {
      id: "1",
      verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
      reference: "Jeremiah 29:11",
      devotional: "God has a beautiful plan for your life. Even when circumstances seem uncertain, trust that He is working all things together for your good. His plans are not to harm you but to give you hope. Today, rest in the assurance that your future is secure in His loving hands.",
      prayer: "Heavenly Father, thank You for the plans You have for me. Help me to trust You even when I cannot see the path ahead. Give me hope and peace as I walk in faith, knowing that You are guiding my steps. In Jesus' name, Amen.",
      date: "",
    },
    {
      id: "2",
      verse: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.",
      reference: "Psalm 23:1-3",
      devotional: "Our Good Shepherd provides everything we need. He leads us to places of rest and restoration. When life feels overwhelming, remember that He is always guiding you toward peace. Let Him restore your weary soul today.",
      prayer: "Lord, You are my Shepherd. I trust You to provide for all my needs. Lead me to places of rest and peace. Restore my soul and renew my strength. Thank You for Your constant care. Amen.",
      date: "",
    },
  ],
  fr: [
    {
      id: "1",
      verse: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.",
      reference: "Jérémie 29:11",
      devotional: "Dieu a un plan magnifique pour votre vie. Même lorsque les circonstances semblent incertaines, ayez confiance qu'Il fait concourir toutes choses à votre bien. Ses plans ne sont pas pour vous faire du mal mais pour vous donner de l'espoir.",
      prayer: "Père céleste, merci pour les plans que Tu as pour moi. Aide-moi à Te faire confiance même quand je ne vois pas le chemin devant moi. Donne-moi espoir et paix alors que je marche dans la foi. Au nom de Jésus, Amen.",
      date: "",
    },
  ],
  ht: [
    {
      id: "1",
      verse: "Paske mwen konnen plan mwen gen pou ou yo, di Senyè a, plan pou fè ou byen, pa pou fè ou mal, plan pou ba ou espwa ak yon lavni.",
      reference: "Jeremi 29:11",
      devotional: "Bondye gen yon bèl plan pou lavi ou. Menm lè sikonstans yo sanble ensèten, fè konfyans ke Li ap travay tout bagay ansanm pou byen ou. Plan Li yo pa pou fè ou mal men pou ba ou espwa.",
      prayer: "Papa nan syèl la, mèsi pou plan Ou gen pou mwen. Ede mwen fè Ou konfyans menm lè mwen pa kapab wè chemen an devan mwen. Ban mwen espwa ak lapè pandan mwen ap mache nan lafwa. Nan non Jezi, Amèn.",
      date: "",
    },
  ],
};
