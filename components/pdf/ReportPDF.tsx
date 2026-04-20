import React from "react"
import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Path,
  Circle,
  StyleSheet,
} from "@react-pdf/renderer"
import type { ReportData, StatusType } from "@/types/report"

// ── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#F2EDE7",
  card: "#FFFFFF",
  text: "#1A1A1A",
  sub: "#5A5A5A",
  muted: "#9A928A",
  divider: "#E0D8D0",
  divider2: "#EDE8E2",
  box: "#EDE8E2",
}

const STATUS_COLORS: Record<StatusType, { bg: string; text: string }> = {
  Adequado:      { bg: "#D6EBD6", text: "#3A6B3A" },
  Baixo:         { bg: "#F5E6D8", text: "#8B4A1A" },
  "Muito baixo": { bg: "#F5D8C8", text: "#7A2A0A" },
  "Baixo risco": { bg: "#EAEAE0", text: "#5A5A48" },
  Alto:          { bg: "#FFF0CC", text: "#7A5A00" },
  "Muito alto":  { bg: "#F5CCCC", text: "#7A1A1A" },
}

type Seg = [number, string]
const BAR_SEGS: Record<string, Seg[]> = {
  Metabolismo:     [[10,"#C8A84A"],[22,"#8AAA6A"],[40,"#5A7A4A"],[18,"#8AAA6A"],[10,"#C84040"]],
  Inflamação:      [[10,"#5A7A4A"],[28,"#C07060"],[5,"#D0C8C0"],[30,"#C8A84A"],[27,"#D8D0C8"]],
  Micronutrientes: [[18,"#C8A84A"],[42,"#6A8A5A"],[40,"#D8D0C8"]],
  Hormonal:        [[8,"#C8A84A"],[10,"#7A9A6A"],[62,"#5A7A4A"],[12,"#C8A84A"],[8,"#D8D0C8"]],
}
const DEFAULT_SEGS: Seg[] = [[15,"#C8A84A"],[45,"#6A8A5A"],[25,"#8AAA6A"],[15,"#C84040"]]

function getSegs(name: string): Seg[] {
  for (const k of Object.keys(BAR_SEGS)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return BAR_SEGS[k]
  }
  return DEFAULT_SEGS
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:         { backgroundColor: C.bg, padding: 24, fontFamily: "Helvetica" },
  card:         { backgroundColor: C.card, borderRadius: 10, padding: "22 34", marginBottom: 10 },
  row:          { flexDirection: "row", alignItems: "center" },
  between:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  divider:      { height: 1, backgroundColor: C.divider, marginVertical: 13 },
  divider2:     { height: 1, backgroundColor: C.divider2 },
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 0.4, color: C.text },
})

// ── Sub-components ───────────────────────────────────────────────────────────
function Badge({ status }: { status: StatusType }) {
  const col = STATUS_COLORS[status] ?? STATUS_COLORS["Baixo risco"]
  return (
    <View style={{ backgroundColor: col.bg, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, color: col.text, fontFamily: "Helvetica-Bold" }}>{status}</Text>
    </View>
  )
}

