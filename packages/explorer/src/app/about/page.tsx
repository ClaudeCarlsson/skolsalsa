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
                "Det genomsnittliga betygspoengen för elever som avslutar årskurs 9 (grundskolan). Beräknas utifrån elevens 16 eller 17 bästa ämnen. Det teoretiska maxvärdet är 340 poäng (17 ämnen × A=20 poäng).",
                "The average grade point for students completing year 9 (compulsory school). Calculated from the student's best 16 or 17 subjects. The theoretical maximum is 340 points (17 subjects × A=20 points).",
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
                "Vad SALSA-regressionsmodellen förutsäger att en skolas genomsnittliga meritvärde bör vara, givet elevernas demografiska förutsättningar. Skolor med liknande bakgrund får liknande modellberäknade värden.",
                "What the SALSA regression model predicts a school's average merit value should be, given the students' demographic characteristics. Schools with similar backgrounds receive similar predicted values.",
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
