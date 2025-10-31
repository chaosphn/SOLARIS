import { AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild, effect, inject, input, signal } from '@angular/core';
import { Record, ResponseHistorianModel } from '../../models/response.model';
import { ExportXls } from '../../services/export-xls';
import { Datetime } from '../../services/datetime';

@Component({
  selector: 'app-data-table',
  standalone: false,
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss'
})
export class DataTable {

  data = input([], {
    transform: (val:ResponseHistorianModel[]) => val.filter(x => x.records.length > 1).sort((a,b)=> a.Name.localeCompare(b.Name)),
  });
  dataTable = signal<ResponseHistorianModel[]>([]);
  pageList: string[] = [];
  tableRange:number = 20;
  lastIndex: number = 20;
  prevRange: number = 3;
  prevStart: number = 1;
  pageNumber: string = '1';
  //lastRange: number = -3; 
  recordHeader: any[] = [];

  private excelExportService = inject(ExportXls);
  private dateTimeSrv = inject(Datetime);
  constructor(){
    effect(() => {
      console.log(this.data())
      this.dataTable.set([]);
      this.dataTable.set(
        this.data().map(function(item){
          return {
            Name: item.Name,
            Min: item.Min,
            Max: item.Max,
            Unit: item.Unit,
            records: item.records.slice(0,20)
          }
        })
      );
      const lenght = this.data()[0].records.length/this.tableRange;
      this.pageList = Array(Math.ceil(lenght)).fill(0).map((_, i) => (i+1).toString());
      this.recordHeader = [];
      this.dataTable().forEach(item => {
        let findName = this.recordHeader.find(x => x.name == item.Name.split(".")[1]);
        if(findName){
          findName.count = findName.count + 1;
        } else {
          this.recordHeader.push({
            name: item.Name.split(".")[1],
            count: 1
          })
        }
      });

      this.tableRange = 20;
      this.pageNumber = "1";
    })
  }

  getNumber(val: any) {
    // if (typeof val === 'number') {
    //   const v = +val.toFixed(2);
    //   return v;
    // }
    // else {
    //   const res = parseInt(val.replace(',', '')).toFixed(0);
    //   if(res != "NaN"){
    //     ////console.log(res)
    //     return res;
    //   } else if(val)  {
    //     return val; 
    //   } else {
    //     return "-";
    //   }
    // }
    if(val){
      if (typeof val === 'number') {
        const v = +val.toFixed(2);
        return v;
      }
      else {
        const res = parseFloat(val.replaceAll(',', ''));
        if(res > 0){
          return res.toFixed(1);
        } else if(val)  {
          return val; 
        }
      }
    } else {
      return "-";
    }
  }

  getTitle(name: string){
    const title = name.split('.')[2];
    return title;
  }

  getDescription(name: string){
    const title = name.split('.')[1];
    return title;
  }

  convertDate(day: string){
    const test = new Date(day).toLocaleString('en-GB', {
      hour12: false,
    });
    return test;
  }

  onSelectedRange(value: string){
    //console.log(value);
    this.tableRange = parseInt(value);
    this.pageNumber = "1";
    const end = this.tableRange;
    const lenght = this.data()[0].records.length/this.tableRange;
    //console.log(lenght)
    this.pageList = Array(Math.ceil(lenght)).fill(0).map((_, i) => (i+1).toString());
    this.dataTable.set(
      this.data().map(function(item){
        return {
          Name: item.Name,
          Min: item.Min,
          Max: item.Max,
          Unit: item.Unit,
          records: item.records.slice(0, end)
        }
      })
    );
  }

  getForwardRange(){
    if(parseInt(this.pageNumber) <= this.pageList.length - 1){
      const pg = parseInt(this.pageNumber) + 1;
      this.pageNumber = pg.toString();
      const en = pg * this.tableRange;
      const st = en - this.tableRange;
      //console.log("pg : "+pg+"\ncheck : " + (this.prevStart + this.prevRange + 1))
      if(pg == this.prevStart + this.prevRange + 1){
        this.prevStart = parseInt(this.pageNumber) - 1;
      }
      //console.log("page : "+pg+"\nstartIndex : "+st+"\nendIndex : "+en)
      this.dataTable.set(
        this.data().map(function(item){
          return {
            Name: item.Name,
            Min: item.Min,
            Max: item.Max,
            Unit: item.Unit,
            records: item.records.slice(st, en)
          }
        })
      );
    }
  }

  getBackRange(){
    if(parseInt(this.pageNumber) > 1){
      const pg = parseInt(this.pageNumber) - 1;
      this.pageNumber = pg.toString();
      const en = pg * this.tableRange;
      const st = en - this.tableRange;
      //console.log("pg : "+pg+"\ncheck : " + (this.prevStart))
      if(pg == this.prevStart){
        this.prevStart = parseInt(this.pageNumber) - 1;
      }
      //console.log("page : "+pg+"\nstartIndex : "+st+"\nendIndex : "+en)
      this.dataTable.set(
        this.data().map(function(item){
          return {
            Name: item.Name,
            Min: item.Min,
            Max: item.Max,
            Unit: item.Unit,
            records: item.records.slice(st, en)
          }
        })
      );
    }
  }

  goFirstPage(){
    const end = this.tableRange;
    this.prevStart = 1;
    this.pageNumber = "1";
    this.dataTable.set(
      this.data().map(function(item){
        return {
          Name: item.Name,
          Min: item.Min,
          Max: item.Max,
          Unit: item.Unit,
          records: item.records.slice(0, end)
        }
      })
    );
  }

  goLastPage(){
    const end = this.tableRange;
    this.prevStart = this.pageList.length-4;
    this.pageNumber = this.pageList[this.pageList.length-1];
    this.dataTable.set(
      this.data().map(function(item){
        return {
          Name: item.Name,
          Min: item.Min,
          Max: item.Max,
          Unit: item.Unit,
          records: item.records.slice((item.records.length - end), item.records.length)
        }
      })
    );
  }

  goToPage(page: string){
    const pg = parseInt(page);
    if(this.pageList.indexOf(page) == -1){
      alert("page not found !")
    } else {
      this.pageNumber = page;
      const en = pg * this.tableRange;
      const st = en - this.tableRange;
      //console.log("startIndex : "+st+"\nendIndex : "+en)
      this.dataTable.set(
        this.data().map(function(item){
          return {
            Name: item.Name,
            Min: item.Min,
            Max: item.Max,
            Unit: item.Unit,
            records: item.records.slice(st, en)
          }
        })
      );
    }
  }

  goToNextPageGroup(){
    this.prevStart = parseInt(this.pageNumber) + 1;
  }

  exportToExcel(): void {
    const date = this.dateTimeSrv.getDateTime1(new Date());
    //console.log(this.data());
    this.excelExportService.exportToExcel(this.data().filter(x => x.records.length > 0), 'exported_data_'+date.slice(0,10));
  }

}

