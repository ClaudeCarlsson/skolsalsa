import { cookies } from "next/headers";
import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDashboardStats, getYearDistribution } from "@/lib/db";
import { getLangFromCookie, t, type Lang } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);
  const title = t("meta.about.title", lang);
  const description = t("meta.about.description", lang);
  return {
    title,
    description,
    openGraph: { title, description, url: "https://skolsalsa.se/about", type: "website", siteName: "SkolSalsa" },
  };
}

function c(sv: string, en: string, lang: Lang) {
  return lang === "sv" ? sv : en;
}

export default async function AboutPage() {
  const cookieStore = await cookies();
  const lang = getLangFromCookie(cookieStore.get("lang")?.value);

  let stats: { total_schools: number; total_municipalities: number; total_records: number; min_year: number; max_year: number } | undefined;
  let dist: { positive_residual_count: number; negative_residual_count: number } | undefined;
  try {
    stats = getDashboardStats();
    const d = getYearDistribution(stats.max_year);
    if (d) dist = d;
  } catch {
    // DB not available — render static content only
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("about.title", lang)}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t("about.subtitle", lang)}
        </p>
      </div>

      {/* What is this */}
      <Card>
        <CardHeader>
          <CardTitle>
            {c(
              "Vad är SkolSalsa SALSA-utforskaren?",
              "What is the SkolSalsa SALSA Explorer?",
              lang,
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            {c(
              "Denna utforskare ger fri, öppen tillgång till skolresultatdata från ",
              "This explorer provides free, open access to school performance data from ",
              lang,
            )}
            <strong>SALSA</strong>
            {c(
              " (Skolverkets Arbetsverktyg för Lokala SambandsAnalyser) — en statistisk modell som underhålls av ",
              " (Skolverket's Tool for Local Correlation Analysis) — a statistical model maintained by ",
              lang,
            )}
            <a href="https://www.skolverket.se" className="text-primary underline" target="_blank" rel="noopener noreferrer">
              Skolverket
            </a>
            .
          </p>
          <p>
            {c("Datan omfattar ", "The data covers ", lang)}
            <strong>
              {stats
                ? c(
                    `${stats.total_schools.toLocaleString("sv-SE")} skolor i ${stats.total_municipalities} kommuner`,
                    `${stats.total_schools.toLocaleString("en")} schools across ${stats.total_municipalities} municipalities`,
                    lang,
                  )
                : c("alla svenska skolor", "all Swedish schools", lang)}
            </strong>
            {c(", från ", ", from ", lang)}
            <strong>
              {stats
                ? `${stats.min_year} ${c("till", "to", lang)} ${stats.max_year} (${stats.max_year - stats.min_year + 1} ${c("år", "years", lang)})`
                : c("1998 till idag", "1998 to present", lang)}
            </strong>
            {c(", med totalt ", ", with a total of ", lang)}
            <strong>
              {stats
                ? c(
                    `${stats.total_records.toLocaleString("sv-SE")} datapunkter`,
                    `${stats.total_records.toLocaleString("en")} data points`,
                    lang,
                  )
                : c("tiotusentals datapunkter", "tens of thousands of data points", lang)}
            </strong>
            .{" "}
            {c(
              "Både kommunala och enskilda (fristående) skolor ingår.",
              "Both municipal and independent (private) schools are included.",
              lang,
            )}
          </p>
        </CardContent>
      </Card>

      {/* What is SALSA */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Vad är SALSA?", "What is SALSA?", lang)}</CardTitle>
          <CardDescription>
            {c(
              "Skolverkets Arbetsverktyg för Lokala SambandsAnalyser",
              "Skolverket's Tool for Local Correlation Analysis",
              lang,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            {c(
              "SALSA är en regressionsbaserad statistisk modell som jämför varje skolas faktiska resultat med vad som förväntas givet skolans elevsammansättning. Syftet är att möjliggöra rättvisare jämförelser mellan skolor genom att ta hänsyn till skillnader i elevernas bakgrund.",
              "SALSA is a regression-based statistical model that compares each school's actual results with what is expected given its student composition. The purpose is to enable fairer comparisons between schools by accounting for differences in student backgrounds.",
              lang,
            )}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <p className="font-medium text-blue-800 mb-2">
              {c("Tänk på det så här", "Think of it this way", lang)}
            </p>
            <p className="text-blue-900 text-sm">
              {c(
                "Föreställ dig två skolor med identiska meritvärden på 220 poäng. Skola A har föräldrar med hög utbildning och få nyinvandrade elever. Skola B har föräldrar med låg utbildning och många nyinvandrade elever. Utan SALSA ser de likvärdiga ut. Men SALSA visar att Skola A presterade under det förväntade (negativ residual) medan Skola B presterade långt över det förväntade (positiv residual) — givet sina förutsättningar. SALSA synliggör alltså det som inte syns i råsiffrorna.",
                "Imagine two schools with identical merit values of 220 points. School A has parents with high education and few newly arrived students. School B has parents with low education and many newly arrived students. Without SALSA, they look equivalent. But SALSA shows that School A performed below expectation (negative residual) while School B performed far above expectation (positive residual) — given their conditions. SALSA makes visible what raw numbers hide.",
                lang,
              )}
            </p>
          </div>
          <p>
            {c(
              "Den nuvarande modellen (sedan 2015) använder dessa ",
              "The current model (since 2015) uses these ",
              lang,
            )}
            <strong>{c("bakgrundsfaktorer", "background factors", lang)}</strong>:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>{c("Föräldrarnas utbildningsnivå", "Parents' education level", lang)}</strong>{" "}
              &mdash;{" "}
              {c(
                "den enskilt starkaste prediktorn. Genomsnittlig utbildningsnivå på en skala 1–3 där 3 = högskoleutbildning.",
                "the single strongest predictor. Average education level on a scale 1–3 where 3 = university education.",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Andel nyinvandrade elever", "Share of newly arrived students", lang)}</strong>{" "}
              &mdash;{" "}
              {c(
                "elever folkbokförda i Sverige de senaste 4 åren, plus elever med okänd bakgrund (sedan 2015).",
                "students registered in Sweden for the last 4 years, plus students with unknown background (since 2015).",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Andel pojkar", "Share of boys", lang)}</strong>{" "}
              &mdash; {c("könsfördelningen bland eleverna.", "the gender distribution among students.", lang)}
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            {c(
              'Modellen har utvecklats över tid. Före 2013 användes "andel födda utomlands" och "andel med utländsk bakgrund" istället för "nyinvandrade". 2016 exkluderades elever utan personnummer helt. Den nuvarande modellen (modell 3) har ett justerat R² på ~53% för meritvärden, vilket innebär att 53% av variansen mellan skolor förklaras av enbart dessa bakgrundsfaktorer.',
              'The model has evolved over time. Before 2013, "share born abroad" and "share with foreign background" were used instead of "newly arrived". In 2016, students without personal identity numbers were entirely excluded. The current model (model 3) has an adjusted R² of ~53% for merit values, meaning 53% of the variance between schools is explained by these background factors alone.',
              lang,
            )}
          </p>
        </CardContent>
      </Card>

      {/* How the model works — step by step */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Hur modellen fungerar — steg för steg", "How the model works — step by step", lang)}</CardTitle>
          <CardDescription>
            {c(
              "En förenklad genomgång av beräkningen",
              "A simplified walkthrough of the calculation",
              lang,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">1</div>
              <div>
                <h4 className="font-semibold mb-1">{c("Samla in bakgrundsdata", "Collect background data", lang)}</h4>
                <p className="text-sm text-muted-foreground">
                  {c(
                    "För varje skola samlas tre bakgrundsfaktorer in: föräldrarnas genomsnittliga utbildningsnivå (skala 1–3), andelen nyinvandrade elever och andelen pojkar. Dessa uppgifter kommer från registerdata och är alltså inte något skolan själv rapporterar.",
                    "For each school, three background factors are collected: parents' average education level (scale 1–3), share of newly arrived students, and share of boys. This data comes from national registers, not from the schools themselves.",
                    lang,
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">2</div>
              <div>
                <h4 className="font-semibold mb-1">{c("Beräkna förväntat resultat", "Calculate predicted result", lang)}</h4>
                <p className="text-sm text-muted-foreground">
                  {c(
                    "En regressionsmodell tränas på alla skolor i Sverige samma år. Modellen hittar det statistiska sambandet mellan bakgrundsfaktorerna och betygsresultaten. Utifrån detta beräknas ett förväntat meritvärde och en förväntad behörighetsgrad för varje skola — det resultat man skulle förvänta sig om skolan presterade som riksgenomsnittet för skolor med liknande elevsammansättning.",
                    "A regression model is trained on all schools in Sweden for that year. The model finds the statistical relationship between background factors and grade results. From this, a predicted merit value and predicted eligibility rate are calculated for each school — the result you would expect if the school performed like the national average for schools with a similar student composition.",
                    lang,
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">3</div>
              <div>
                <h4 className="font-semibold mb-1">{c("Beräkna residualen", "Calculate the residual", lang)}</h4>
                <p className="text-sm text-muted-foreground">
                  {c(
                    "Residualen är helt enkelt: faktiskt resultat minus förväntat resultat. En skola med meritvärde 240 och förväntat värde 220 har residual +20. Det betyder att skolan presterade 20 poäng bättre än vad bakgrundsfaktorerna förutsade. Samma beräkning görs för gymnasiebehörighet.",
                    "The residual is simply: actual result minus predicted result. A school with merit value 240 and predicted value 220 has residual +20. This means the school performed 20 points better than what the background factors predicted. The same calculation is done for gymnasiet eligibility.",
                    lang,
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">4</div>
              <div>
                <h4 className="font-semibold mb-1">{c("Tolka resultatet", "Interpret the result", lang)}</h4>
                <p className="text-sm text-muted-foreground">
                  {c(
                    "Residualen visar hur en skola presterar i förhållande till förväntningarna. Den säger inte varför — den visar bara att det finns en avvikelse. Positiv residual kan bero på bra undervisning, men också på faktorer som modellen inte fångar (motivation, skolkultur, kognitiv förmåga). Därför bör residualen alltid tolkas tillsammans med annan information.",
                    "The residual shows how a school performs relative to expectations. It doesn't say why — it only shows that there is a deviation. A positive residual could be due to good teaching, but also factors the model doesn't capture (motivation, school culture, cognitive ability). Therefore, the residual should always be interpreted alongside other information.",
                    lang,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <p className="text-sm font-medium mb-1">{c("Förklaringsgrad", "Explanatory power", lang)}</p>
            <p className="text-sm text-muted-foreground">
              {c(
                "Den nuvarande modellens justerade R² är ~53% för meritvärden och ~52% för behörighet. Det innebär att bakgrundsfaktorerna förklarar ungefär hälften av skillnaderna mellan skolor. Den andra hälften beror på faktorer som inte ingår i modellen — undervisningskvalitet, ledarskap, elevernas motivation, specialpedagogiska insatser och mycket annat. En hög förklaringsgrad betyder inte att bakgrunden determinerar resultatet; den visar att bakgrundsfaktorerna har ett starkt statistiskt samband med resultaten på skolnivå.",
                "The current model's adjusted R² is ~53% for merit values and ~52% for eligibility. This means background factors explain roughly half of the differences between schools. The other half is due to factors not in the model — teaching quality, leadership, student motivation, special education efforts, and much more. A high explanatory power does not mean background determines the outcome; it shows that background factors have a strong statistical association with results at the school level.",
                lang,
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key metrics explained */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Viktiga mått förklarade", "Key metrics explained", lang)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-[15px] leading-relaxed">
          <div>
            <h3 className="font-semibold text-base mb-1">
              {c("Meritvärde", "Merit value", lang)}
            </h3>
            <p>
              {c(
                "Det genomsnittliga betygspoengen för elever som avslutar årskurs 9 (grundskolan). Beräknas utifrån elevens 16 eller 17 bästa ämnen. Det teoretiska maxvärdet är 340 poäng (17 ämnen × A=20 poäng). Betygsskalan är A–F där A ger 20 poäng, B ger 17.5, C ger 15, D ger 12.5, E ger 10 och F ger 0. Sedan 2015 beräknas meritvärdet utifrån max 17 ämnen (moderna språk som språkval kan adderas); före 2015 var det max 16 ämnen.",
                "The average grade point for students completing year 9 (compulsory school). Calculated from the student's best 16 or 17 subjects. The theoretical maximum is 340 points (17 subjects × A=20 points). The grading scale is A–F where A gives 20 points, B gives 17.5, C gives 15, D gives 12.5, E gives 10, and F gives 0. Since 2015, the merit value is calculated from up to 17 subjects (modern languages as language choice can be added); before 2015 it was max 16 subjects.",
                lang,
              )}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              {c("Modellberäknat värde", "Predicted value", lang)}
            </h3>
            <p>
              {c(
                "Vad SALSA-regressionsmodellen förutsäger att en skolas genomsnittliga meritvärde bör vara, givet elevernas demografiska förutsättningar. Skolor med liknande bakgrund får liknande modellberäknade värden. Det modellberäknade värdet är inte ett mål som skolan ska nå — det är det statistiska genomsnittet för skolor med samma förutsättningar. En skola med högt utbildade föräldrar får ett högt förväntat värde, inte för att den är \"bättre\", utan för att den statistiska normen för sådana skolor är högre.",
                "What the SALSA regression model predicts a school's average merit value should be, given the students' demographic characteristics. Schools with similar backgrounds receive similar predicted values. The predicted value is not a target the school should reach — it is the statistical average for schools with similar conditions. A school with highly educated parents gets a high predicted value, not because it is \"better\", but because the statistical norm for such schools is higher.",
                lang,
              )}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              {c(
                "Residual (Residual = Faktiskt − Förväntat)",
                "Residual (Residual = Actual − Predicted)",
                lang,
              )}
            </h3>
            <p>
              {c(
                "Skillnaden mellan skolans faktiska resultat och vad modellen förutsa. Detta är det viktigaste måttet i SALSA:",
                "The difference between the school's actual results and what the model predicted. This is the most important metric in SALSA:",
                lang,
              )}
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <span className="text-emerald-600 font-medium">
                  {c("Positiv residual", "Positive residual", lang)}
                </span>{" "}
                &mdash;{" "}
                {c(
                  "skolan presterade bättre än förväntat. Givet elevernas bakgrund uppnådde skolan högre resultat än riksgenomsnittet för skolor med liknande förutsättningar.",
                  "the school performed better than expected. Given the students' backgrounds, the school achieved higher results than the national average for schools with similar conditions.",
                  lang,
                )}
              </li>
              <li>
                <span className="text-red-600 font-medium">
                  {c("Negativ residual", "Negative residual", lang)}
                </span>{" "}
                &mdash;{" "}
                {c(
                  "skolan presterade sämre än förväntat. Resultaten låg under vad som kunde förväntas givet elevernas bakgrund.",
                  "the school performed worse than expected. The results were below what could be expected given the students' backgrounds.",
                  lang,
                )}
              </li>
              <li>
                <strong>{c("Noll i residual", "Zero residual", lang)}</strong>{" "}
                &mdash;{" "}
                {c(
                  "skolan presterade exakt som förväntat. Resultaten matchar riksgenomsnittet för skolor med samma bakgrundsfaktorer.",
                  "the school performed exactly as expected. The results match the national average for schools with the same background factors.",
                  lang,
                )}
              </li>
            </ul>
            {dist && stats && (
              <p className="mt-3 text-sm text-muted-foreground">
                {c("År", "In", lang)} {stats.max_year}{" "}
                {c("presterade ", "", lang)}
                <span className="text-emerald-600 font-medium">
                  {dist.positive_residual_count} {c("skolor", "schools", lang)}
                </span>{" "}
                {c("bättre än förväntat och ", "performed above prediction and ", lang)}
                <span className="text-red-600 font-medium">
                  {dist.negative_residual_count} {c("skolor", "schools", lang)}
                </span>{" "}
                {c("sämre än förväntat.", "performed below prediction.", lang)}
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              {c("Gymnasiebehörighet", "Gymnasiet eligibility", lang)}
            </h3>
            <p>
              {c(
                "Andelen elever som uppnått godkända betyg i tillräckligt många ämnen för att vara behöriga till gymnasiet. SALSA visar både faktisk och förväntad behörighetsgrad, samt en residual som jämför dem.",
                "The share of students who achieved passing grades in enough subjects to qualify for upper secondary school. SALSA shows both actual and expected eligibility rates, plus a residual comparing them.",
                lang,
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How to interpret */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Hur man tolkar datan", "How to interpret the data", lang)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-medium text-amber-800 mb-2">
              {c("Viktiga förbehåll", "Important caveats", lang)}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-amber-900 text-sm">
              <li>
                {c(
                  'SALSA mäter korrelation, inte orsakssamband. En positiv residual bevisar inte att en skola är "bättre" — många faktorer utanför modellen (lärarkvalitet, skolkultur, elevmotivation, kognitiv förmåga) påverkar resultaten.',
                  'SALSA measures correlation, not causation. A positive residual does not prove a school is "better" — many factors outside the model (teacher quality, school culture, student motivation, cognitive ability) affect results.',
                  lang,
                )}
              </li>
              <li>
                {c(
                  "Jämförelser mellan år bör göras med försiktighet. En skolas residual kan förändras för att det nationella genomsnittet förskjutits, inte för att skolan själv förändrats.",
                  "Comparisons across years should be made with caution. A school's residual can change because the national average shifted, not because the school itself changed.",
                  lang,
                )}
              </li>
              <li>
                {c(
                  'Skolor med mycket få elever (under 15) kan ha dold data för att skydda enskilda elevers integritet. Dessa markeras med ".." i originalkällan.',
                  'Schools with very few students (under 15) may have suppressed data to protect individual student privacy. These are marked with ".." in the original source.',
                  lang,
                )}
              </li>
              <li>
                {c(
                  "SALSA-populationen 2016 skiljer sig från övriga år: elever utan personnummer exkluderades det året. Detta kan göra jämförelser över år mindre tillförlitliga för 2016.",
                  "The SALSA population in 2016 differs from other years: students without personal identity numbers were excluded that year. This can make cross-year comparisons less reliable for 2016.",
                  lang,
                )}
              </li>
              <li>
                {c(
                  "Betygsinflation kan påverka jämförelser över tid. Om betygen generellt stiger snabbare än vad bakgrundsfaktorerna förutsäger, kan genomsnittsresidualen för alla skolor förändras. SALSA kalibreras om varje år, men trenden i absoluta meritvärden bör ändå tolkas med medvetenhet om att betygsnormer kan ha förändrats.",
                  "Grade inflation can affect comparisons over time. If grades generally rise faster than background factors predict, the average residual across all schools can shift. SALSA is recalibrated each year, but the trend in absolute merit values should still be interpreted with awareness that grading norms may have changed.",
                  lang,
                )}
              </li>
            </ul>
          </div>
          <p>
            {c(
              "För en meningsfull bedömning av en skola, kombinera SALSA-data med annan information: Skolinspektionens granskningar, elev- och föräldraenkäter, samt lokal kännedom om skolmiljön.",
              "For a meaningful assessment of a school, combine SALSA data with other information: school inspections, student and parent surveys, and local knowledge of the school environment.",
              lang,
            )}
          </p>
        </CardContent>
      </Card>

      {/* Reading the charts */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Läsa diagrammen", "Reading the charts", lang)}</CardTitle>
          <CardDescription>
            {c(
              "Vad de vertikala linjerna och symbolerna i diagrammen betyder",
              "What the vertical lines and symbols in the charts mean",
              lang,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            {c(
              "I alla tidsdiagram på denna sajt ser du streckade vertikala linjer med en liten punkt. Dessa markerar år då SALSA-modellens metod ändrades. Håll muspekaren över punkten för att se vilken modelländring som skedde.",
              "In all time-series charts on this site, you will see dashed vertical lines with a small dot. These mark years when the SALSA model's methodology changed. Hover over the dot to see which model change occurred.",
              lang,
            )}
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 w-3 h-3 rounded-full bg-violet-400 shrink-0" />
              <div>
                <p className="font-medium text-sm">{c("2013 — Modell 2", "2013 — Model 2", lang)}</p>
                <p className="text-sm text-muted-foreground">
                  {c(
                    "\"Andel födda utomlands\" och \"andel med utländsk bakgrund\" ersattes med \"andel nyinvandrade\". Detta kan skapa ett hopp i data eftersom variabeln mäter olika saker.",
                    "\"Share born abroad\" and \"share with foreign background\" were replaced with \"share of newly arrived\". This can create a jump in data since the variable measures different things.",
                    lang,
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1.5 w-3 h-3 rounded-full bg-violet-400 shrink-0" />
              <div>
                <p className="font-medium text-sm">{c("2015 — Modell 3 + 17 ämnen", "2015 — Model 3 + 17 subjects", lang)}</p>
                <p className="text-sm text-muted-foreground">
                  {c(
                    "Elever med okänd bakgrund räknas nu som nyinvandrade. Dessutom ändrades meritvärdesberäkningen från max 16 till max 17 ämnen, vilket höjer det möjliga maxvärdet från 320 till 340 poäng. Meritvärden efter 2015 är därför inte direkt jämförbara med tidigare år.",
                    "Students with unknown background are now counted as newly arrived. Additionally, the merit calculation changed from max 16 to max 17 subjects, raising the possible maximum from 320 to 340 points. Merit values after 2015 are therefore not directly comparable with earlier years.",
                    lang,
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1.5 w-3 h-3 rounded-full bg-violet-400 shrink-0" />
              <div>
                <p className="font-medium text-sm">{c("2016 — Modell 4 (specialår)", "2016 — Model 4 (special year)", lang)}</p>
                <p className="text-sm text-muted-foreground">
                  {c(
                    "Under 2015–2016 kom många flyktingar till Sverige. Våren 2016 var det avsevärt fler elever utan personnummer i årskurs 9. För att minska risken för missvisande jämförelser exkluderades dessa elever helt från SALSA 2016. Detta gör att 2016 sticker ut i trenddata och bör tolkas med extra försiktighet.",
                    "During 2015–2016, many refugees arrived in Sweden. In spring 2016, there were significantly more students without personal identity numbers in year 9. To reduce the risk of misleading comparisons, these students were entirely excluded from SALSA 2016. This makes 2016 stand out in trend data and should be interpreted with extra caution.",
                    lang,
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model evolution */}
      <Card>
        <CardHeader>
          <CardTitle>{c("SALSA-modellens utveckling", "SALSA model evolution", lang)}</CardTitle>
          <CardDescription>
            {c(
              "Bakgrundsfaktorerna har förändrats över tid",
              "The background factors have changed over time",
              lang,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="text-left py-2 px-3">{c("Modell", "Model", lang)}</th>
                  <th scope="col" className="text-left py-2 px-3">{c("År", "Years", lang)}</th>
                  <th scope="col" className="text-left py-2 px-3">{c("Bakgrundsfaktorer", "Background factors", lang)}</th>
                  <th scope="col" className="text-left py-2 px-3">{c("Viktig förändring", "Key change", lang)}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">{c("Modell 1", "Model 1", lang)}</td>
                  <td className="py-2 px-3">1998&ndash;2012</td>
                  <td className="py-2 px-3">
                    {c(
                      "Föräldrars utb., födda utomlands, utl. bakgrund, andel pojkar",
                      "Parents' ed., born abroad, foreign bg., share of boys",
                      lang,
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{c("Ursprunglig modell", "Original model", lang)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">{c("Modell 2", "Model 2", lang)}</td>
                  <td className="py-2 px-3">2013&ndash;2014</td>
                  <td className="py-2 px-3">
                    {c(
                      "Föräldrars utb., nyinvandrade, andel pojkar",
                      "Parents' ed., newly arrived, share of boys",
                      lang,
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {c(
                      '"Nyinvandrade" ersätter utländsk bakgrund',
                      '"Newly arrived" replaces foreign background',
                      lang,
                    )}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">{c("Modell 3", "Model 3", lang)}</td>
                  <td className="py-2 px-3">{c("2015, 2017–idag", "2015, 2017–present", lang)}</td>
                  <td className="py-2 px-3">
                    {c(
                      "Föräldrars utb., nyinvandrade (inkl. okänd bakgr.), andel pojkar",
                      "Parents' ed., newly arrived (incl. unknown bg.), share of boys",
                      lang,
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {c(
                      "Elever med okänd bakgrund räknas som nyinvandrade",
                      "Students with unknown background counted as newly arrived",
                      lang,
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">{c("Modell 4", "Model 4", lang)}</td>
                  <td className="py-2 px-3">{c("Enbart 2016", "2016 only", lang)}</td>
                  <td className="py-2 px-3">
                    {c(
                      "Föräldrars utb., nyinvandrade, andel pojkar",
                      "Parents' ed., newly arrived, share of boys",
                      lang,
                    )}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {c(
                      "Elever utan personnummer exkluderade (flyktingvågen)",
                      "Students without ID numbers excluded (refugee wave)",
                      lang,
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              {c(
                "Varje modellbyte innebär att det modellberäknade värdet beräknas på ett delvis nytt sätt. Detta kan leda till hopp i residualerna vid övergångarna, även om skolorna själva inte förändrats. I diagrammen markeras dessa övergångar med streckade vertikala linjer.",
                "Each model change means the predicted value is calculated in a partially new way. This can cause jumps in residuals at the transitions, even if the schools themselves haven't changed. In the charts, these transitions are marked with dashed vertical lines.",
                lang,
              )}
            </p>
            <p>
              {c(
                "Den viktigaste förändringen skedde 2015 då meritvärdesberäkningen ändrades från max 16 till max 17 ämnen. Detta höjde de genomsnittliga meritvärdena nationellt och gör att absoluta merittal före och efter 2015 inte är direkt jämförbara. Residualerna påverkas dock inte i samma grad, eftersom både det faktiska och det förväntade värdet beräknas på samma sätt för ett givet år.",
                "The most significant change occurred in 2015 when the merit calculation changed from max 16 to max 17 subjects. This raised average national merit values and means absolute merit numbers before and after 2015 are not directly comparable. However, residuals are less affected, since both the actual and predicted values are calculated the same way for a given year.",
                lang,
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stored data fields */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Lagrade datapunkter", "Stored data fields", lang)}</CardTitle>
          <CardDescription>
            {c(
              "Varje fält från SIRIS SALSA-tabellen lagras",
              "Every field from the SIRIS SALSA table is stored",
              lang,
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="text-left py-2 px-3">{c("Fält", "Field", lang)}</th>
                  <th scope="col" className="text-left py-2 px-3">{c("Svenskt namn", "Swedish name", lang)}</th>
                  <th scope="col" className="text-left py-2 px-3">{c("Tillgängligt", "Available", lang)}</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("År", "Year", lang)}</td><td className="py-1.5 px-3">Verksamhetsår</td><td className="py-1.5 px-3">1998&ndash;2025</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Kommun", "Municipality", lang)}</td><td className="py-1.5 px-3">Kommun</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Skolnamn", "School name", lang)}</td><td className="py-1.5 px-3">Skolenhet</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Huvudmannatyp", "Owner type", lang)}</td><td className="py-1.5 px-3">Huvudman (Kom./Ensk.)</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">{c("Bakgrundsfaktorer", "Background factors", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Föräldrars utbildning", "Parents' education", lang)}</td><td className="py-1.5 px-3">Föräldrarnas utbildningsnivå</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Andel nyinvandrade", "Newly arrived %", lang)}</td><td className="py-1.5 px-3">Andel nyinvandrade</td><td className="py-1.5 px-3">2013&ndash;2025</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Andel födda utomlands", "Born abroad %", lang)}</td><td className="py-1.5 px-3">Andel födda utomlands</td><td className="py-1.5 px-3">1998&ndash;2012</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Andel utländsk bakgrund", "Foreign background %", lang)}</td><td className="py-1.5 px-3">Andel utländsk bakgrund</td><td className="py-1.5 px-3">1998&ndash;2012</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Andel pojkar", "Boys %", lang)}</td><td className="py-1.5 px-3">Andel pojkar</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">{c("Behörighet", "Eligibility", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Faktisk behörighet %", "Actual eligibility %", lang)}</td><td className="py-1.5 px-3">Faktiskt värde (F)</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Förväntad behörighet %", "Predicted eligibility %", lang)}</td><td className="py-1.5 px-3">Modellberäknat värde (B)</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Residual behörighet", "Eligibility residual", lang)}</td><td className="py-1.5 px-3">Residual (R=F&minus;B)</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">{c("Meritvärde", "Merit value", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Faktiskt meritvärde", "Actual merit value", lang)}</td><td className="py-1.5 px-3">Faktiskt värde (F)</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">{c("Förväntat meritvärde", "Predicted merit value", lang)}</td><td className="py-1.5 px-3">Modellberäknat värde (B)</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
                <tr><td className="py-1.5 px-3 font-medium">{c("Residual meritvärde", "Merit residual", lang)}</td><td className="py-1.5 px-3">Residual (R=F&minus;B)</td><td className="py-1.5 px-3">{c("Alla år", "All years", lang)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {c(
              'Obs: "Födda utomlands" och "Utländsk bakgrund" ersattes av "Nyinvandrade" 2013 när SALSA-modellen uppdaterades. Båda uppsättningarna av fält bevaras i denna utforskare för historisk analys. Meritvärdesberäkningen ändrades 2015 från max 16 till max 17 ämnen.',
              'Note: "Born abroad" and "Foreign background" were replaced by "Newly arrived" in 2013 when the SALSA model was updated. Both sets of fields are preserved in this explorer for historical analysis. The merit calculation changed in 2015 from max 16 to max 17 subjects.',
              lang,
            )}
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Funktioner", "Features", lang)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[15px] leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                {c(
                  "Nationell översikt med viktiga insikter, trenddiagram, bästa/sämsta skolor och kommunrankning för senaste året.",
                  "National overview with key insights, trend charts, top/bottom schools and municipality ranking for the latest year.",
                  lang,
                )}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">{c("Kommunbläddare", "Municipality browser", lang)}</h4>
              <p className="text-sm text-muted-foreground">
                {c(
                  "Bläddra bland alla kommuner och deras skolor. Varje kommunsida visar trenddiagram och en sorterbar skoltabell med meritvärden och residualer.",
                  "Browse all municipalities and their schools. Each municipality page shows trend charts and a sortable school table with merit values and residuals.",
                  lang,
                )}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">{c("Skoldetaljer", "School details", lang)}</h4>
              <p className="text-sm text-muted-foreground">
                {c(
                  "Fördjupa dig i vilken skola som helst: merittrend, residualhistorik, behörighetsgrad, demografisk fördelning och fullständig datatabell över alla år.",
                  "Dive into any school: merit trend, residual history, eligibility rate, demographic breakdown and full data table across all years.",
                  lang,
                )}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">{c("Sök", "Search", lang)}</h4>
              <p className="text-sm text-muted-foreground">
                {c(
                  "Hitta vilken skola som helst via namn eller kommun. Resultaten visar senaste meritvärden och residualer direkt.",
                  "Find any school by name or municipality. Results show the latest merit values and residuals directly.",
                  lang,
                )}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">{c("Jämför", "Compare", lang)}</h4>
              <p className="text-sm text-muted-foreground">
                {c(
                  "Sök och välj upp till 5 skolor för jämförelse sida vid sida med överlappande diagram och detaljerade datatabeller.",
                  "Search and select up to 5 schools for side-by-side comparison with overlapping charts and detailed data tables.",
                  lang,
                )}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">{c("Nationella trender", "National trends", lang)}</h4>
              <p className="text-sm text-muted-foreground">
                {c(
                  "Se hur nationella genomsnitt för meritvärden, behörighetsgrader och antalet skolor har utvecklats från 1998 till idag.",
                  "See how national averages for merit values, eligibility rates and school counts have evolved from 1998 to the present.",
                  lang,
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data source */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Datakälla & metod", "Data source & method", lang)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            {c("All data hämtas från ", "All data is sourced from ", lang)}
            <a
              href="https://siris.skolverket.se/siris/f?p=SIRIS:164:0::NO:::"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              SIRIS (Skolverkets Internetbaserade Resultat- och kvalitetsInformationsSystem)
            </a>
            {c(
              ", som är Skolverkets officiella publika databas för skolstatistik.",
              ", which is Skolverket's official public database for school statistics.",
              lang,
            )}
          </p>
          <p>
            {c(
              "Datan samlades in programmatiskt med en specialbyggd skrapa som navigerar SIRIS-webbapplikationen, väljer varje kommun och dess skolor, och extraherar SALSA-tabellens data. Hastighetsbegränsning och artiga fördröjningar användes för att undvika överbelastning av servern.",
              "The data was collected programmatically using a purpose-built scraper that navigates the SIRIS web application, selects each municipality and its schools, and extracts the SALSA table data. Rate limiting and polite delays were used to avoid overloading the server.",
              lang,
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {c(
              "Detta projekt är inte anslutet till eller godkänt av Skolverket. Datan är offentlig information som tillgängliggörs av Skolverket för transparens och forskning. Denna utforskare gör det helt enkelt lättare att bläddra och analysera.",
              "This project is not affiliated with or endorsed by Skolverket. The data is public information made available by Skolverket for transparency and research. This explorer simply makes it easier to browse and analyze.",
              lang,
            )}
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Säkerhet", "Security", lang)}</CardTitle>
          <CardDescription>{c("OWASP Top 10-kompatibel", "OWASP Top 10 compliant", lang)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-[15px] leading-relaxed">
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>
              <strong>{c("Injektionsskydd", "Injection protection", lang)}</strong> &mdash;{" "}
              {c(
                "alla SQL-frågor använder parametriserade satser, LIKE-metatecken escapas, URL-parametrar valideras mot strikta regex-mönster",
                "all SQL queries use parameterized statements, LIKE metacharacters are escaped, URL parameters are validated against strict regex patterns",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Säkerhetsrubriker", "Security headers", lang)}</strong> &mdash; Content-Security-Policy, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
            </li>
            <li>
              <strong>{c("Hastighetsbegränsning", "Rate limiting", lang)}</strong> &mdash;{" "}
              {c(
                "API-ändpunkter tillåter max 60 förfrågningar per minut per IP för att förhindra missbruk",
                "API endpoints allow max 60 requests per minute per IP to prevent abuse",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Skrivskyddad databas", "Read-only database", lang)}</strong> &mdash;{" "}
              {c(
                "SQLite öppnas i skrivskyddat läge; även en lyckad injektion kan inte ändra data",
                "SQLite is opened in read-only mode; even a successful injection cannot modify data",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Inga hemligheter", "No secrets", lang)}</strong> &mdash;{" "}
              {c(
                "ingen autentisering, ingen persondata, inga API-nycklar. All data är offentlig statistik från myndigheter",
                "no authentication, no personal data, no API keys. All data is public government statistics",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Strukturerad loggning", "Structured logging", lang)}</strong> &mdash;{" "}
              {c(
                "alla API-förfrågningar och fel loggas som JSON för övervakning och granskning",
                "all API requests and errors are logged as JSON for monitoring and auditing",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Docker-härdning", "Docker hardening", lang)}</strong> &mdash;{" "}
              {c(
                "icke-root-användare, npm ci för reproducerbara byggen, skrivskyddad datavolym",
                "non-root user, npm ci for reproducible builds, read-only data volume",
                lang,
              )}
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Open source */}
      <Card>
        <CardHeader>
          <CardTitle>{c("Öppen källkod", "Open source", lang)}</CardTitle>
          <CardDescription>
            <a
              href="https://github.com/ClaudeCarlsson/skolsalsa"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/ClaudeCarlsson/skolsalsa
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-[15px] leading-relaxed">
          <p>
            {c("Detta projekt är helt öppet. Kodbasen inkluderar:", "This project is fully open. The codebase includes:", lang)}
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>
              <strong>{c("Skrapa", "Scraper", lang)}</strong> &mdash;{" "}
              {c(
                "Node.js HTTP-klient som navigerar SIRIS Oracle APEX-applikationen, med hastighetsbegränsning, omförsök, kontrollpunkter och återupptagningsstöd",
                "Node.js HTTP client that navigates the SIRIS Oracle APEX application, with rate limiting, retries, checkpointing and resume support",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Databas", "Database", lang)}</strong> &mdash;{" "}
              {c(
                "SQLite med 21 000+ poster över 28 år med index",
                "SQLite with 21,000+ records over 28 years with indexes",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Utforskare", "Explorer", lang)}</strong> &mdash;{" "}
              {c(
                "Next.js 16 med serverkomponenter, Recharts-visualiseringar och shadcn/ui",
                "Next.js 16 with server components, Recharts visualizations and shadcn/ui",
                lang,
              )}
            </li>
            <li>
              <strong>{c("Tester", "Tests", lang)}</strong> &mdash;{" "}
              {c(
                "100+ integrationstester mot riktiga API:er och en riktig server, utan mockning",
                "100+ integration tests against real APIs and a real server, with no mocking",
                lang,
              )}
            </li>
            <li>
              <strong>Docker</strong> &mdash;{" "}
              {c("flerstegsbygge med hälsokontroller", "multi-stage build with health checks", lang)}
            </li>
            <li>
              <strong>Linting</strong> &mdash;{" "}
              {c(
                "strikt ESLint med säkerhetsregler (no-eval, no-implied-eval, no-new-func, react/no-danger)",
                "strict ESLint with security rules (no-eval, no-implied-eval, no-new-func, react/no-danger)",
                lang,
              )}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
