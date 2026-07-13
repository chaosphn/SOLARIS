# Financial Analysis Page — Design Brief

Design brief สำหรับหน้า **Financial Analysis** ในกลุ่ม PPA Analysis ของ Solar Monitoring Dashboard (BOONRAWD Solaris)
เอกสารนี้ standalone — อ่านแล้วออกแบบต่อได้เลยโดยไม่ต้องมี context อื่น

---

## 1. Context / เป้าหมาย

- **ผู้ใช้**: นักการเงิน / ผู้บริหาร / PM — ดูความคุ้มค่าการลงทุนของ portfolio โรงไฟฟ้าโซลาร์
- **ตอบคำถาม**: โครงการคุ้มไหม (NPV/IRR) · คืนทุนกี่ปี · ต้นทุนต่อหน่วยเท่าไร (LCOE) · site ไหนบริหารต้นทุนดีสุด
- **Scope**: Portfolio ~15 sites · อายุสัญญา 25 ปี · เป็น **web dashboard เต็มจอ (Full HD 1920×1080)** ไม่ใช่รายงานพิมพ์
- แอปเป็น **Angular** ธีม **dark** — หน้านี้ต้องกลมกลืนกับหน้าอื่น (Revenue, Energy Delivery, Tariff Escalation)

## 2. Theme tokens (ใช้ค่าจริงจากแอป — สำคัญมาก)

พื้นหลัง/พื้นผิว:
- page background: `#16171B`
- card background: `#1F2125`
- secondary surface / table row: `#292B2F`
- table header background: `#24292D`
- stack/track background: `#3B444D`

ตัวอักษร:
- primary text: `#F5F7FB`
- secondary/muted text: `#667079`
- row text: `#ebebeb`

เส้น/ขอบ:
- border: `#485057`
- chart gridline: `#2d3136`

Accent (ความหมาย):
- **เหลืองทอง `#E4B61A`** = ค่าหลัก/ตัวชี้วัด PPA (active-txt)
- เหลือง highlight `#FBE134` = เน้นพิเศษ (เช่น ปีปัจจุบัน)
- เขียว `#4CAF82` = ดี/ผ่าน/บวก
- แดง/coral `#E05D4E` = แย่/ขาด/ลบ
- ฟ้า `#4DA3FF` = info / marker

Style rules:
- card: bg `#1F2125`, border `1px solid #485057`, **radius 4px**, padding 12px
- **KPI card**: มี **border-top 2px** สี accent ตามความหมาย
- **card header**: มี **border-left 3px `#E4B61A`** + ข้อความตัวพิมพ์ใหญ่ 12px เว้น letter-spacing เล็กน้อย
- ตัวเลข KPI: 20px weight 600 · label 11px weight 500 สี muted · sub-text 11px muted
- ไม่มี gradient/shadow ฟุ่มเฟือย — flat, dense, ตัวเลขเยอะ อ่านง่าย

## 3. Layout (grid 6 คอลัมน์ · grid-template-areas)

```
row 1  KPI strip (6 การ์ดเรียงแถวเดียว)
row 2  Revenue waterfall (4)      |  Key ratios (2)
row 3  Cumulative cashflow (4)    |  NPV sensitivity (2)
row 4  Site financial matrix (6, เต็มความกว้าง)
```
- responsive: จอแคบ (<1200px) ยุบเป็น 1 คอลัมน์เรียงลง · ตารางกว้างให้ scroll แนวนอนในกรอบตัวเอง

## 4. ทุกค่าในหน้า — นิยาม / ที่มา / สูตร

> พื้นฐานการคำนวณ: สร้าง **cashflow รายปี 25 ปี** ต่อ site
> - ปีที่ 0 = −CAPEX
> - ปีที่ 1–25 = Revenue_ปี − OPEX_ปี  (net operating cashflow)
> - Revenue_ปี = warranty energy (kWh) × tariff (฿/kWh) ของปีนั้น
> - discount rate ตั้งต้น = 8%

### 4.1 KPI strip (6 การ์ด)
| KPI | ค่า/หน่วย | สูตร / ที่มา | border-top |
|---|---|---|---|
| **CAPEX** | ฿ (B) | เงินลงทุนเริ่มต้นรวมทุก site — จาก SLA `capex` | ฟ้า |
| **Annual OPEX** | ฿ (M) | ค่าดำเนินงาน/ปี รวมทุก site — จาก SLA `opex` | แดง |
| **NPV @ 8%** | ฿ (B) | Σ CF_ปี/(1+r)^ปี − CAPEX | เขียว |
| **Project IRR** | % | อัตราคิดลด r ที่ทำให้ NPV = 0 (แก้เชิงตัวเลข) · sub = Equity IRR | เขียว |
| **Payback** | ปี | ปีที่ cumulative cashflow ตัด 0 · sub = discounted payback | เหลือง |
| **LCOE** | ฿/kWh | (CAPEX + Σ OPEX discounted) / (Σ energy discounted) · sub = เทียบ tariff (×เท่า) | เหลือง |

