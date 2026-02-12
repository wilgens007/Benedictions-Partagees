import type { Encouragement, Language } from "@shared/schema";
import { encouragementsEN } from "./encouragements-en";
import { encouragementsFR } from "./encouragements-fr";
import { encouragementsHT } from "./encouragements-ht";

export const encouragements: Record<Language, Encouragement[]> = {
  en: encouragementsEN,
  fr: encouragementsFR,
  ht: encouragementsHT,
};
