import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ResponseHistorianModel } from '../models/response.model';

@Injectable({
  providedIn: 'root'
})
export class ExportXls {
  exportToExcel(data: ResponseHistorianModel[], fileName: string): void {
    const headers = ['TimeStamp'];
    const rows:any[] = [];

    if(data.length > 0){
      data.forEach(record => {
        headers.push(record.Name);
      });
  
      data[0].records.forEach((item, index)=> {
        const row = [item.TimeStamp];
        data.forEach( x => {
          row.push(x.records[index]?.Value??'-');
        });
        rows.push(row);
      })

      const sheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook: XLSX.WorkBook = { Sheets: { 'data': sheet }, SheetNames: ['data'] };
      const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, fileName);
    }
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = fileName + '.xlsx';
    link.click();
  }
}