function SegBar({ score, name }: { score: number; name: string }) {
  const segs = getSegs(name)
  const pct = Math.min(100, Math.max(0, score))
  return (
    <View style={{ position: "relative", height: 8, marginTop: 5, borderRadius: 4, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        {segs.map(([w, c], i) => (
          <View key={i} style={{ width: `${w}%`, backgroundColor: c }} />
        ))}
      </View>
      <View style={{
        position: "absolute",
        left: `${pct}%`,
        top: -2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#FFFFFF",
        border: "1.5pt solid #D0C8C0",
        marginLeft: -6,
      }} />
    </View>
  )
}

function DonutChart({ overall, categories }: { overall: number; categories: { name: string; score: number }[] }) {
  const COLORS = ["#5A7A4A", "#C07060", "#C8A84A", "#8A9A6A"]
  const r = 46; const cx = 60; const cy = 60
  const total = categories.reduce((acc, c) => acc + c.score, 0) || 1
  let angle = -Math.PI / 2
  const slices = categories.map((cat, i) => {
    const frac = cat.score / total
    const sweep = frac * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    angle += sweep
    const x2 = cx + r * Math.cos(angle)
    const y2 = cy + r * Math.sin(angle)
    return {
      d: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`,
      color: COLORS[i % COLORS.length],
    }
  })
  const inner = r * 0.60

  return (
    <View style={{ width: 120, height: 120, position: "relative" }}>
      <Svg width="120" height="120" viewBox="0 0 120 120">
        {slices.map((sl, i) => <Path key={i} d={sl.d} fill={sl.color} opacity={0.88} />)}
        <Circle cx={cx} cy={cy} r={inner} fill={C.bg} />
      </Svg>
      <View style={{
        position: "absolute",
        top: cy - inner, left: cx - inner,
        width: inner * 2, height: inner * 2,
        alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: C.text, lineHeight: 1 }}>{overall}</Text>
        <Text style={{ fontSize: 8, color: C.muted, marginTop: 2 }}>/100</Text>
        <Text style={{ fontSize: 7, color: C.muted, letterSpacing: 0.5, marginTop: 1 }}>CORE SCORE</Text>
      </View>
    </View>
  )
}

// ── Document ─────────────────────────────────────────────────────────────────
export function ReportPDF({ data }: { data: ReportData }) {
  const { patient, nutritionalStatus, coreScore, interpretation } = data
  const today = new Date().toLocaleDateString("pt-BR")
  const allItems = nutritionalStatus.flatMap((c) => c.items)
  const hasInterp = interpretation.positives.length > 0 || interpretation.attentionPoints.length > 0

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── keeps logo + title + patient always together */}
        <View style={s.card} wrap={false}>
          <View style={[s.row, { marginBottom: 14 }]}>
            <View style={{
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: "#7A6E62",
              alignItems: "center", justifyContent: "center", marginRight: 12,
            }}>
              <Text style={{ color: "#F5F0EB", fontSize: 11, fontFamily: "Helvetica-Bold" }}>IA</Text>
            </View>
            <View>
              <Text style={{ fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, color: C.text }}>CORE IA</Text>
              <Text style={{ fontSize: 7, color: C.muted, letterSpacing: 2, marginTop: 2 }}>INTELIGÊNCIA & SAÚDE</Text>
            </View>
          </View>

          <View style={s.divider} />

          <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 0.8, color: C.text, marginBottom: 12 }}>
            RELATÓRIO CORE AI
          </Text>

          {patient?.name && (
            <View>
              <View style={s.between}>
                <Text style={{ fontSize: 11, color: C.sub }}>
                  Paciente: <Text style={{ fontFamily: "Helvetica-Bold" }}>{patient.name}</Text>
                </Text>
                {patient.age && <Text style={{ fontSize: 11, color: C.sub }}>{patient.age} anos</Text>}
              </View>
              <View style={{ marginTop: 3 }}>
                <Text style={{ fontSize: 10, color: C.muted }}>
                  Data: <Text style={{ fontFamily: "Helvetica-Bold" }}>{patient.collectionDate ?? today}</Text>
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Status Nutricional ── each row is atomic, section can flow across pages */}
        <View style={s.card}>
          <View style={s.between}>
            <Text style={s.sectionTitle}>Status Nutricional</Text>
          </View>
          <View style={s.divider} />

          {allItems.map((item, i) => (
            // wrap={false} keeps name+value+badge in same page slice
            <View key={i} wrap={false}>
              <View style={[s.between, { paddingVertical: 9 }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.text }}>{item.name}</Text>
                  {item.value && (
                    <Text style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{item.value} {item.unit}</Text>
                  )}
                </View>
                <Badge status={item.status} />
              </View>
              {i < allItems.length - 1 && <View style={s.divider2} />}
            </View>
          ))}
        </View>

        {/* ── CORE SCORE ── */}
        <View style={s.card}>
          <Text style={[s.sectionTitle, { letterSpacing: 0.6, marginBottom: 0 }]}>CORE SCORE</Text>
          <View style={s.divider} />

          {hasInterp ? (
            // 3-column layout: keep the whole thing together; if it doesn't fit it moves to next page
            <View wrap={false} style={[s.row, { alignItems: "flex-start", gap: 18 }]}>
              {/* Scores list */}
              <View style={{ flex: 1 }}>
                {coreScore.categories.map((cat, i) => (
                  <View key={i} style={{ marginBottom: 14 }}>
                    <View style={s.between}>
                      <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.sub }}>{cat.name}</Text>
                      <Text style={{ fontSize: 11, color: C.sub }}>
                        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13 }}>{cat.score}</Text> / 100
                      </Text>
                    </View>
                    <SegBar score={cat.score} name={cat.name} />
                  </View>
                ))}
              </View>

              {/* Donut */}
              <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 4 }}>
                <DonutChart overall={coreScore.overall} categories={coreScore.categories} />
              </View>

              {/* Interpretation */}
              <View style={{ flex: 1, gap: 10 }}>
                {interpretation.positives.length > 0 && (
                  <View style={{ backgroundColor: C.box, borderRadius: 8, padding: 12 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 6 }}>
                      Interpretação Geral CORE AI
                    </Text>
                    {interpretation.positives.map((p, i) => (
                      <View key={i} style={[s.row, { marginBottom: 4, alignItems: "flex-start" }]}>
                        <Text style={{ fontSize: 10, color: "#5A8A5A", marginRight: 5, marginTop: 1 }}>✓</Text>
                        <Text style={{ fontSize: 9, color: C.sub, flex: 1, lineHeight: 1.5 }}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {interpretation.attentionPoints.length > 0 && (
                  <View style={{ backgroundColor: C.box, borderRadius: 8, padding: 12 }}>
                    <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 6 }}>
                      Ponto de atenção:
                    </Text>
                    {interpretation.attentionPoints.map((p, i) => (
                      <View key={i} style={[s.row, { marginBottom: 4, alignItems: "flex-start" }]}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#C8A84A", marginRight: 6, marginTop: 2 }} />
                        <Text style={{ fontSize: 9, color: C.sub, flex: 1, lineHeight: 1.5 }}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ) : (
            // Simple single-column scores — each bar stays together
            <View>
              {coreScore.categories.map((cat, i) => (
                <View key={i} wrap={false} style={{ marginBottom: 18 }}>
                  <View style={[s.between, { marginBottom: 2 }]}>
                    <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.sub }}>{cat.name}</Text>
                    <Text style={{ fontSize: 12, color: C.sub }}>
                      <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 15 }}>{cat.score}</Text> / 100
                    </Text>
                  </View>
                  <SegBar score={cat.score} name={cat.name} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View wrap={false} style={{ marginTop: 4 }}>
          <View style={s.divider} />
          <Text style={{ fontSize: 9, color: C.muted, textAlign: "center" }}>
            CORE AI é uma ferramenta de apoio ao profissional
          </Text>
        </View>

      </Page>
    </Document>
  )
}
