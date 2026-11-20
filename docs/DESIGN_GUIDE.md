# Design Guide: Emergency Path Finder UI/UX

This document outlines the design principles behind the Emergency Path Finder interface, specifically addressing how to avoid common AI-generated design tropes and maintain an authentic, high-utility emergency operations aesthetic.

---

## 1. The 10 AI Design Tropes & Our Tactical Solutions

| # | AI-Generated Trope | Problem | Emergency Path Finder Solution |
|---|---|---|---|
| **1** | **Too Many Font Styles** | Mixed serifs, cursive accents, and mismatched weights create visual chaos. | **Strict 2-Family Scale**: System UI Sans (`Inter / Segoe UI`) for labels & UI, paired with tabular monospaced numbers (`Consolas / monospace`) for coordinates, speeds, and timestamps. |
| **2** | **No Recognizable Visual Identity** | Generic purple/indigo gradients that look like every SaaS landing page. | **Tactical CAD Identity**: Slate/obsidian command palette, emergency signal red (`#dc2626`) for triage alerts, and medical emerald (`#059669`) for bed availability. |
| **3** | **Random Colored / Italic Words** | Arbitrary words highlighted in titles with no real hierarchy. | **Semantic Status Highlighting**: Titles remain clean and uniform. Colors are strictly reserved for live operational telemetry (`LIVE DISPATCH`, `INCIDENT REPORTED`). |
| **4** | **No Bold Custom Graphics** | Generic 3D cartoon people with laptops or abstract AI gradients. | **Functional Telemetry Graphics**: Live SVG speedometer dials, dark radar tactical maps, and live GPS compass tracking cards. |
| **5** | **Unnecessary Eyebrow Labels** | Tiny uppercase tags (`OUR FEATURES`, `BENEFITS`) above every heading. | **Operational Status Badges Only**: Micro-badges indicate system states (`OSRM ONLINE`, `TRAUMA LEVEL 1`, `GPS LOCKED`), never marketing boilerplate. |
| **6** | **Text-Only Sections With No Rhythm** | Centered blocks of text with identical spacing and no visual concept. | **High-Density Manifests**: Split-screen command centers, side-by-side Dijkstra vs. A* tables, and tabular patient transfer manifests. |
| **7** | **Layout Inconsistencies** | Margins, paddings, and alignment change randomly between pages. | **Rigid 8pt Spatial Grid**: Consistent spacing tokens (`gap-3`, `gap-4`, `p-4`, `p-6`) across both desktop and mobile viewports. |
| **8** | **Generic Cards Repeated** | 3 identical cards with a generic icon, title, and short paragraph. | **Custom Purpose-Built Panels**: Dynamic weather bar, hospital bed capacity steppers, incident injection drawers, and green corridor controls. |
| **9** | **Inconsistent Component Styling** | Mismatched border-radii (`rounded-3xl` mixed with `rounded-sm`) and shadow styles. | **Standardized Geometric Tokens**: Consistent `rounded-lg` (8px) for containers and `rounded-md` (6px) for buttons/inputs with clean slate borders. |
| **10** | **Nothing Feels Intentional or Memorable** | Safe, clean, but sterile and lacking domain authenticity. | **Designed for Paramedics & Dispatchers**: High-contrast dark and light modes, instant legibility under sunlight or night driving conditions, and real-time IST clock. |

---

## 2. Screenshots for GitHub Previews

High-resolution captures have been generated in the project's `./screenshots` directory:

- **Desktop Console (1440 × 900)**: [`screenshots/preview-desktop.png`](../screenshots/preview-desktop.png)
- **Samsung Mobile CAD (412 × 915)**: [`screenshots/preview-samsung-mobile.png`](../screenshots/preview-samsung-mobile.png)
