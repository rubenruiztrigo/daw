
import { Tender } from '../types';
import { normalizeString } from '../utils/stringUtils';

// Helper to check keywords in real data (Accent and Case Insensitive)
const findKeywords = (text: string, keywordsList: string[]): string[] => {
  const normalizedText = normalizeString(text);
  
  // Filter unique matches
  const matches = new Set<string>();
  keywordsList.forEach(k => {
    // Normalize the keyword too (e.g. "Tecnología" -> "tecnologia")
    const normalizedKeyword = normalizeString(k);
    if (normalizedText.includes(normalizedKeyword)) {
        matches.add(k); // Return the original formatted keyword
    }
  });
  return Array.from(matches);
};

// Helper for currency formatting
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Advanced Amount Extraction
const extractAmount = (text: string): string | undefined => {
    const labelRegex = /(?:Importe|Valor estimado|Presupuesto base|Importe total)(?:.*?):\s*([\d\.,]+)/i;
    const labelMatch = text.match(labelRegex);
    
    if (labelMatch) {
        return normalizeAndFormatAmount(labelMatch[1]);
    }

    const currencyRegex = /([\d\.,]+)\s?(?:€|EUR|euros)/i;
    const currencyMatch = text.match(currencyRegex);

    if (currencyMatch) {
        return normalizeAndFormatAmount(currencyMatch[1]);
    }

    return undefined;
};

const normalizeAndFormatAmount = (raw: string): string | undefined => {
    let clean = raw.trim();
    
    if (clean.includes('.') && !clean.includes(',')) {
        if (clean.indexOf('.') === clean.length - 3) {
             const num = parseFloat(clean);
             if (!isNaN(num)) return formatCurrency(num);
        }
    }

    if (clean.includes('.') && clean.includes(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        clean = clean.replace(',', '.');
    }

    const num = parseFloat(clean);
    if (!isNaN(num)) {
        return formatCurrency(num);
    }
    return undefined;
};

const extractOrganism = (text: string): string | undefined => {
    const regex = /Órgano de Contratación:\s*(.*?)(?:;|,|\. |$)/i;
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
};

const cleanSummary = (text: string): string => {
    if (text.trim().toLowerCase().startsWith("id licitación") || text.trim().toLowerCase().startsWith("expediente")) {
        let clean = text.replace(/<[^>]*>?/gm, '');
        return clean;
    }
    return text.replace(/<[^>]*>?/gm, '');
};

const FEED_CONFIG = [
    {
        url: 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom',
        sourceType: 'Perfiles Contratante'
    },
    {
        url: 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom',
        sourceType: 'Plataformas Agregadas'
    },
    {
        url: 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1143/contratosMenoresPerfilesContratantes.atom',
        sourceType: 'Contratos Menores'
    }
];

const fetchFeedContent = async (targetUrl: string): Promise<string | null> => {
    try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) return await response.text();
    } catch (e) {
        console.warn(`Strategy 1 failed for ${targetUrl}`, e);
    }

    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) return await response.text();
    } catch (e) {
        console.warn(`Strategy 2 failed for ${targetUrl}`, e);
    }

    try {
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) return await response.text();
    } catch (e) {
        console.warn(`Strategy 3 failed for ${targetUrl}`, e);
    }

    return null;
};

export const fetchTenders = async (keywords: string[]): Promise<Tender[]> => {
  const allTenders: Tender[] = [];

  const promises = FEED_CONFIG.map(async (feed) => {
    try {
        const xmlContent = await fetchFeedContent(feed.url);
        if (xmlContent && xmlContent.trim().startsWith("<")) {
            return parseAtomFeed(xmlContent, feed.sourceType, keywords);
        }
    } catch (error) {
        console.error(`Error processing feed ${feed.sourceType}:`, error);
    }
    return [];
  });

  try {
    const results = await Promise.all(promises);
    results.forEach(feedTenders => allTenders.push(...feedTenders));
  } catch (error) {
    console.error("Global fetch error:", error);
  }

  return allTenders.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
};

export const parseAtomFeed = (xmlString: string, sourceType: string, keywordsList: string[]): Tender[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const entries = xmlDoc.getElementsByTagName("entry");
  const results: Tender[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    const title = entry.getElementsByTagName("title")[0]?.textContent || "Sin título";
    const summaryNode = entry.getElementsByTagName("summary")[0];
    const contentNode = entry.getElementsByTagName("content")[0];
    const rawDescription = contentNode?.textContent || summaryNode?.textContent || "";
    
    const amount = extractAmount(rawDescription);
    const organism = extractOrganism(rawDescription);
    const summary = cleanSummary(rawDescription);

    const linkNode = entry.getElementsByTagName("link")[0];
    const link = linkNode ? (linkNode.getAttribute("href") || "") : "";

    const updated = entry.getElementsByTagName("updated")[0]?.textContent || new Date().toISOString();
    const id = entry.getElementsByTagName("id")[0]?.textContent || `gen-${Math.random()}`;

    const fullText = `${title} ${summary} ${organism || ''}`;
    const keywords = findKeywords(fullText, keywordsList);

    let contractType = "Otros";
    if (fullText.toLowerCase().includes("servicios")) contractType = "Servicios";
    else if (fullText.toLowerCase().includes("suministros")) contractType = "Suministros";
    else if (fullText.toLowerCase().includes("obras")) contractType = "Obras";

    results.push({
      id,
      title,
      summary: summary.length > 300 ? summary.substring(0, 300) + "..." : summary,
      link,
      updated,
      keywordsFound: keywords,
      isRead: false,
      sourceType,
      contractType,
      amount,
      organism
    });
  }
  return results;
};
