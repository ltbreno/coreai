"use client"

import React, { forwardRef } from "react"
import type { ReportData, StatusType } from "@/types/report"

interface ReportTemplateProps {
  data: ReportData
}

// ── Status badge colours ───────────────────────────────────────────────────
const STATUS_STYLE: Record<StatusType, { bg: string; color: string }> = {
  Adequado:       { bg: "#D6EBD6", color: "#3A6B3A" },
  Baixo:          { bg: "#F5E6D8", color: "#8B4A1A" },
  "Muito baixo":  { bg: "#F5D8C8", color: "#7A2A0A" },
  "Baixo risco":  { bg: "#EAEAE0", color: "#5A5A48" },
  Alto:           { bg: "#FFF0CC", color: "#7A5A00" },
  "Muito alto":   { bg: "#F5CCCC", color: "#7A1A1A" },
}

// ── CORE SCORE bar segment definitions ────────────────────────────────────
// Each entry: [percentage-width, hex-color]
type Seg = [number, string]

const BAR_SEGMENTS: Record<string, Seg[]> = {
  Metabolismo:     [[10,"#C8A84A"],[22,"#8AAA6A"],[40,"#5A7A4A"],[18,"#8AAA6A"],[10,"#C84040"]],
  "Inflamação":    [[10,"#5A7A4A"],[28,"#C07060"],[5,"#D0C8C0"],[30,"#C8A84A"],[27,"#D8D0C8"]],
  Micronutrientes: [[18,"#C8A84A"],[42,"#6A8A5A"],[40,"#D8D0C8"]],
  Hormonal:        [[8,"#C8A84A"],[10,"#7A9A6A"],[62,"#5A7A4A"],[12,"#C8A84A"],[8,"#D8D0C8"]],
}
const DEFAULT_SEGMENTS: Seg[] = [
  [15,"#C8A84A"],[45,"#6A8A5A"],[25,"#8AAA6A"],[15,"#C84040"],
]

function getSegments(categoryName: string): Seg[] {
  for (const key of Object.keys(BAR_SEGMENTS)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) return BAR_SEGMENTS[key]
  }
  return DEFAULT_SEGMENTS
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusType }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE["Baixo risco"]
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 14px",
      borderRadius: "7px",
      fontSize: "12px",
      fontWeight: 500,
      background: s.bg,
      color: s.color,
      whiteSpace: "nowrap",
      letterSpacing: "0.2px",
    }}>
      {status}
    </span>
  )
}

function SegmentedBar({ score, categoryName }: { score: number; categoryName: string }) {
  const segs = getSegments(categoryName)
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div style={{ position: "relative", height: "10px", width: "100%", marginTop: "6px" }}>
      {/* Segments */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: "5px", overflow: "hidden",
        display: "flex",
      }}>
        {segs.map(([w, c], i) => (
          <div key={i} style={{ width: `${w}%`, background: c, flexShrink: 0 }} />
        ))}
      </div>
      {/* Indicator dot */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: `${pct}%`,
        transform: "translate(-50%, -50%)",
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#FFFFFF",
        boxShadow: "0 1px 4px rgba(0,0,0,0.30)",
        border: "1.5px solid rgba(0,0,0,0.08)",
        zIndex: 2,
      }} />
    </div>
  )
}

