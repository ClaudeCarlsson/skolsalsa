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
        <h1 className="text-3xl font-bold">About This Explorer</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          An open tool for exploring Swedish school performance data from
          Skolverket&apos;s SALSA model.
        </p>
      </div>

      {/* What is this */}
      <Card>
        <CardHeader>
          <CardTitle>What is SkolSalsa SALSA Explorer?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            This explorer provides free, open access to school performance data
            from <strong>SALSA</strong> (Skolverkets Arbetsverktyg f&ouml;r
            Lokala SambandsAnalyser) &mdash; a statistical model maintained by{" "}
            <a
              href="https://www.skolverket.se"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Skolverket
            </a>{" "}
            (the Swedish National Agency for Education).
          </p>
          <p>
            The data covers{" "}
            <strong>
              {stats
                ? `${stats.total_schools.toLocaleString()} schools across ${stats.total_municipalities} municipalities`
                : "all Swedish schools"}
            </strong>
            , spanning{" "}
            <strong>
              {stats
                ? `${stats.min_year} to ${stats.max_year} (${stats.max_year - stats.min_year + 1} years)`
                : "1998 to present"}
            </strong>
            , with a total of{" "}
            <strong>
              {stats
                ? `${stats.total_records.toLocaleString()} data points`
                : "tens of thousands of data points"}
            </strong>
            . Both kommunala (municipal/public) and enskilda (independent/private)
            schools are included.
          </p>
        </CardContent>
      </Card>

      {/* What is SALSA */}
      <Card>
        <CardHeader>
          <CardTitle>What is SALSA?</CardTitle>
          <CardDescription>
            Skolverkets Arbetsverktyg f&ouml;r Lokala SambandsAnalyser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            SALSA is a regression-based statistical model that compares each
            school&apos;s actual results against what would be <em>predicted</em>{" "}
            given the school&apos;s student population characteristics. The goal
            is to enable fairer comparisons between schools by accounting for
            differences in student backgrounds.
          </p>
          <p>
            The current model (since 2015) uses these{" "}
            <strong>background factors</strong>:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Parents&apos; education level</strong> (F&ouml;r&auml;ldrarnas
              utbildningsniv&aring;) &mdash; the single strongest predictor. Average
              education on a 1&ndash;3 scale where 3 = university education.
            </li>
            <li>
              <strong>Share of newly arrived students</strong> (Andel
              nyinvandrade) &mdash; students registered in Sweden within the last
              4 years, plus students with unknown background (since 2015).
            </li>
            <li>
              <strong>Share of boys</strong> (Andel pojkar) &mdash; gender
              composition of the student body.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            The model has evolved over time. Before 2013, &ldquo;share born abroad&rdquo;
            and &ldquo;share with foreign background&rdquo; were used instead of
            &ldquo;newly arrived.&rdquo; In 2016, students without ID numbers
            were excluded entirely. The current model (model 3) has an adjusted R&sup2;
            of ~53% for merit values, meaning 53% of variance between schools is
            explained by these background factors alone.
          </p>
        </CardContent>
      </Card>

      {/* Key metrics explained */}
      <Card>
        <CardHeader>
          <CardTitle>Key Metrics Explained</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-[15px] leading-relaxed">
          <div>
            <h3 className="font-semibold text-base mb-1">
              Merit Value (Meritv&auml;rde)
            </h3>
            <p>
              The average grade point total for students completing year 9
              (grundskolan). Calculated from the student&apos;s 16 or 17 best
              subjects. The theoretical maximum is 340 points (17 subjects
              &times; A=20 points).
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              Predicted Value (Modellber&auml;knat v&auml;rde)
            </h3>
            <p>
              What the SALSA regression model predicts a school&apos;s average
              merit value <em>should</em> be, given its student demographics.
              Schools with similar backgrounds get similar predicted values.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              Residual (Residual = Actual &minus; Predicted)
            </h3>
            <p>
              The difference between the school&apos;s actual result and what the
              model predicted. This is the most important metric in SALSA:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <span className="text-green-600 font-medium">
                  Positive residual
                </span>{" "}
                &mdash; the school performed <em>better</em> than predicted.
                Given its student demographics, it achieved higher results than
                the national average of schools with similar backgrounds.
              </li>
              <li>
                <span className="text-red-600 font-medium">
                  Negative residual
                </span>{" "}
                &mdash; the school performed <em>worse</em> than predicted. Its
                results were below what would be expected given its student
                population.
              </li>
              <li>
                <strong>Zero residual</strong> &mdash; the school performed
                exactly as predicted. Its results match the national average for
                schools with the same background factors.
              </li>
            </ul>
            {dist && (
              <p className="mt-3 text-sm text-muted-foreground">
                In {stats?.max_year},{" "}
                <span className="text-green-600 font-medium">
                  {dist.positive_residual_count} schools
                </span>{" "}
                outperformed their prediction and{" "}
                <span className="text-red-600 font-medium">
                  {dist.negative_residual_count} schools
                </span>{" "}
                underperformed.
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-base mb-1">
              Gymnasiet Eligibility (Beh&ouml;righet)
            </h3>
            <p>
              The percentage of students who achieved passing grades in enough
              subjects to be eligible for upper secondary school (gymnasiet).
              SALSA provides both actual and predicted eligibility rates, and a
              residual comparing them.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How to interpret */}
      <Card>
        <CardHeader>
          <CardTitle>How to Interpret the Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-medium text-amber-800 mb-2">
              Important caveats
            </p>
            <ul className="list-disc pl-5 space-y-2 text-amber-900 text-sm">
              <li>
                SALSA measures <em>correlation</em>, not causation. A positive
                residual does not prove a school is &ldquo;better&rdquo; &mdash;
                many factors outside the model (teacher quality, school culture,
                student motivation, cognitive ability) affect results.
              </li>
              <li>
                Year-to-year comparisons should be made cautiously. A
                school&apos;s residual can change because the <em>national</em>{" "}
                average shifted, not because the school itself changed.
              </li>
              <li>
                Schools with very few students (under 15) may have suppressed
                data to protect individual privacy. These are marked with
                &ldquo;..&rdquo; in the original source.
              </li>
              <li>
                The 2016 SALSA population differs from other years: students
                without a personal identity number were excluded that year. This
                can make cross-year comparisons for 2016 less reliable.
              </li>
            </ul>
          </div>
          <p>
            For a meaningful assessment of a school, combine SALSA data with
            other information: Skolverket&apos;s school inspections
            (Skolinspektionen), student and parent surveys, and local knowledge
            about the school environment.
          </p>
        </CardContent>
      </Card>

      {/* Model evolution */}
      <Card>
        <CardHeader>
          <CardTitle>SALSA Model Evolution</CardTitle>
          <CardDescription>
            The background factors have changed over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="text-left py-2 px-3">Model</th>
                  <th scope="col" className="text-left py-2 px-3">Years</th>
                  <th scope="col" className="text-left py-2 px-3">Background Factors</th>
                  <th scope="col" className="text-left py-2 px-3">Key Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Model 1</td>
                  <td className="py-2 px-3">1998&ndash;2012</td>
                  <td className="py-2 px-3">Parents&apos; ed., born abroad, foreign background, boys %</td>
                  <td className="py-2 px-3 text-muted-foreground">Original model</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Model 2</td>
                  <td className="py-2 px-3">2013&ndash;2014</td>
                  <td className="py-2 px-3">Parents&apos; ed., newly arrived, boys %</td>
                  <td className="py-2 px-3 text-muted-foreground">&ldquo;Newly arrived&rdquo; replaces foreign background</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">Model 3</td>
                  <td className="py-2 px-3">2015, 2017&ndash;present</td>
                  <td className="py-2 px-3">Parents&apos; ed., newly arrived (incl. unknown bg), boys %</td>
                  <td className="py-2 px-3 text-muted-foreground">Students with unknown background included as newly arrived</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Model 4</td>
                  <td className="py-2 px-3">2016 only</td>
                  <td className="py-2 px-3">Parents&apos; ed., newly arrived, boys %</td>
                  <td className="py-2 px-3 text-muted-foreground">Students without ID number excluded entirely (refugee wave)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Data captured */}
      <Card>
        <CardHeader>
          <CardTitle>Data Points Captured</CardTitle>
          <CardDescription>
            Every field from the SIRIS SALSA table is stored
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="text-left py-2 px-3">Field</th>
                  <th scope="col" className="text-left py-2 px-3">Swedish Name</th>
                  <th scope="col" className="text-left py-2 px-3">Available</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Year</td><td className="py-1.5 px-3">Verksamhets&aring;r</td><td className="py-1.5 px-3">1998&ndash;2025</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Municipality</td><td className="py-1.5 px-3">Kommun</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">School name</td><td className="py-1.5 px-3">Skolenhet</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Owner type</td><td className="py-1.5 px-3">Huvudman (Kom./Ensk.)</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">Background Factors</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Parents&apos; education</td><td className="py-1.5 px-3">F&ouml;r&auml;ldrarnas utbildningsniv&aring;</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Newly arrived %</td><td className="py-1.5 px-3">Andel nyinvandrade</td><td className="py-1.5 px-3">2013&ndash;2025</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Born abroad %</td><td className="py-1.5 px-3">Andel f&ouml;dda utomlands</td><td className="py-1.5 px-3">1998&ndash;2012</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Foreign background %</td><td className="py-1.5 px-3">Andel utl&auml;ndsk bakgrund</td><td className="py-1.5 px-3">1998&ndash;2012</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Boys %</td><td className="py-1.5 px-3">Andel pojkar</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">Eligibility (godkända betyg i alla ämnen)</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Actual eligible %</td><td className="py-1.5 px-3">Faktiskt v&auml;rde (F)</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Predicted eligible %</td><td className="py-1.5 px-3">Modellber&auml;knat v&auml;rde (B)</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Residual eligible</td><td className="py-1.5 px-3">Residual (R=F&minus;B)</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b bg-muted/30"><td colSpan={3} className="py-1.5 px-3 font-semibold text-muted-foreground">Merit Value (genomsnittligt meritv&auml;rde)</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Actual merit</td><td className="py-1.5 px-3">Faktiskt v&auml;rde (F)</td><td className="py-1.5 px-3">All years</td></tr>
                <tr className="border-b"><td className="py-1.5 px-3 font-medium">Predicted merit</td><td className="py-1.5 px-3">Modellber&auml;knat v&auml;rde (B)</td><td className="py-1.5 px-3">All years</td></tr>
                <tr><td className="py-1.5 px-3 font-medium">Residual merit</td><td className="py-1.5 px-3">Residual (R=F&minus;B)</td><td className="py-1.5 px-3">All years</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: &ldquo;Born abroad&rdquo; and &ldquo;Foreign background&rdquo; were replaced by
            &ldquo;Newly arrived&rdquo; in 2013 when the SALSA model was updated.
            Both sets of fields are preserved in this explorer for historical analysis.
            The merit value calculation changed in 2015 from max 16 to max 17 subjects.
          </p>
        </CardContent>
      </Card>

      {/* Features of this explorer */}
      <Card>
        <CardHeader>
          <CardTitle>Explorer Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[15px] leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                National overview with key insights, trend charts, top/bottom
                performers, and municipality rankings for the latest year.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Municipality Browser</h4>
              <p className="text-sm text-muted-foreground">
                Browse all municipalities and their schools. Each municipality
                page shows trend charts and a sortable school table with merit
                values and residuals.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">School Detail</h4>
              <p className="text-sm text-muted-foreground">
                Deep dive into any school: merit trend, residual history,
                eligibility rates, demographic breakdown, and the full data
                table across all years.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Search</h4>
              <p className="text-sm text-muted-foreground">
                Find any school by name or municipality. Results show latest
                merit values and residuals at a glance.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">Compare</h4>
              <p className="text-sm text-muted-foreground">
                Search and select up to 5 schools for side-by-side comparison
                with overlay charts and detailed data tables.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-1">National Trends</h4>
              <p className="text-sm text-muted-foreground">
                See how national averages for merit values, eligibility rates,
                and the number of schools have evolved from 1998 to the present.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data source & technical */}
      <Card>
        <CardHeader>
          <CardTitle>Data Source &amp; Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] leading-relaxed">
          <p>
            All data is sourced from{" "}
            <a
              href="https://siris.skolverket.se/siris/f?p=SIRIS:164:0::NO:::"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              SIRIS (Skolverkets Internetbaserade Resultat- och
              kvalitetsInformationsSystem)
            </a>
            , which is Skolverket&apos;s official public database for school
            statistics.
          </p>
          <p>
            The data was collected programmatically using a custom scraper that
            navigates the SIRIS web application, selects each municipality and
            its schools, and extracts the SALSA table data. Rate limiting and
            polite delays were used to avoid overloading the server.
          </p>
          <p className="text-sm text-muted-foreground">
            This project is not affiliated with or endorsed by Skolverket. The
            data is public information made available by Skolverket for
            transparency and research purposes. This explorer simply makes it
            easier to browse and analyze.
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>OWASP Top 10 compliant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-[15px] leading-relaxed">
          <ul className="list-disc pl-6 space-y-1.5 text-sm">
            <li>
              <strong>Injection prevention</strong> &mdash; all SQL queries use
              parameterized statements, LIKE metacharacters are escaped, URL
              parameters are validated against strict regex patterns
            </li>
            <li>
              <strong>Security headers</strong> &mdash; Content-Security-Policy,
              X-Frame-Options DENY, X-Content-Type-Options nosniff,
              Referrer-Policy, Permissions-Policy
            </li>
            <li>
              <strong>Rate limiting</strong> &mdash; API endpoints enforce 60
              requests per minute per IP to prevent abuse
            </li>
            <li>
              <strong>Read-only database</strong> &mdash; SQLite opened in
              read-only mode; even a successful injection cannot modify data
            </li>
            <li>
              <strong>No secrets</strong> &mdash; no authentication, no PII, no
              API keys. All data is publicly sourced government statistics
            </li>
            <li>
              <strong>Structured logging</strong> &mdash; all API requests and
              errors logged as JSON for monitoring and audit
            </li>
            <li>
              <strong>Docker hardening</strong> &mdash; non-root user, npm ci
              for reproducible builds, read-only data volume mount
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Open source */}
      <Card>
        <CardHeader>
          <CardTitle>Open Source</CardTitle>
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
            This project is fully open source. The codebase includes:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>
              <strong>Scraper</strong> &mdash; Node.js HTTP client that
              navigates the SIRIS Oracle APEX application, with rate limiting,
              retries, checkpointing, and resume support
            </li>
            <li>
              <strong>Database</strong> &mdash; SQLite with 21,000+ records
              across 28 years with indexes
            </li>
            <li>
              <strong>Explorer</strong> &mdash; Next.js 16 with server
              components, Recharts visualizations, and shadcn/ui
            </li>
            <li>
              <strong>Tests</strong> &mdash; 100+ integration tests against real
              APIs and a real server, zero mocking
            </li>
            <li>
              <strong>Docker</strong> &mdash; multi-stage builds with health
              checks
            </li>
            <li>
              <strong>Linting</strong> &mdash; strict ESLint with security rules
              (no-eval, no-implied-eval, no-new-func, react/no-danger)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
