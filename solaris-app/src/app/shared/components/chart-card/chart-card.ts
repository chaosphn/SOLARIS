import { Component, inject, input } from '@angular/core';
import { ChartParameters } from '../../models/highchart.model';
import { Datetime } from '../../services/datetime';
import { ResponseHistorianModel } from '../../models/response.model';

@Component({
  selector: 'app-chart-card',
  standalone: false,
  templateUrl: './chart-card.html',
  styleUrl: './chart-card.scss'
})
export class ChartCard {

  name = input<string>('');
  chartData = input<ChartParameters>({} as ChartParameters);
  
  date: Date = new Date();
  mode: 'd' | 'w' | 'm' | 'y' = 'd';

  private dateTimeSrv = inject(Datetime);

  captureChart(): void {
    const chartElement = document.getElementById('chart');
    if (chartElement) {
      this.captureElement(chartElement, 'chart');
    }
  }

  private captureElement(element: HTMLElement, filename: string): void {
    // Using html2canvas library
    import('html2canvas').then(html2canvas => {
      html2canvas.default(element, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        logging: false,
        useCORS: true
      }).then((canvas: any) => {
        const link = document.createElement('a');
        const date = this.dateTimeSrv.getDateTime1(new Date());
        link.download = `${filename}_${date.slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch((err: any) => {
        console.error('Error capturing chart:', err);
      });
    });
  }

  exportAllToExcel(): void {
    const date = this.dateTimeSrv.getDateTime1(new Date());
    const data: any[] = this.chartData()?.series || [];
    const res:ResponseHistorianModel[] = data.map((x: any) => {
      return {
        Name: x.name,
        Unit: '-',
        Min: 0,
        Max: 100,
        records: x.data.map((y: any) => ({
          Value: y[1],
          TimeStamp: new Date(y[0]).toISOString()
        }))
      }
    }) 
    //this.excelExportService.exportToExcel(res, 'exported_data_'+date.slice(0,10));
  }

  setTimeRange(range: 'd' | 'w' | 'm' | 'y') {
    this.mode = range;
  }

  onDateSelect(event: any) {
    this.date = event;
  }

}
