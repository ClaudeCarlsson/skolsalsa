import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDashboardStats, getYearDistribution } from "@/lib/db";

export default function AboutPage() {
  let stats;
  let dist;
  try {
    stats = getDashboardStats();
    dist = getYearDistribution(stats.max_year);
  } catch {
    // DB not available — render static content only
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Om denna utforskare</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Ett &ouml;ppet verktyg f&ouml;r att utforska svensk skolstatistik
          fr&aring;n Skolverkets SALSA-modell.
        </p>
      </div>

      {/* Vad är detta */}
      <Card>
        <CardHeader>
          <CardTitle>Vad &auml;r SkolSalsa SALSA-utforskaren?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            Denna utforskare ger fri, &ouml;ppen tillg&aring;ng till
            skolresultatdata fr&aring;n <strong>SALSA</strong> (Skolverkets
            Arbetsverktyg f&ouml;r Lokala SambandsAnalyser) &mdash; en
            statistisk modell som underh&aring;lls av{" "}
            <a
              href="https://www.skolverket.se"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Skolverket
            </a>
            .
          </p>
          <p>
            Datan omfattar{" "}
            <strong>
              {stats
                ? `${stats.total_schools.toLocaleString("sv-SE")} skolor i ${stats.total_municipalities} kommuner`
                : "alla svenska skolor"}
            </strong>
            , fr&aring;n{" "}
            <strong>
              {stats
                ? `${stats.min_year} till ${stats.max_year} (${stats.max_year - stats.min_year + 1} \u00e5r)`
                : "1998 till idag"}
            </strong>
            , med totalt{" "}
            <strong>
              {stats
                ? `${stats.total_records.toLocaleString("sv-SE")} datapunkter`
                : "tiotusentals datapunkter"}
            </strong>
            . B&aring;de kommunala och enskilda (frist&aring;ende) skolor
            ing&aring;r.
          </p>
        </CardContent>
      </Card>

      {/* Vad är SALSA */}
      <Card>
        <CardHeader>
          <CardTitle>Vad &auml;r SALSA?</CardTitle>
          <CardDescription>
            Skolverkets Arbetsverktyg f&ouml;r Lokala SambandsAnalyser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            SALSA &auml;r en regressionsbaserad statistisk modell som
            j&auml;mf&ouml;r varje skolas faktiska resultat med vad som
            <em> f&ouml;rv&auml;ntas</em> givet skolans
            elevsammans&auml;ttning. Syftet &auml;r att m&ouml;jligg&ouml;ra
            r&auml;ttvisare j&auml;mf&ouml;relser mellan skolor genom att ta
            h&auml;nsyn till skillnader i elevernas bakgrund.
          </p>
          <p>
            Den nuvarande modellen (sedan 2015) anv&auml;nder dessa{" "}
            <strong>bakgrundsfaktorer</strong>:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>F&ouml;r&auml;ldrarnas utbildningsniv&aring;</strong>{" "}
              &mdash; den enskilt starkaste prediktorn. Genomsnittlig
              utbildningsniv&aring; p&aring; en skala 1&ndash;3 d&auml;r 3 =
              h&ouml;gskoleutbildning.
            </li>
            <li>
              <strong>Andel nyinvandrade elever</strong> &mdash; elever
              folkbokf&ouml;rda i Sverige de senaste 4 &aring;ren, plus elever
              med ok&auml;nd bakgrund (sedan 2015).
            </li>
            <li>
              <strong>Andel pojkar</strong> &mdash; k&ouml;nsf&ouml;rdelningen
              bland eleverna.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Modellen har utvecklats &ouml;ver tid. F&ouml;re 2013 anv&auml;ndes
            &ldquo;andel f&ouml;dda utomlands&rdquo; och &ldquo;andel med
            utl&auml;ndsk bakgrund&rdquo; ist&auml;llet f&ouml;r
            &ldquo;nyinvandrade&rdquo;. 2016 exkluderades elever utan
            personnummer helt. Den nuvarande modellen (modell 3) har ett
            justerat R&sup2; p&aring; ~53% f&ouml;r meritv&auml;rden, vilket
            inneb&auml;r att 53% av variansen mellan skolor f&ouml;rklaras av
            enbart dessa bakgrundsfaktorer.
          </p>
        </CardContent>
      </Card>

      {/* Viktiga mått förklarade */}
      <Card>
        <CardHeader>
          <CardTitle>Viktiga m&aring;tt f&ouml;rklarade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-[15px] leading-relaxed">
          <div>
            <h3 className="font-semibold text-base mb-1">
              Meritv&auml;rde
            </h3>
            <p>
              Det genomsnittliga betygspoengen f&ouml;r elever som avslutar
              &aring;rskurs 9 (grundskolan). Ber&auml;knas utifr&aring;n
              elevens 16 eller 17 b&auml;sta &auml;mnen. Det teoretiska
              maxv&auml;rdet &auml;r 340 po&auml;ng (17 &auml;mnen &times;
              A=20 po&auml;ng).
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              Modellber&auml;knat v&auml;rde
            </h3>
            <p>
              Vad SALSA-regressionsmodellen f&ouml;ruts&auml;ger att en skolas
              genomsnittliga meritv&auml;rde <em>b&ouml;r</em> vara, givet
              elevernas demografiska f&ouml;ruts&auml;ttningar. Skolor med
              liknande bakgrund f&aring;r liknande modellber&auml;knade
              v&auml;rden.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              Residual (Residual = Faktiskt &minus; F&ouml;rv&auml;ntat)
            </h3>
            <p>
              Skillnaden mellan skolans faktiska resultat och vad modellen
              f&ouml;rutsa. Detta &auml;r det viktigaste m&aring;ttet i SALSA:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <span className="text-green-600 font-medium">
                  Positiv residual
                </span>{" "}
                &mdash; skolan presterade <em>b&auml;ttre</em> &auml;n
                f&ouml;rv&auml;ntat. Givet elevernas bakgrund uppn&aring;dde
                skolan h&ouml;gre resultat &auml;n riksgenomsnittet f&ouml;r
                skolor med liknande f&ouml;ruts&auml;ttningar.
              </li>
              <li>
                <span className="text-red-600 font-medium">
                  Negativ residual
                </span>{" "}
                &mdash; skolan presterade <em>s&auml;mre</em> &auml;n
                f&ouml;rv&auml;ntat. Resultaten l&aring;g under vad som kunde
                f&ouml;rv&auml;ntas givet elevernas bakgrund.
              </li>
              <li>
                <strong>Noll i residual</strong> &mdash; skolan presterade
                exakt som f&ouml;rv&auml;ntat. Resultaten matchar
                riksgenomsnittet f&ouml;r skolor med samma bakgrundsfaktorer.
              </li>
            </ul>
            {dist && (
              <p className="mt-3 text-sm text-muted-foreground">
                &Aring;r {stats?.max_year} presterade{" "}
                <span className="text-green-600 font-medium">
                  {dist.positive_residual_count} skolor
                </span>{" "}
                b&auml;ttre &auml;n f&ouml;rv&auml;ntat och{" "}
                <span className="text-red-600 font-medium">
                  {dist.negative_residual_count} skolor
                </span>{" "}
                s&auml;mre &auml;n f&ouml;rv&auml;ntat.
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              Gymnasiebeh&ouml;righet
            </h3>
            <p>
              Andelen elever som uppn&aring;tt godk&auml;nda betyg i
              tillr&auml;ckligt m&aring;nga &auml;mnen f&ouml;r att vara
              beh&ouml;riga till gymnasiet. SALSA visar b&aring;de faktisk och
              f&ouml;rv&auml;ntad beh&ouml;righetsgrad, samt en residual som
              j&auml;mf&ouml;r dem.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hur man tolkar datan */}
      <Card>
        <CardHeader>
          <CardTitle>Hur man tolkar datan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-medium text-amber-800 mb-2">
              Viktiga f&ouml;rbeh&aring;ll
            </p>
            <ul className="list-disc pl-5 space-y-2 text-amber-900 text-sm">
              <li>
                SALSA m&auml;ter <em>korrelation</em>, inte orsakssamband. En
                positiv residual bevisar inte att en skola &auml;r
                &ldquo;b&auml;ttre&rdquo; &mdash; m&aring;nga faktorer utanf&ouml;r
                modellen (l&auml;rarkvalitet, skolkultur, elevmotivation,
                kognitiv f&ouml;rm&aring;ga) p&aring;verkar resultaten.
              </li>
              <li>
                J&auml;mf&ouml;relser mellan &aring;r b&ouml;r g&ouml;ras med
                f&ouml;rsiktighet. En skolas residual kan f&ouml;r&auml;ndras
                f&ouml;r att det <em>nationella</em> genomsnittet f&ouml;rskjutits,
                inte f&ouml;r att skolan sj&auml;lv f&ouml;r&auml;ndrats.
              </li>
              <li>
                Skolor med mycket f&aring; elever (under 15) kan ha dold data
                f&ouml;r att skydda enskilda elevers integritet. Dessa markeras
                med &ldquo;..&rdquo; i originalk&auml;llan.
              </li>
              <li>
                SALSA-populationen 2016 skiljer sig fr&aring;n &ouml;vriga
                &aring;r: elever utan personnummer exkluderades det &aring;ret.
                Detta kan g&ouml;ra j&auml;mf&ouml;relser &ouml;ver &aring;r
                mindre tillf&ouml;rlitliga f&ouml;r 2016.
              </li>
            </ul>
          </div>
          <p>
            F&ouml;r en meningsfull bed&ouml;mning av en skola, kombinera
            SALSA-data med annan information: Skolinspektionens granskningar,
            elev- och f&ouml;r&auml;ldraenk&auml;ter, samt lokal k&auml;nnedom
            om skolmilj&ouml;n.
          </p>
        </CardContent>
      </Card>

      {/* Modellens utveckling */}
      <Card>
        <CardHeader>
          <CardTitle>SALSA-modellens utveckling</CardTitle>
          <CardDescription>
            Bakgrundsfaktorerna har f&ouml;r&auml;ndrats &ouml;ver tid
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="text-left py-2 px-3">Modell</th>
                  <th scope="col" className="text-left py-2 px-3">&Aring;r</th>
                  <th scope="col" className="text-left py-2 px-3">Bakgrundsfaktorer</th>
                  <th scope="col" className="text-left py-2 px-3">Viktig f&ouml;r&auml;ndring</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Modell 1</td>
                  <td className="py-2 px-3">1998&ndash;2012</td>
                  <td className="py-2 px-3">F&ouml;r&auml;ldrars utb., f&ouml;dda utomlands, utl. bakgrund, andel pojkar</td>
                  <td className="py-2 px-3 text-muted-foreground">Ursprunglig modell</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Modell 2</td>
                  <td className="py-2 px-3">2013&ndash;2014</td>
                  <td className="py-2 px-3">F&ouml;r&auml;ldrars utb., nyinvandrade, andel pojkar</td>
                  <td className="py-2 px-3 text-muted-foreground">&ldquo;Nyinvandrade&rdquo; ers&auml;tter utl&auml;ndsk bakgrund</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Modell 3</td>
                  <td className="py-2 px-3">2015, 2017&ndash;idag</td>
                  <td className="py-2 px-3">F&ouml;r&auml;ldrars utb., nyinvandrade (inkl. ok&auml;nd bakgr.), andel pojkar</td>
                  <td className="py-2 px-3 text-muted-foreground">Elever med ok&auml;nd bakgrund r&auml;knas som nyinvandrade</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Modell 4</td>
                  <td className="py-2 px-3">Enbart 2016</td>
                  <td className="py-2 px-3">F&ouml;r&auml;ldrars utb., nyinvandrade, andel pojkar</td>
                  <td className="py-2 px-3 text-muted-foreground">Elever utan personnummer exkluderade (flyktingv&aring;gen)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lagrade datapunkter */}
      <Card>
        <CardHeader>
          <CardTitle>Lagrade datapunkter</CardTitle>
          <CardDescription>
            Varje f&auml;lt fr&aring;n SIRIS SALSA-tabellen lagras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="text-left py-2 px-3">F&auml;lt</th>
                  <th scope="col" className="text-left py-2 px-3">Svenskt namn</th>
                  <th scope="col" className="text-left py-2 px-3">Tillg&auml;ngligt</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">&Aring;r</td><td className="py-1.5 px-3">Verksamhets&aring;r</td><td className="py-1.5 px-3">1998&ndash;2025</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Kommun</td><td className="py-1.5 px-3">Kommun</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Skolnamn</td><td className="py-1.5 px-3">Skolenhet</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Huvudmannatyp</td><td className="py-1.5 px-3">Huvudman (Kom./Ensk.)</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">Bakgrundsfaktorer</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">F&ouml;r&auml;ldrars utbildning</td><td className="py-1.5 px-3">F&ouml;r&auml;ldrarnas utbildningsniv&aring;</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Andel nyinvandrade</td><td className="py-1.5 px-3">Andel nyinvandrade</td><td className="py-1.5 px-3">2013&ndash;2025</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Andel f&ouml;dda utomlands</td><td className="py-1.5 px-3">Andel f&ouml;dda utomlands</td><td className="py-1.5 px-3">1998&ndash;2012</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Andel utl&auml;ndsk bakgrund</td><td className="py-1.5 px-3">Andel utl&auml;ndsk bakgrund</td><td className="py-1.5 px-3">1998&ndash;2012</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Andel pojkar</td><td className="py-1.5 px-3">Andel pojkar</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">Beh&ouml;righet (godk&auml;nda betyg i alla &auml;mnen)</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Faktisk beh&ouml;righet %</td><td className="py-1.5 px-3">Faktiskt v&auml;rde (F)</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">F&ouml;rv&auml;ntad beh&ouml;righet %</td><td className="py-1.5 px-3">Modellber&auml;knat v&auml;rde (B)</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Residual beh&ouml;righet</td><td className="py-1.5 px-3">Residual (R=F&minus;B)</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">Meritv&auml;rde (genomsnittligt meritv&auml;rde)</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Faktiskt meritv&auml;rde</td><td className="py-1.5 px-3">Faktiskt v&auml;rde (F)</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">F&ouml;rv&auml;ntat meritv&auml;rde</td><td className="py-1.5 px-3">Modellber&auml;knat v&auml;rde (B)</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
                <tr><td className="py-1.5 px-3 font-medium">Residual meritv&auml;rde</td><td className="py-1.5 px-3">Residual (R=F&minus;B)</td><td className="py-1.5 px-3">Alla &aring;r</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Obs: &ldquo;F&ouml;dda utomlands&rdquo; och &ldquo;Utl&auml;ndsk
            bakgrund&rdquo; ersattes av &ldquo;Nyinvandrade&rdquo; 2013 n&auml;r
            SALSA-modellen uppdaterades. B&aring;da upps&auml;ttningarna av
            f&auml;lt bevaras i denna utforskare f&ouml;r historisk analys.
            Meritv&auml;rdesber&auml;kningen &auml;ndrades 2015 fr&aring;n max
            16 till max 17 &auml;mnen.
          </p>
        </CardContent>
      </Card>

      {/* Funktioner i utforskaren */}
      <Card>
        <CardHeader>
          <CardTitle>Funktioner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[15px] leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                Nationell &ouml;versikt med viktiga insikter, trenddiagram,
                b&auml;sta/s&auml;msta skolor och kommunrankning f&ouml;r
                senaste &aring;ret.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Kommunbl&auml;ddrare</h4>
              <p className="text-sm text-muted-foreground">
                Bl&auml;ddra bland alla kommuner och deras skolor. Varje
                kommunsida visar trenddiagram och en sorterbar skoltabell med
                meritv&auml;rden och residualer.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Skoldetaljer</h4>
              <p className="text-sm text-muted-foreground">
                F&ouml;rdjupa dig i vilken skola som helst: merittrend,
                residualhistorik, beh&ouml;righetsgrad, demografisk
                f&ouml;rdelning och fullst&auml;ndig datatabell &ouml;ver alla
                &aring;r.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">S&ouml;k</h4>
              <p className="text-sm text-muted-foreground">
                Hitta vilken skola som helst via namn eller kommun. Resultaten
                visar senaste meritv&auml;rden och residualer direkt.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">J&auml;mf&ouml;r</h4>
              <p className="text-sm text-muted-foreground">
                S&ouml;k och v&auml;lj upp till 5 skolor f&ouml;r
                j&auml;mf&ouml;relse sida vid sida med &ouml;verlappande
                diagram och detaljerade datatabeller.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Nationella trender</h4>
              <p className="text-sm text-muted-foreground">
                Se hur nationella genomsnitt f&ouml;r meritv&auml;rden,
                beh&ouml;righetsgrader och antalet skolor har utvecklats
                fr&aring;n 1998 till idag.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datakälla & metod */}
      <Card>
        <CardHeader>
          <CardTitle>Datak&auml;lla &amp; metod</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            All data h&auml;mtas fr&aring;n{" "}
            <a
              href="https://siris.skolverket.se/siris/f?p=SIRIS:164:0::NO:::"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              SIRIS (Skolverkets Internetbaserade Resultat- och
              kvalitetsInformationsSystem)
            </a>
            , som &auml;r Skolverkets officiella publika databas f&ouml;r
            skolstatistik.
          </p>
          <p>
            Datan samlades in programmatiskt med en specialbyggd skrapa som
            navigerar SIRIS-webbapplikationen, v&auml;ljer varje kommun och
            dess skolor, och extraherar SALSA-tabellens data. Hastighetsbegr&auml;nsning
            och artiga f&ouml;rdr&ouml;jningar anv&auml;ndes f&ouml;r att
            undvika &ouml;verbelastning av servern.
          </p>
          <p className="text-sm text-muted-foreground">
            Detta projekt &auml;r inte anslutet till eller godk&auml;nt av
            Skolverket. Datan &auml;r offentlig information som
            tillg&auml;ngligg&ouml;rs av Skolverket f&ouml;r transparens och
            forskning. Denna utforskare g&ouml;r det helt enkelt l&auml;ttare
            att bl&auml;ddra och analysera.
          </p>
        </CardContent>
      </Card>

      {/* Säkerhet */}
      <Card>
        <CardHeader>
          <CardTitle>S&auml;kerhet</CardTitle>
          <CardDescription>OWASP Top 10-kompatibel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-[15px] leading-relaxed">
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>
              <strong>Injektionsskydd</strong> &mdash; alla SQL-fr&aring;gor
              anv&auml;nder parametriserade satser, LIKE-metatecken escapas,
              URL-parametrar valideras mot strikta regex-m&ouml;nster
            </li>
            <li>
              <strong>S&auml;kerhetsrubriker</strong> &mdash;
              Content-Security-Policy, X-Frame-Options DENY,
              X-Content-Type-Options nosniff, Referrer-Policy,
              Permissions-Policy
            </li>
            <li>
              <strong>Hastighetsbegr&auml;nsning</strong> &mdash;
              API-&auml;ndpunkter till&aring;ter max 60 f&ouml;rfr&aring;gningar
              per minut per IP f&ouml;r att f&ouml;rhindra missbruk
            </li>
            <li>
              <strong>Skrivskyddad databas</strong> &mdash; SQLite &ouml;ppnas
              i skrivskyddat l&auml;ge; &auml;ven en lyckad injektion kan inte
              &auml;ndra data
            </li>
            <li>
              <strong>Inga hemligheter</strong> &mdash; ingen autentisering,
              ingen persondata, inga API-nycklar. All data &auml;r offentlig
              statistik fr&aring;n myndigheter
            </li>
            <li>
              <strong>Strukturerad loggning</strong> &mdash; alla
              API-f&ouml;rfr&aring;gningar och fel loggas som JSON f&ouml;r
              &ouml;vervakning och granskning
            </li>
            <li>
              <strong>Docker-h&auml;rdning</strong> &mdash;
              icke-root-anv&auml;ndare, npm ci f&ouml;r reproducerbara byggen,
              skrivskyddad datavolym
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Öppen källkod */}
      <Card>
        <CardHeader>
          <CardTitle>&Ouml;ppen k&auml;llkod</CardTitle>
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
            Detta projekt &auml;r helt &ouml;ppet. Kodbasen inkluderar:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>
              <strong>Skrapa</strong> &mdash; Node.js HTTP-klient som navigerar
              SIRIS Oracle APEX-applikationen, med hastighetsbegr&auml;nsning,
              omf&ouml;rs&ouml;k, kontrollpunkter och &aring;terupptagningsst&ouml;d
            </li>
            <li>
              <strong>Databas</strong> &mdash; SQLite med 21 000+ poster
              &ouml;ver 28 &aring;r med index
            </li>
            <li>
              <strong>Utforskare</strong> &mdash; Next.js 16 med
              serverkomponenter, Recharts-visualiseringar och shadcn/ui
            </li>
            <li>
              <strong>Tester</strong> &mdash; 100+ integrationstester mot
              riktiga API:er och en riktig server, utan mockning
            </li>
            <li>
              <strong>Docker</strong> &mdash; flerstegsbygn med h&auml;lsokontroller
            </li>
            <li>
              <strong>Linting</strong> &mdash; strikt ESLint med
              s&auml;kerhetsregler (no-eval, no-implied-eval, no-new-func,
              react/no-danger)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
