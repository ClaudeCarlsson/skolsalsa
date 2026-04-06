export type Lang = "sv" | "en";

const translations = {
  // Layout & Navigation
  "nav.dashboard": { sv: "Översikt", en: "Dashboard" },
  "nav.municipalities": { sv: "Kommuner", en: "Municipalities" },
  "nav.search": { sv: "Sök", en: "Search" },
  "nav.compare": { sv: "Jämför", en: "Compare" },
  "nav.trends": { sv: "Trender", en: "Trends" },
  "nav.about": { sv: "Om", en: "About" },
  "footer.dataFrom": { sv: "Data från", en: "Data from" },
  "footer.notAffiliated": { sv: "Ej ansluten till Skolverket.", en: "Not affiliated with Skolverket." },
  "meta.title": { sv: "SkolSalsa SALSA-utforskaren", en: "SkolSalsa SALSA Explorer" },
  "meta.description": {
    sv: "Utforska svenska skolors resultatdata från Skolverkets SALSA-modell",
    en: "Explore Swedish school performance data from Skolverket's SALSA model",
  },

  // Common
  "common.schools": { sv: "Skolor", en: "Schools" },
  "common.school": { sv: "Skola", en: "School" },
  "common.municipality": { sv: "Kommun", en: "Municipality" },
  "common.municipalities": { sv: "Kommuner", en: "Municipalities" },
  "common.year": { sv: "År", en: "Year" },
  "common.years": { sv: "År", en: "Years" },
  "common.type": { sv: "Typ", en: "Type" },
  "common.merit": { sv: "Meritvärde", en: "Merit" },
  "common.residual": { sv: "Residual", en: "Residual" },
  "common.predicted": { sv: "Modellberäknat", en: "Predicted" },
  "common.eligible": { sv: "Behörighet %", en: "Eligible %" },
  "common.kommunal": { sv: "Kommunal", en: "Municipal" },
  "common.enskild": { sv: "Enskild", en: "Independent" },
  "common.dataPoints": { sv: "Datapunkter", en: "Data Points" },
  "common.yearsCovered": { sv: "Antal år", en: "Years Covered" },
  "common.avgMerit": { sv: "Snitt meritvärde", en: "Avg Merit" },
  "common.avgResidual": { sv: "Snitt residual", en: "Avg Residual" },
  "common.avgEligible": { sv: "Snitt behörighet %", en: "Avg Eligible %" },
  "common.latestYear": { sv: "Senaste år", en: "Latest Year" },
  "common.parentsEd": { sv: "Föräldrars utb.", en: "Parents Ed." },
  "common.newlyArrived": { sv: "Nyinvandrade %", en: "New Arr. %" },
  "common.foreignBg": { sv: "Utl. bakgrund %", en: "Foreign %" },
  "common.boys": { sv: "Pojkar %", en: "Boys %" },
  "common.predElig": { sv: "Ber. behörighet", en: "Pred. Elig." },
  "common.resElig": { sv: "Res. behörighet", en: "Res. Elig." },
  "common.predMerit": { sv: "Ber. meritvärde", en: "Pred. Merit" },
  "common.resMerit": { sv: "Res. meritvärde", en: "Res. Merit" },

  // Error states
  "error.title": { sv: "Något gick fel", en: "Something went wrong" },
  "error.unexpected": { sv: "Ett oväntat fel inträffade.", en: "An unexpected error occurred." },
  "error.tryAgain": { sv: "Försök igen", en: "Try again" },
  "error.dbMissing": { sv: "Databasen hittades inte eller är tom.", en: "Database not found or empty." },
  "error.runScraper": { sv: "Kör skrapern först:", en: "Run the scraper first:" },
  "error.couldNotLoad": { sv: "Kunde inte ladda data.", en: "Could not load data." },
  "error.notFound": { sv: "Hittades inte", en: "Not found" },
  "error.invalidCode": { sv: "Ogiltig kod.", en: "Invalid code." },

  // Dashboard
  "dashboard.title": { sv: "SALSA-utforskaren", en: "SALSA Explorer" },
  "dashboard.subtitle": { sv: "Analys av svenska skolors resultat", en: "Swedish school performance analysis" },
  "dashboard.keyInsights": { sv: "Nyckelinsikter", en: "Key Insights" },
  "dashboard.snapshot": { sv: "Ögonblicksbild av {count} skolor senaste året", en: "Snapshot of {count} schools in the latest year" },
  "dashboard.avgMerit": { sv: "Snitt meritvärde", en: "Avg merit" },
  "dashboard.meritRange": { sv: "Meritvärdesspann", en: "Merit range" },
  "dashboard.abovePrediction": { sv: "Över förväntan", en: "Above prediction" },
  "dashboard.belowPrediction": { sv: "Under förväntan", en: "Below prediction" },
  "dashboard.schoolsWord": { sv: "skolor", en: "schools" },
  "dashboard.nationalTrends": { sv: "Nationella trender", en: "National Trends" },
  "dashboard.nationalTrendsDesc": {
    sv: "Genomsnittligt meritvärde och gymnasiebehörighet för alla skolor över tid",
    en: "Average merit value and gymnasiet eligibility across all schools over time",
  },
  "dashboard.topOutperformers": { sv: "Topp 10 – Bäst över förväntan", en: "Top 10 Outperformers" },
  "dashboard.topOutperformersDesc": { sv: "Mest över sitt modellberäknade meritvärde", en: "Most above their predicted merit value" },
  "dashboard.bottomUnderperformers": { sv: "Topp 10 – Sämst under förväntan", en: "Bottom 10 Underperformers" },
  "dashboard.bottomUnderperformersDesc": { sv: "Mest under sitt modellberäknade meritvärde", en: "Most below their predicted merit value" },
  "dashboard.muniRanking": { sv: "Kommunrankning", en: "Municipality Ranking" },
  "dashboard.muniRankingDesc": { sv: "Genomsnittligt meritvärde per kommun (minst 2 skolor)", en: "Average merit value by municipality (min 2 schools)" },
  "dashboard.browseByMuni": { sv: "Bläddra per kommun", en: "Browse by Municipality" },
  "dashboard.browseByMuniDesc": { sv: "Utforska skolor i {count} kommuner", en: "Explore schools across {count} municipalities" },
  "dashboard.searchSchools": { sv: "Sök skolor", en: "Search Schools" },
  "dashboard.searchSchoolsDesc": { sv: "Hitta skolor via namn eller plats", en: "Find any school by name or location" },
  "dashboard.compareSchools": { sv: "Jämför skolor", en: "Compare Schools" },
  "dashboard.compareSchoolsDesc": { sv: "Jämför upp till 5 skolor sida vid sida", en: "Side-by-side comparison of up to 5 schools" },

  // Municipality pages
  "muni.title": { sv: "Kommuner", en: "Municipalities" },
  "muni.couldNotLoad": { sv: "Kunde inte ladda kommuner. Databasen saknas kanske.", en: "Could not load municipalities. Database may be missing." },
  "muni.noMunicipalities": { sv: "Inga kommuner hittades. Kör skrapern först.", en: "No municipalities found. Run the scraper first." },
  "muni.schoolsWithData": { sv: "skolor med SALSA-data", en: "schools with SALSA data" },
  "muni.allMunicipalities": { sv: "Alla kommuner", en: "All municipalities" },
  "muni.notFound": { sv: "Kommunen hittades inte", en: "Municipality not found" },
  "muni.noSchools": { sv: "Inga skolor hittades för denna kommun.", en: "No schools found for this municipality code." },
  "muni.trends": { sv: "Kommuntrender", en: "Municipality Trends" },
  "muni.skolor": { sv: "skolor", en: "schools" },

  // School pages
  "school.notFound": { sv: "Skolan hittades inte", en: "School not found" },
  "school.noData": { sv: "Ingen data tillgänglig för denna skola.", en: "No data available for this school." },
  "school.yearsOfData": { sv: "års data", en: "years of data" },
  "school.latestMerit": { sv: "Senaste meritvärde", en: "Latest Merit" },
  "school.meritTrend": { sv: "Meritvärdesutveckling", en: "Merit Value Trend" },
  "school.meritTrendDesc": { sv: "Faktiskt vs modellberäknat meritvärde över tid", en: "Actual vs model-predicted merit value over time" },
  "school.residualOverTime": { sv: "Residual över tid", en: "Residual Over Time" },
  "school.residualOverTimeDesc": { sv: "Positivt = bättre än förväntat, Negativt = sämre", en: "Positive = outperforming prediction, Negative = underperforming" },
  "school.eligibility": { sv: "Gymnasiebehörighet", en: "Gymnasiet Eligibility" },
  "school.eligibilityDesc": { sv: "Andel elever behöriga till gymnasiet", en: "Share of students eligible for upper secondary school" },
  "school.demographics": { sv: "Elevsammansättning", en: "Student Demographics" },
  "school.demographicsDesc": { sv: "Bakgrundsfaktorer som används i SALSA-modellen", en: "Background factors used in the SALSA model" },
  "school.allData": { sv: "All data", en: "All Data" },

  // Search
  "search.title": { sv: "Sök skolor", en: "Search Schools" },
  "search.placeholder": { sv: "Skriv ett skolnamn eller en kommun...", en: "Start typing a school name or municipality..." },
  "search.ariaLabel": { sv: "Sök skolor", en: "Search schools" },
  "search.searching": { sv: "Söker...", en: "Searching..." },
  "search.results": { sv: "resultat för", en: "results for" },
  "search.result": { sv: "resultat för", en: "result for" },

  // Compare
  "compare.title": { sv: "Jämför skolor", en: "Compare Schools" },
  "compare.subtitle": { sv: "Sök och välj upp till 5 skolor att jämföra sida vid sida", en: "Search and select up to 5 schools to compare side by side" },
  "compare.maxSelected": { sv: "Maximalt 5 skolor valda", en: "Maximum 5 schools selected" },
  "compare.placeholder": { sv: "Skriv ett skolnamn för att lägga till...", en: "Type a school name to add..." },
  "compare.ariaLabel": { sv: "Sök skolor att jämföra", en: "Search schools to compare" },
  "compare.add": { sv: "+ Lägg till", en: "+ Add" },
  "compare.remove": { sv: "Ta bort", en: "Remove" },
  "compare.loading": { sv: "Laddar jämförelsedata...", en: "Loading comparison data..." },
  "compare.meritOverTime": { sv: "Meritvärde över tid", en: "Merit Value Over Time" },
  "compare.comparing": { sv: "Jämför {count} skolor", en: "Comparing {count} schools" },
  "compare.detailedData": { sv: "Detaljerad data", en: "Detailed Data" },
  "compare.startComparing": { sv: "Sök skolor ovan för att börja jämföra.", en: "Search for schools by name above to start comparing." },

  // Trends
  "trends.title": { sv: "Nationella trender", en: "National Trends" },
  "trends.couldNotLoad": { sv: "Kunde inte ladda trenddata.", en: "Could not load trend data." },
  "trends.noData": { sv: "Ingen trenddata ännu. Kör skrapern först.", en: "No trend data yet. Run the scraper first." },
  "trends.avgMerit": { sv: "Genomsnittligt meritvärde över tid", en: "Average Merit Value Over Time" },
  "trends.avgMeritDesc": { sv: "Nationellt snitt för alla SALSA-skolor", en: "National average across all SALSA schools" },
  "trends.schoolCount": { sv: "Antal skolor över tid", en: "School Count Over Time" },
  "trends.schoolCountDesc": { sv: "Antal skolor som ingår i SALSA per år", en: "Number of schools included in SALSA each year" },
  "trends.yearlyData": { sv: "Årsdata", en: "Yearly Data" },

  // Charts
  "chart.noMeritData": { sv: "Inga meritvärdesdata tillgängliga", en: "No merit data available" },
  "chart.noResidualData": { sv: "Inga residualdata tillgängliga", en: "No residual data available" },
  "chart.noTrendData": { sv: "Inga trenddata tillgängliga", en: "No trend data available" },
  "chart.selectSchools": { sv: "Välj skolor att jämföra", en: "Select schools to compare" },
  "chart.actualMerit": { sv: "Faktiskt meritvärde", en: "Actual merit" },
  "chart.predictedModel": { sv: "Modellberäknat", en: "Predicted (model)" },
  "chart.predicted": { sv: "Modellberäknat", en: "Predicted" },
  "chart.residual": { sv: "Residual", en: "Residual" },
  "chart.avgMeritValue": { sv: "Snitt meritvärde", en: "Avg merit value" },
  "chart.avgEligible": { sv: "Snitt behörighet (%)", en: "Avg eligible (%)" },
  "chart.schools": { sv: "Skolor", en: "Schools" },
  "chart.foreignBg": { sv: "Utl. bakgrund %", en: "Foreign bg %" },
  "chart.boys": { sv: "Pojkar %", en: "Boys %" },
  "chart.newlyArrived": { sv: "Nyinvandrade %", en: "Newly arrived %" },
  "chart.actualEligible": { sv: "Faktisk behörighet %", en: "Actual eligible %" },
  "chart.predictedPct": { sv: "Modellberäknat %", en: "Predicted %" },
  "chart.meritAxis": { sv: "Meritvärde", en: "Merit" },
  "chart.eligibleAxis": { sv: "Behörighet %", en: "Eligible %" },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  return translations[key]?.[lang] ?? key;
}

export function tf(key: TranslationKey, lang: Lang, vars: Record<string, string | number>): string {
  let result = t(key, lang);
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}

export function getLangFromCookie(cookieValue: string | undefined): Lang {
  if (cookieValue === "en") return "en";
  return "sv"; // Default Swedish
}
