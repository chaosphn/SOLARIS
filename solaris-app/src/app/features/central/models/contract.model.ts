import { SiteModel } from '../../../shared/models/config.model';
import { BillingConfigModel } from './billing.model';

export interface ContractRatePoint{
    key: string;
    label: string;
    rate: number;
    start: Date;
    current: boolean;
    showLabel: boolean;
    height: number;
}

export interface ParsedContractModel{
    type: string;
    isSchedule: boolean;
    rates: ContractRatePoint[];
    currentRate: number | null;
    currentLabel: string;
    nextRate: number | null;
    nextLabel: string;
    nextDiffPercent: number | null;
    periodLabel: string;
    startDate: Date | null;
    endDate: Date | null;
    remainingYears: number | null;
    progress: number | null;
    progressKind: 'contract' | 'year' | null;
    avgRate: number | null;
    minRate: number | null;
    maxRate: number | null;
    /** FLOATING: ช่วงเดือนต้นทางที่เอามาเฉลี่ยเป็น rate ปัจจุบัน เช่น 'JAN–APR' */
    basisLabel?: string;
}

export interface ContractRowModel{
    site: SiteModel;
    config: BillingConfigModel | null;
    parsed: ParsedContractModel | null;
    energyMtd: number | null;
    revenueMtd: number | null;
    revenueYtd?: number | null;
}

export interface ContractSummaryModel{
    totalContract: number;
    ppaCount: number;
    floatingCount: number;
    totalCapacity: number;
    avgProgress: number | null;
    /** ปีคงเหลือเฉลี่ยของสัญญาแบบ PPA ใช้คู่กับ avgProgress */
    avgRemainingYears: number | null;
    /** รายได้เดือนนี้ของโรงที่ทำได้สูงสุด คิดจากพลังงาน (WH) ของเดือน × อัตราค่าไฟงวดปัจจุบัน */
    maxRevenue: number | null;
    /** รหัสโรงไฟฟ้าที่ทำรายได้สูงสุด */
    maxRevenueSite: string | null;
    /** พลังงานเดือนนี้ของโรงนั้น ใช้แสดงให้เห็นว่าตัวเลขคิดมาจากอะไร */
    maxRevenueEnergy: number | null;
}

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const BLOCK_LABELS = ['JAN–APR', 'MAY–AUG', 'SEP–DEC'];

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * contactCost มี 2 รูปแบบ:
 * - schedule (PPA): "01/2026:3.44, 01/2027:3.47, ..." งวดปีตามอายุสัญญา
 * - monthly (FLOATING): "01:3.1409, 02:3.0978, ..." rate 12 เดือน หมุนทุกปี
 */
