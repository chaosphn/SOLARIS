import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { DataRealtimeModel } from '../../../../../../shared/models/response.model';
import { ChartParameters } from '../../../../../../shared/models/highchart.model';
import { ChartService } from '../../../../../../shared/services/chart.service';

@Component({
  selector: 'app-inverter-summary',
  standalone: false,
  templateUrl: './inverter-summary.html',
  styleUrl: './inverter-summary.scss'
})
export class InverterSummary implements OnInit {
  property = input<any[]>([]);
  inverter = input<string[]>([]);
  data = input<DataRealtimeModel>({});

  selectedInverter = signal<any>({});

  private chartSrv = inject(ChartService);

  /** ค่าและหน่วยของ metric ที่เลือกอยู่ แยกราย inverter */
  private points = computed(() => {
    const prefix = this.selectedInverter()?.prefix;
    const data = this.data();
    if (!prefix) {
      return [] as { name: string; value: number; unit: string; max: number }[];
    }
    return this.inverter().map(id => {
      const tag = data[`${id}_${prefix}`];
      const raw = parseFloat(tag?.Value?.toString().replaceAll(',', '') ?? '');
      return {
        name: id,
        value: isNaN(raw) ? 0 : raw,
        unit: tag?.Unit || '',
        max: tag?.Max || 0
      };
    });
  });

  unit = computed(() => this.points().find(p => p.unit)?.unit || '');

  chart = computed<ChartParameters>(() => {
    const items = this.points();
    const conf = this.selectedInverter();
    const activeColor = conf?.activeColor || 'var(--active-txt)';
    const unit = this.unit();
    // เส้นอ้างอิงค่าสูงสุดที่ตั้งไว้ใน config ช่วยเทียบว่าตัวไหนต่ำผิดปกติ
    const maxRef = items.find(i => i.max > 0)?.max ?? 0;

    return {
      chart: this.chartSrv.getChartOptions({ margin: [16, 12, 40, 44] }),
      title: { text: undefined } as any,
      xAxis: {
        categories: items.map(i => i.name),
        lineColor: 'var(--chart-brd)',
        tickColor: 'var(--chart-brd)',
        labels: { style: { color: 'var(--secondary-txt)', fontSize: '10px' }, rotation: items.length > 12 ? -45 : 0 }
      } as any,
      yAxis: [{
        title: { text: null },
        gridLineColor: 'var(--chart-brd)',
        labels: { style: { color: 'var(--secondary-txt)', fontSize: '10px' } },
        tickAmount: 5,
        plotLines: maxRef > 0
          ? [{ value: maxRef, color: 'var(--chart-brd)', dashStyle: 'Dash', width: 1, zIndex: 3 }]
          : []
      }] as any,
      legend: { enabled: false } as any,
      tooltip: {
        shared: false,
        backgroundColor: 'var(--chart-tlp)',
        borderWidth: 0,
        style: { color: 'var(--primary-txt)', fontSize: '11px' },
        valueSuffix: unit ? ` ${unit}` : '',
        valueDecimals: 2
      } as any,
      plotOptions: {
        column: { borderRadius: 2, pointPadding: 0.06, groupPadding: 0.12, borderWidth: 0 },
        series: { animation: false }
      } as any,
      series: [{
        type: 'column',
        name: conf?.title || 'Inverter',
        color: activeColor,
        data: items.map(i => i.value)
      }] as any
    };
  });

  constructor() {
    effect(() => {
      if (this.property().length > 0 && !this.selectedInverter().prefix) {
        this.selectedInverter.set(this.property()[0]);
      }
    });
  }

  ngOnInit(): void {
    if (this.property().length > 0 && !this.selectedInverter()) {
        this.selectedInverter.set(this.property()[0]);
      }
  }

  changeMode(inverterId: any) {
    this.selectedInverter.set(inverterId);
  }

}
