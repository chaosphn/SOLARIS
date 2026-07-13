# PPA Analysis — Session Handoff

เอกสารส่งต่องานให้แชทใหม่ อ่านแล้วทำงานต่อได้เหมือนเดิม อัปเดตล่าสุด: 2026-07-08

---

## 0. Environment / วิธีทำงาน

- **Repo**: `C:\Users\phum7\Documents\BOONRAWD_V2\solaris-app` (Angular) — branch `boonrawd_v2`, main = `main`
- **OS**: Windows, shell = PowerShell (มี Bash tool ด้วย). JSON config เป็น **utf-8 with BOM** (อ่านด้วย `utf-8-sig` ใน python)
- **Build/verify** (จากโฟลเดอร์ `solaris-app`): `npx ng build --configuration development` — ต้องผ่านทุกครั้งก่อนบอกว่าเสร็จ
- **Angular แบบเก่า**: `standalone: false` + NgModules, lazy routes ใน `src/app/app.routes.ts` (children ใต้ path `main`)
- **ngrx store**: ไม่มี effects — pattern คือ component/loader fetch เอง แล้ว `dispatch(*Success)` cache ลง store + เช็ค `timestamp` freshness
- **Charts**: Highcharts ผ่าน `<app-highchart [chartParameter]="...">` (component ต้องมี xAxis+yAxis เสมอ → pie ใช้ไม่ได้ ให้ทำ SVG donut เอง)
- **Signals**: ใช้ `signal` + `computed` + `toSignal` (จาก `@angular/core/rxjs-interop`) อ่าน store

## 1. สไตล์การทำงานของ user (สำคัญมาก)

- **คุยไทย** ตรง ๆ กันเอง feedback แรง/ห้วนได้ — แก้ตามไม่ต้องอธิบายเยอะ
- **ก่อนทำหน้าใหม่**: ออกแบบ **mockup ก่อน** ด้วย `mcp__visualize__show_widget` (โทน dark ตามธีมแอป) ให้ user เคาะก่อน แล้วค่อย implement
- **user ชอบถาม "ลิสค่าทั้งหมดในหน้านี้ว่าคืออะไร มาจากไหน"** เพื่อตรวจความถูกต้อง → ต้องพร้อมกาง ค่า/สูตร/ที่มา ทุกตัว
- **config-driven**: tag ที่จะอ่านให้ไว้ใน config JSON เสมอ (ห้าม hardcode)
- **shared state ข้ามหน้า = ngrx store** (ไม่ใช่ service ถือ state)
- **layout = grid-template-areas**
- **navbar user จัดการเอง** (แค่บอก path)
- verify ด้วย ng build ทุกครั้ง

## 2. ธีม / convention สี