### 4.2 Revenue waterfall (lifetime, ฿B)
บาร์ต่อเนื่อง 4 แท่ง:
- **Revenue** (เขียว, +) = Σ revenue ทุกปีตลอดสัญญา
- **− OPEX** (แดง) = Σ opex ทุกปี
- **− CAPEX** (แดง) = เงินลงทุน
- **Net profit** (เหลืองทอง) = Revenue − OPEX − CAPEX (undiscounted)

### 4.3 Key ratios (panel รายการ)
| ค่า | สูตร / ที่มา |
|---|---|
| Revenue (annual) | warranty × tariff ปีปัจจุบัน |
| EBITDA (annual) | Revenue − OPEX |
| EBITDA margin | EBITDA / Revenue |
| OPEX / kWh | OPEX ÷ annual energy |
| OPEX / MWp | OPEX ÷ capacity (MWp) |
| DSCR | **N/A — ต้องมี loan terms** (ยังไม่มี data) |

### 4.4 Cumulative cashflow (฿B, line chart)
- แกน X = ปี 0–25 · Y = cumulative cashflow
- ปีที่ 0 ติดลบ (−CAPEX) แล้วไต่ขึ้น
- เส้นตัด 0 = **payback** (mark ด้วยจุด/เส้นแนวตั้งสีฟ้า)
- เส้นอ้างอิง 0 แนวนอน (เขียว dashed)

### 4.5 NPV sensitivity (bar chart)
- NPV ที่ discount rate 6% / 8% / 10% / 12% (4 แท่ง)
- ไฮไลต์แท่ง 8% (base case) ด้วยขอบเหลือง

### 4.6 Site financial matrix (ตารางเต็มความกว้าง)
คอลัมน์ต่อ site: **SITE · CAPEX · OPEX/yr · REVENUE/yr · EBITDA · IRR · PAYBACK · LCOE**
+ แถว Total ท้ายตาราง (เน้นพื้นเข้ม)
- IRR/LCOE ใส่สีตามระดับ (ดี=เขียว/เหลือง, แย่=ส้ม/แดง)

## 5. สถานะข้อมูล (สำคัญสำหรับ design — ต้องมี state รอข้อมูล)

| กลุ่ม | สถานะ | หมายเหตุ design |
|---|---|---|
| **Revenue side** (revenue, lifetime revenue) | ✅ พร้อม | มีข้อมูลจริง (warranty × tariff) |
| **CAPEX / OPEX** | 🟡 จาก SLA — อาจยังว่าง | ถ้าว่าง → cost/return ทั้งหมดต้องขึ้น **"—" หรือ empty state "รอข้อมูล capex/opex"** |
| **NPV / IRR / Payback / LCOE / EBITDA** | ✅ ถ้ามี capex/opex | derive จาก cashflow |
| **DSCR / Equity IRR** | ⚠️ ต้องมี loan terms | mark **N/A** — ควรมี pill/badge "รอ loan terms" |
| **Degradation** | ❌ ถูกตัด | energy คงที่ทุกปี (เปลี่ยนแค่ tariff escalation) |

**ต้อง design ให้รองรับ 3 state**: (1) loading (2) มีข้อมูลครบ (3) มี revenue แต่ cost ว่าง → โชว์ placeholder ฝั่ง cost/return

## 6. ตัวเลขตัวอย่าง (portfolio, ไว้ทำ mockup — ไม่ใช่ค่าจริง)

- CAPEX ฿2.85B · Annual OPEX ฿115M
- NPV@8% ฿1.94B · Project IRR 12.8% · Equity IRR 15.4%
- Payback 7.9 ปี (discounted 9.4) · LCOE 1.28 ฿/kWh (tariff 3.38 = ×2.6)
- Revenue/yr ฿562M · EBITDA ฿447M (margin 79.5%) · OPEX/kWh 0.69 ฿ · OPEX/MWp ฿0.28M
- NPV sensitivity: 6%→2.9B · 8%→1.94B · 10%→1.2B · 12%→0.6B
- Site rows ตัวอย่าง:
  - CPN: CAPEX 420M · OPEX 17M · Rev 84M · EBITDA 67M · IRR 13.6% · Payback 7.4 · LCOE 1.19
  - KKB: 380M · 15M · 71M · 56M · 12.9% · 7.8 · 1.26
  - NMA: 310M · 13M · 55M · 42M · 12.1% · 8.3 · 1.33
  - SKN: 265M · 12M · 44M · 32M · 10.8% · 9.1 · 1.44

## 7. คำถามที่ยังไม่สรุป (ให้ทีมเคาะ)

1. discount rate — fix 8% หรือให้ user ปรับได้ (slider)?
2. Equity IRR — คง N/A หรือเอาออก (ไม่มี loan terms)?
3. degradation — คงที่ไม่มี หรือใส่ rate คงที่เป็น input?