export function parseContactCost(contactType: string, contactCost: string, now: Date): ParsedContractModel | null {
    if(!contactCost || contactCost.trim().length === 0){
        return null;
    }

    const entries = contactCost.split(',').map(x => x.trim()).filter(x => x.length > 0);
    if(entries.length === 0){
        return null;
    }

    const isSchedule = entries[0].includes('/');
    const pointMap = new Map<string, { key: string; rate: number; start: Date }>();

    for(const entry of entries){
        const sepIndex = entry.lastIndexOf(':');
        if(sepIndex < 0){
            continue;
        }
        const key = entry.slice(0, sepIndex).trim();
        const rate = parseFloat(entry.slice(sepIndex + 1));
        if(!key || isNaN(rate)){
            continue;
        }

        let start: Date | null = null;
        if(isSchedule){
            const [mm, yyyy] = key.split('/').map(x => parseInt(x, 10));
            if(!isNaN(mm) && !isNaN(yyyy) && mm >= 1 && mm <= 12){
                start = new Date(yyyy, mm - 1, 1);
            }
        } else {
            const mm = parseInt(key, 10);
            if(!isNaN(mm) && mm >= 1 && mm <= 12){
                start = new Date(now.getFullYear(), mm - 1, 1);
            }
        }
        if(!start){
            continue;
        }
        pointMap.set(key, { key, rate, start });
    }

    const points = Array.from(pointMap.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
    if(points.length === 0){
        return null;
    }

    const values = points.map(p => p.rate);
    const minRate = Math.min(...values);
    const maxRate = Math.max(...values);
    const avgRate = values.reduce((a, b) => a + b, 0) / values.length;
    const getHeight = (rate: number) => maxRate > minRate ? 40 + ((rate - minRate) / (maxRate - minRate)) * 60 : 70;

    if(isSchedule){
        let currentIndex = -1;
        points.forEach((p, i) => {
            if(p.start.getTime() <= now.getTime()){
                currentIndex = i;
            }
        });
        const current = currentIndex >= 0 ? points[currentIndex] : null;
        const next = points[currentIndex + 1] ?? null;

        const startDate = points[0].start;
        const endDate = points[points.length - 1].start;
        const total = endDate.getTime() - startDate.getTime();
        const progress = total > 0
            ? Math.min(Math.max(((now.getTime() - startDate.getTime()) / total) * 100, 0), 100)
            : null;
        const remainingYears = Math.max((endDate.getTime() - now.getTime()) / MS_PER_YEAR, 0);

        const rates: ContractRatePoint[] = points.map((p, i) => ({
            key: p.key,
            label: p.start.getFullYear().toString(),
            rate: p.rate,
            start: p.start,
            current: i === currentIndex,
            showLabel: i % 5 === 0 || i === points.length - 1,
            height: getHeight(p.rate)
        }));

        return {
            type: contactType,
            isSchedule: true,
            rates,
            currentRate: current?.rate ?? null,
            currentLabel: current ? current.key : '',
            nextRate: next?.rate ?? null,
            nextLabel: next ? next.key : '',
            nextDiffPercent: current && next ? ((next.rate - current.rate) / current.rate) * 100 : null,
            periodLabel: `${points[0].key} – ${points[points.length - 1].key}`,
            startDate,
            endDate,
            remainingYears,
            progress,
            progressKind: 'contract',
            avgRate,
            minRate,
            maxRate
        };
    }

    // FLOATING: rate ที่ใช้จริงของแต่ละช่วง 4 เดือน = ค่าเฉลี่ยค่าไฟ 4 เดือนของช่วงก่อนหน้า
    // เดือน 1-4 ← เฉลี่ยเดือน 9-12 (ปีก่อน), เดือน 5-8 ← เฉลี่ยเดือน 1-4, เดือน 9-12 ← เฉลี่ยเดือน 5-8
    const blockAvg = (blockIndex: number): number | null => {
        const months = [1, 2, 3, 4].map(i => blockIndex * 4 + i);
        const vals = points
            .filter(p => months.includes(p.start.getMonth() + 1))
            .map(p => p.rate);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const currentMonth = now.getMonth() + 1;
    const currentBlock = Math.floor((currentMonth - 1) / 4);
    const basisBlock = (currentBlock + 2) % 3;
    const nextBlock = (currentBlock + 1) % 3;

    const currentRate = blockAvg(basisBlock);
    const nextRate = blockAvg(currentBlock);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const progress = ((now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100;

    const rates: ContractRatePoint[] = points.map(p => ({
        key: p.key,
        label: MONTH_LABELS[p.start.getMonth()],
        rate: p.rate,
        start: p.start,
        current: Math.floor(p.start.getMonth() / 4) === basisBlock,
        showLabel: true,
        height: getHeight(p.rate)
    }));

    return {
        type: contactType,
        isSchedule: false,
        rates,
        currentRate,
        currentLabel: BLOCK_LABELS[currentBlock],
        nextRate,
        nextLabel: BLOCK_LABELS[nextBlock],
        nextDiffPercent: currentRate != null && nextRate != null && currentRate !== 0
            ? ((nextRate - currentRate) / currentRate) * 100
            : null,
        periodLabel: '4-MONTH ROLLING AVG',
        startDate: null,
        endDate: null,
        remainingYears: null,
        progress,
        progressKind: 'year',
        avgRate,
        minRate,
        maxRate,
        basisLabel: BLOCK_LABELS[basisBlock]
    };
}