ใช้ CSS var เสมอ: `--card-bg` `--primary-bg` `--border-color` `--secondary-txt` `--primary-txt` `--stack-bg` `--thead-bg` `--trow-bg` `--trow-border` `--active-txt` `--chart-brd` `--chart-tlp`
**ค่าจริงธีม dark** (`src/styles/themes/dark-theme.scss`): main-bg `#16171B` · card-bg `#1F2125` · primary-bg `#292B2F` · primary-txt `#F5F7FB` · secondary-txt `#667079` · **active-txt `#E4B61A`** (เหลืองทอง = ค่าหลัก/PPA) · highlight `#FBE134` · border-color `#485057` · thead-bg `#24292D` · trow-border `#485057` · chart-brd `#2d3136` · stack-bg `#3B444D` · **radius การ์ด = 4px**
สี hardcode accent ที่ใช้ประจำ: เขียว `#4CAF82` (ดี/ผ่าน) · แดง/coral `#E05D4E` (แย่/ขาด) · ฟ้า `#4DA3FF` (info/YTD/Floating)
**⚠️ mockup ต้องใช้ค่าจริงพวกนี้** (อย่าเดาสีเข้มกว่า/เหลือง #FBE134) — KPI = border-top 2px accent, card-head = border-left 3px active-txt
card head = แถบซ้าย `border-left: 3px solid var(--active-txt)`

## 3. Data layer กลาง (ngrx `ppa` slice) — ใช้ร่วม revenue + energy-delivery

**ยิง API ครั้งเดียว cache ใน store, สลับหน้าภายใน 2 นาทีไม่ยิงซ้ำ**

- `features/central/models/ppa-state.model.ts` — `PpaStateModel { siteList, billingConfigs, slaData, realtimeData, monthlyEnergy, timestamp }`
- `features/central/store/actions/ppa.action.ts` · `reducers/ppa.reducer.ts` · `selectors/ppa.selector.ts`
- ลงทะเบียน `ppa: ppaReducer` ใน `src/app/store/app.state.ts`
- **`features/central/services/ppa-data-loader.ts`** (`providedIn: 'root'`): `ensureLoaded(force?)` — เช็ค timestamp (fresh < 2 นาที = ข้าม), inflight guard กัน 2 หน้าเรียกพร้อมกัน, โหลด plants→siteList / billing / sla / realtime / monthlyEnergy แล้ว dispatch
- **config รวม**: `src/assets/central/ppa/configurations/ppa.config.json`
  - `realtimeConfig`: AVAI, PR_MONTH (tag = `{SITE}.CALC.AVAI` ฯลฯ, `{SITE}` แทนด้วย siteId)
  - `historianConfig`: WH_MONTH, `StartTime: "BOM"`
- **วิธีอ่านข้อมูล (สำคัญ — user กำหนดเอง)**:
  - `monthlyEnergy[s][m]` = อ่าน `{SITE}.CALC.WH_MONTH` ผ่าน **getAtTime** ที่ **BOM** ของแต่ละเดือน (ยิง parallel ต่อเดือน) — เร็วกว่า gethistorian (user ยืนยันใช้ getAtTime)
  - SLA อ่านปีปัจจุบันผ่าน `findSlaByDate({start:`${y-1}-12-31`, end:`${y}-12-31`})` แล้ว filter `getFullYear()===y` (timestamp เก็บที่ต้นปี local = ปลายปีก่อน UTC)
  - realtime key ใน store = `` `${siteId}_${Title}` `` เช่น `KKB_AVAI`, `KKB_PR_MONTH`
- **หน้าที่ใช้ store**: อ่านผ่าน `toSignal(this.store.select(selectPpa...), { initialValue })`, `ngOnInit` เรียก `ppaLoader.ensureLoaded()`

## 4. Model helpers (แชร์)

- `models/contract.model.ts` → **`parseContactCost(type, cost, date)`** แปลง `contactCost`:
  - PPA (schedule): `"01/2026:3.44, 01/2027:3.47, ..."` → rate งวดปีที่ active ณ date
  - FLOATING: `"01:3.14, 02:3.09, ..."` → **rate = เฉลี่ยค่าไฟ 4 เดือนของช่วงก่อนหน้า** (Jan–Apr ใช้เฉลี่ย Sep–Dec, May–Aug ใช้ Jan–Apr, Sep–Dec ใช้ May–Aug) คืน `currentRate/nextRate/progress/remainingYears` ฯลฯ
- `models/revenue-performance.model.ts` → **`rateForMonth(type, cost, year, m)`** = `parseContactCost(..., กลางเดือน m).currentRate` · `MONTH_LABELS` (Jan..Dec)
- `models/energy-delivery.model.ts` → `complianceStatus()`, `heatColor()`, interfaces

## 5. หน้าที่ทำเสร็จแล้ว (กลุ่ม PPA Analysis)

### 5.1 Contract Overview — `/main/contract` ✅
`pages/contract/` (ยัง **fetch เอง ไม่ใช้ ppa store** — ทำก่อน refactor; ดึง plants/billing/sla + WH_MONTH & **WH_YEAR** ผ่าน getAtTime)
- Top KPI 5 + ตารางรายสัญญา (คลิกดู detail รายตัว: กราฟ tariff, workflow) + 3 summary card (Coverage donut / Revenue by type / **Warranty Delivery this year** = energy_delivery×tariff, produced YTD จาก WH_YEAR อ่านที่ **BOY**)

### 5.2 Revenue Performance — `/main/revenue` ✅ (ใช้ ppa store)
`pages/revenue-performance/` + `revenue-performance.model.ts`
- **Target = warranty energy (SLA `energy_delivery`) / 12 × tariff รายเดือน**
- KPI 6: This month / YTD / Achievement / Annual Forecast / Revenue at Risk / Blended Tariff
- กราฟ: Monthly Actual+**Forecast**+Target (Highcharts) · Revenue by site (สีตาม **PR_MONTH**: >75 เขียว, <30 แดง, กลางเหลือง; **ทุก site เรียง desc, ไม่มี=0**) · Cumulative vs Plan
- Variance Decomposition (waterfall: Volume vs Price) · Revenue Mix donut · Site Matrix + sparkline · Trend Analysis
- **Forecast** = เดือนอนาคตเท่านั้น = `target × ratio` โดย **ratio จากเดือนที่จบแล้ว** (ไม่รวมเดือนปัจจุบัน) — **ห้ามใช้ WH_EXPECT** (เป็นค่า expected จากแสง ไม่มีค่าอนาคต)
- layout grid-template-areas (12 คอลัมน์)

### 5.3 Energy Delivery Compliance — `/main/energy-delivery` ✅ (ใช้ ppa store)
`pages/energy-delivery/` + `energy-delivery.model.ts`
- **contracted = energy_delivery/12** (flat), **actual = monthlyEnergy**, achievement = actual/contracted
- KPI 6: Energy Achievement / Availability(AVAI vs SLA) / Performance(PR_MONTH vs SLA) / Compliant Sites / Shortfall / Penalty
- กราฟ: Monthly Actual vs Contracted (แท่งเขียว/แดงตาม ≥contracted) · Cumulative
- **Heatmap** site×เดือน (achievement%): **ทุก site เรียงตาม id**, ช่องไม่มีค่า/อนาคต = **n/a (เทา)** · สี ≥100 เขียว/90–100 เหลือง/<90 แดง
- Site Compliance Matrix (ทุก site, เรียง achievement น้อย→มาก) + Availability&Penalty panel (gauge)
- layout grid-template-areas (6 คอลัมน์): row1 delivery|cumulative|penalty (1:1:1), row2 heatmap|matrix (1:1)
- **status**: breach `<90%` / warn-energy `90–100%` / warn-avail (energy ผ่านแต่ avail<warranty) / met / none

### 5.4 Tariff Escalation — `/main/tariff` ✅ (ใช้ ppa store + slaByYear)
`pages/tariff-escalation/` + `tariff-escalation.model.ts`
- **data layer เพิ่มใหม่**: `slaByYear: Record<siteId, Record<year, PlantSlaModel>>` ใน ppa store + `ppaLoader.ensureSlaHistory()` — ดึง SLA ตลอดสัญญา **ทีละ site** (`findSlaByDate({start_time,end_time,siteid})`, start/end derive จาก contactCost schedule; query เผื่อ `startYear-1` กัน tz), cache แยก freshness 10 นาที
- rate ราย site/ปี = `rateForMonth(...,year,6)` · warranty ราย site/ปี = `slaValueForYear()` (carry-forward)
- KPI 6: Blended Tariff now (ถ่วง warranty) / Next Escalation / Avg Annual Escalation (**CAGR ของ blended**) / Tariff Range / Lifetime Growth / PPA vs FLT count
- Step curve (blended past ทึบ + future ประ) · Upcoming escalations list · **Full schedule matrix ทุกปีจริง scroll** (site×ปี, สี rateColor 5 แถบ, ไฮไลต์ปีปัจจุบัน, GROWTH ท้ายแถว) · Revenue per period (5-yr block) · Portfolio summary
- **LCOE เอาออกแล้ว** (เคย proxy แต่ user สั่งตัด) → panel เหลือ blended/range/avg-esc/remaining/**lifetime revenue**
- **responsive fix**: `.te-grid` ใช้ `minmax(0,1fr)` + `.card{min-width:0}` (กัน matrix กว้างดัน track)

### 5.x (parked) SLA / Compliance + Energy Delivery Report — mockup แล้ว ยังไม่ implement
user ตัดสินใจ **แยกเป็น 2 หน้า**:
- **SLA / Compliance** `/main/sla` — dashboard (KPI Avai/PR/Energy vs warranty ✓/✗, gauges, SLA trend energy 12M, site compliance matrix, checklist 12) — **data พร้อมเต็ม** (logic เดียวกับ energy-delivery)
- **Energy Delivery Report** `/main/delivery-report` — One-page Report print/PDF (Guaranteed vs Actual, bill status, sign-off) — Guaranteed=proxy(energy_delivery), bill status ต้อง map billing state
- **ค้างเคาะ 3 ข้อ**: (1) เริ่มหน้าไหนก่อน (เชียร์ SLA) (2) bill status ดึง billing จริง/placeholder (3) PPA Health Score = proxy composite (Avai30+PR30+Energy40) หรือ "—" รอสูตร

## 6. Assumptions / จุดที่ยัง proxy (ให้ verify / รอ user เคาะ)

1. `monthlyEnergy` อ่าน WH_MONTH ที่ **BOM** ต่อเดือน — assumption หลัก ถ้า historian คิดต่างทั้งหน้าเพี้ยน
2. contracted/target = **warranty/12 เท่ากันทุกเดือน** (ไม่ถ่วงฤดู)
3. portfolio รวมเฉพาะ site ที่มี SLA (`tracked`)
4. AVAI/PR = ค่า **realtime ปัจจุบัน** ใช้แทนทั้งเดือน/YTD
5. **Penalty ยังเป็น proxy** (รอ user เคาะ): energy LD = `shortfall × tariff` · availability LD = `0` (placeholder) · bonus over-delivery ยังไม่คิดเป็น ฿
6. shortfall = ผลรวมรายเดือน (เดือนเกินไม่ชดเชยเดือนขาด)

## 7. TODO / ต่อไป

- **Penalty formulas** (energy LD จริง? / availability LD สูตร? / bonus?) → แก้ใน `energy-delivery.ts` analytics computed จุดเดียว
- **navbar**: user เพิ่มลิงก์เอง (`/main/contract`, `/main/revenue`, `/main/energy-delivery`)
- **PermissionGuard**: revenue + energy-delivery route ยัง comment guard ไว้ (`app.routes.ts`) — ถ้าเปิด guard ต้องเพิ่ม page ใน permission/pageList
- **หน้าที่เหลือในกลุ่ม PPA Analysis** (ยังไม่ทำ): **Financial Analysis** (กำลังทำต่อ), Degradation (รอ warranty limit ลูกค้า), Curtailment & Loss (รอ data ลูกค้า), SLA/Compliance + Delivery Report (parked ดู 5.x)
- **Financial Analysis** (req: NPV/Payback/Equity IRR/LCOE-lowpri/Waterfall/Cumulative Cashflow; **Project IRR + DSCR ตัดออก**): ฝั่ง revenue ทำได้เลย (warranty×tariff รายปีจาก slaByYear), **ฝั่ง cost รอ capex/opex จริงจากลูกค้า**; add-on เสนอ = PI/ROI/MOIC/Discounted Payback/Break-even/CAPEX per Wp/EBITDA margin/NPV sensitivity
- `assets/central/revenue-performance/configurations/revenue.config.json` = **ไฟล์ตายแล้ว** (revenue ใช้ ppa.config.json ผ่าน loader) — ลบได้
- **งานค้าง overview** (คนละกลุ่ม): Weather card, Site Performance table (15 sites), Energy 12M Actual-vs-Forecast chart
- ทั้งหมด **ยังไม่ commit** (working tree)

## 8. อ้างอิงหน้าอื่นที่แตะไปแล้ว (นอกกลุ่ม PPA)

- `pages/tabular/` — เพิ่ม: SEEN สีตามเวลา (now เขียว/≥1ชม เหลือง/≥1วัน แดง), toolbar (search/filter chip/export CSV/refresh), highlight คอลัมน์ sort, คอลัมน์ AVAI/LOSS/REV_TD/REV_MTD, footer สรุป, freeze คอลัมน์แรก, responsive
- `pages/overview/component/financial-summary/` — การ์ด Financial Summary (revenue = energy×tariff)
- Merge billing+settings จาก branch `boonrawd` (plant/sla/sld config components, masterdata API)

## 9. API ที่ใช้ (http.service.ts)

- `getMasterPlants()` → `/plants/get` (MasterData, UrlApiMasterData) — PlantInformationModel[]
- `getBillingConfig()` → `api/billings/get` — BillingConfigModel[] (มี global ต้อง filter)
- `findSlaByDate(body)` → `/sla/find-by-date` — PlantSlaModel[] (energy_delivery, availability, performance, capex, opex)
- `getRealtime({Tags})` · `getAtTime([{Tags,TimeStamp}])` · `getHistorian([{Name,Options}])` · `getConfig2(path)`
- Datetime: `getTime('BOM'|'BOY'|'*-12mo'|..., date)`, `getDateTime1(date)`
