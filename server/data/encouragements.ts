import type { Encouragement, Language } from "@shared/schema";

export const encouragements: Record<Language, Encouragement[]> = {
  en: [
    {
      id: "1",
      text: "God's love for you is endless and unconditional. No matter what you're facing today, know that you are never alone. The same God who parted the Red Sea and raised Jesus from the dead is walking beside you right now.",
      author: "Bénédictions Partagées",
    },
    {
      id: "2",
      text: "Take heart, beloved. Your prayers are heard, your tears are seen, and your faith moves mountains. Today is a new day filled with God's mercies that are new every morning.",
      author: "Bénédictions Partagées",
    },
  ],
  fr: [
    {
      id: "1",
      text: "L'amour de Dieu pour vous est infini et inconditionnel. Peu importe ce que vous affrontez aujourd'hui, sachez que vous n'êtes jamais seul. Le même Dieu qui a ouvert la mer Rouge marche à vos côtés maintenant.",
      author: "Bénédictions Partagées",
    },
  ],
  ht: [
    {
      id: "1",
      text: "Lanmou Bondye pou ou san limit e san kondisyon. Kèlkeswa sa ou ap fè fas jodi a, konnen ke ou pa janm pou kont ou. Menm Bondye ki te ouvri Lanmè Wouj la ap mache bò kote ou kounye a.",
      author: "Bénédictions Partagées",
    },
  ],
};