function DonutChart({
  overall,
  categories,
}: {
  overall: number
  categories: { name: string; score: number }[]
}) {
  const COLORS = ["#5A7A4A", "#C07060", "#C8A84A", "#8A9A6A"]
  const r = 52, cx = 68, cy = 68
  const circ = 2 * Math.PI * r
  const total = categories.reduce((s, c) => s + c.score, 0) || 1
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
      d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x2},${y2} Z`,
      color: COLORS[i % COLORS.length],
    }
  })

  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      {slices.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity={0.88} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.60} fill="#F8F4EF" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="22" fontWeight="700" fill="#1A1A1A">
        {overall}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fill="#7A7268">/100</text>
      <text x={cx} y={cy + 23} textAnchor="middle" fontSize="7" fill="#7A7268" letterSpacing="0.8">
        CORE SCORE
      </text>
    </svg>
  )
}

// ── Main template ──────────────────────────────────────────────────────────
const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(({ data }, ref) => {
  const { patient, nutritionalStatus, coreScore, interpretation } = data
  const hasPatient = !!patient?.name
  const today = new Date().toLocaleDateString("pt-BR")

  return (
    <div
      ref={ref}
      style={{
        width: "794px",
        background: "#F2EDE7",
        padding: "32px",
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Card */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "44px 52px 52px",
        boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      }}>

        {/* ── Logo ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "linear-gradient(140deg, #B0A898 0%, #6A5E52 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#F5F0EB", fontSize: "13px", fontWeight: "800", letterSpacing: "0.5px",
            flexShrink: 0,
          }}>
            IA
          </div>
          <div>
            <div style={{ fontSize: "19px", fontWeight: "800", letterSpacing: "1.5px", color: "#1A1A1A", lineHeight: 1 }}>
              CORE IA
            </div>
            <div style={{ fontSize: "8px", color: "#9A928A", letterSpacing: "2.5px", textTransform: "uppercase", marginTop: "3px" }}>
              INTELIGÊNCIA &amp; SAÚDE
            </div>
          </div>
        </div>

        <div style={{ height: "1px", background: "#E0D8D0", marginBottom: "22px" }} />

        {/* ── Title ── */}
        <h1 style={{
          fontSize: "22px", fontWeight: "800", letterSpacing: "0.8px",
          color: "#1A1A1A", margin: "0 0 16px",
        }}>
          RELATÓRIO CORE AI
        </h1>

        {/* ── Patient info ── */}
        {hasPatient && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: "13px", color: "#3A3A3A" }}>
                Paciente: <strong>{patient!.name}</strong>
              </div>
              {patient!.age && (
                <div style={{ fontSize: "13px", color: "#5A5A5A" }}>{patient!.age} anos</div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
              <div style={{ fontSize: "12px", color: "#7A7268" }}>
                Data da coleta: <strong>{patient!.collectionDate ?? today}</strong>
              </div>
              <div style={{ fontSize: "12px", color: "#7A7268" }}>
                Data da coleta: <strong>{patient!.collectionDate ?? today}</strong>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: "1px", background: "#E0D8D0", marginBottom: "24px" }} />

        {/* ── Status Nutricional ── */}
        <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A", margin: "0 0 18px" }}>
          Status Nutricional
        </h2>

        <div style={{ height: "1px", background: "#E0D8D0", marginBottom: "18px" }} />

        {nutritionalStatus.flatMap((cat) => cat.items).map((item, i, arr) => (
          <div key={i}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 0",
            }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1A1A1A" }}>
                  {item.name}
                </div>
                {item.value && (
                  <div style={{ fontSize: "11px", color: "#7A7268", marginTop: "2px" }}>
                    {item.value} {item.unit}
                  </div>
                )}
              </div>
              <StatusBadge status={item.status} />
            </div>
            {i < arr.length - 1 && (
              <div style={{ height: "1px", background: "#EDE8E2" }} />
            )}
          </div>
        ))}

        <div style={{ height: "1px", background: "#E0D8D0", margin: "18px 0 24px" }} />

        {/* ── CORE SCORE ── */}
        <h2 style={{
          fontSize: "16px", fontWeight: "800", letterSpacing: "0.6px",
          color: "#1A1A1A", margin: "0 0 18px",
        }}>
          CORE SCORE
        </h2>

        <div style={{ height: "1px", background: "#E0D8D0", marginBottom: "20px" }} />

        {/* If we have interpretation data, use 3-column layout; otherwise single column */}
        {interpretation.positives.length > 0 || interpretation.attentionPoints.length > 0 ? (
          <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
            {/* Scores list */}
            <div style={{ flex: "0 0 220px" }}>
              {coreScore.categories.map((cat, i) => (
                <div key={i} style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#2A2A2A" }}>
                      {cat.name}
                    </span>
                    <span style={{ fontSize: "13px", color: "#3A3A3A" }}>
                      <strong style={{ fontSize: "14px" }}>{cat.score}</strong>
                      <span style={{ color: "#9A928A", fontSize: "11px" }}> / 100</span>
                    </span>
                  </div>
                  <SegmentedBar score={cat.score} categoryName={cat.name} />
                </div>
              ))}
            </div>

            {/* Donut */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 136px" }}>
              <DonutChart overall={coreScore.overall} categories={coreScore.categories} />
            </div>

            {/* Interpretação + Pontos */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              {interpretation.positives.length > 0 && (
                <div style={{
                  background: "#EDE8E2", borderRadius: "10px", padding: "14px 16px",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1A1A1A", marginBottom: "8px" }}>
                    Interpretação Geral CORE AI
                  </div>
                  {interpretation.positives.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: "7px", marginBottom: "5px", alignItems: "flex-start" }}>
                      <span style={{ color: "#5A8A5A", fontSize: "12px", marginTop: "1px", flexShrink: 0 }}>✓</span>
                      <span style={{ fontSize: "11px", color: "#4A4A4A", lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}

              {interpretation.attentionPoints.length > 0 && (
                <div style={{
                  background: "#EDE8E2", borderRadius: "10px", padding: "14px 16px",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: "#1A1A1A", marginBottom: "8px" }}>
                    Ponto de atenção:
                  </div>
                  {interpretation.attentionPoints.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: "7px", marginBottom: "5px", alignItems: "flex-start" }}>
                      <span style={{
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: "#C8A84A", flexShrink: 0, marginTop: "3px",
                      }} />
                      <span style={{ fontSize: "11px", color: "#4A4A4A", lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Simple single-column scores when no interpretation */
          <div>
            {coreScore.categories.map((cat, i) => (
              <div key={i} style={{ marginBottom: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#2A2A2A" }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: "14px", color: "#3A3A3A" }}>
                    <strong style={{ fontSize: "16px" }}>{cat.score}</strong>
                    <span style={{ color: "#9A928A", fontSize: "12px" }}> / 100</span>
                  </span>
                </div>
                <SegmentedBar score={cat.score} categoryName={cat.name} />
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: "44px" }}>
          <div style={{ height: "1px", background: "#E0D8D0", marginBottom: "14px" }} />
          <p style={{ fontSize: "11px", color: "#9A928A", textAlign: "center", margin: 0 }}>
            CORE AI é uma ferramenta de apoio ao profissional
          </p>
        </div>
      </div>
    </div>
  )
})

ReportTemplate.displayName = "ReportTemplate"
export default ReportTemplate
