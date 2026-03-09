import { Component, inject, OnInit, signal } from '@angular/core';
import { CreateReportRequestModel, DeleteReportRequestModel, ReportConfigModel, UpdateReportRequestModel } from '../../../central/models/report.model';
import { HttpService } from '../../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { sendMessage } from '../../../../store/actions/toaster.actions';
import { firstValueFrom } from 'rxjs';
import { getAllConfig } from '../../../../store/selectors/site.selectors';
import { SiteModel } from '../../../../shared/models/config.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-report-admin',
  standalone: false,
  templateUrl: './report-admin.html',
  styleUrl: './report-admin.scss'
})
export class ReportAdmin implements OnInit {
  

  showModal: boolean = false;
  globalConfig = signal<ReportConfigModel>({} as ReportConfigModel);
  siteConfigs = signal<ReportConfigModel[]>([]);
  newSiteConfig: ReportConfigModel = this.getEmptySiteConfig();
  siteList = signal<SiteModel[]>([]);


  private httpSrv = inject(HttpService);
  private store = inject(Store);
  private dialogs = inject(MatDialog);


  ngOnInit(): void {
    this.getReportConfigData();
    this.getSiteListData();
  }

  async getReportConfigData(){
    const result = await this.httpSrv.getReportConfig();
    if(result && result.status === 'success'){
      const global = result.data.find(x => x.siteId === 'global');
      if(global){
        this.globalConfig.set(global);
      }
      const sites = result.data.filter(x => x.siteId !== 'global');
      if(sites){
        this.siteConfigs.set(sites);
      }
    }
  }

  async getSiteListData(){
    const res = await firstValueFrom(
      this.store.select(getAllConfig())
    );
    if(res && res[0]){
      //console.log(res)
      this.siteList.set(res[0].siteList);
    };
  }

  getEmptySiteConfig(): ReportConfigModel {
    return {
      id: 0,
      siteId: '',
      receivedBy: '',
      receivedCc: '',
      receivedBcc: ''
    };
  }

  

  openAddSiteModal(): void {
    this.showModal = true;
    this.newSiteConfig = this.getEmptySiteConfig();
  }

  async closeModal() {
    this.showModal = false;
    this.newSiteConfig = this.getEmptySiteConfig();
    await this.getReportConfigData();
  }

  async saveSiteConfig() {
    
    if (!this.newSiteConfig.receivedBy) {
      return this.sendMessageToState('warn', 'Please select a receiver.');
    }

    if (!this.validateEmailList(this.newSiteConfig.receivedBy)) {
      return this.sendMessageToState('warn', 'Please enter a valid approver email address.');
    }
  
    if (this.newSiteConfig.id > 0) {
      const request: UpdateReportRequestModel ={
        id: this.newSiteConfig.id,
        siteId: this.newSiteConfig.siteId,
        reciever: this.newSiteConfig.receivedBy,
        carboncopy: this.newSiteConfig.receivedCc,
        blindcarboncopy: this.newSiteConfig.receivedBcc
      };
      const result = await this.httpSrv.updateReportConfig(request);
  
      if (result?.StatusCode?.toLowerCase().includes('success')) {
        this.sendMessageToState('success', 'Report configuration updated successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to update report configuration.');
      }
    } else {
  
      const request: CreateReportRequestModel = {
        siteId: this.newSiteConfig.siteId,
        reciever: this.newSiteConfig.receivedBy,
        carboncopy: this.newSiteConfig.receivedCc,
        blindcarboncopy: this.newSiteConfig.receivedBcc
      };
  
      const result = await this.httpSrv.addReportConfig(request);
  
      if (result?.StatusCode?.toLowerCase().includes('success')) {
        this.sendMessageToState('success', 'Report configuration created successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to create report configuration.');
      }
    }
  }

  confirmDeleteSiteConfig(id: number): void {
    const dialogData: ConfirmDialogData = {
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?',
      subMessage: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };

    const dialogRef = this.dialogs.open(ConfirmDialog, {
      width: '480px',
      data: dialogData,
      panelClass: 'confirm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === true) {
        await this.deleteSiteConfig(id);
      }
    });

  }

  async deleteSiteConfig(id: number) {
    if (true) {
      const request: DeleteReportRequestModel  =  { id: id };
      const result = await this.httpSrv.deleteReportConfig(request);
      if(result && result.StatusCode && result.StatusCode.toLowerCase().includes('success')){
        this.sendMessageToState('success', 'Report configuration deleted successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to delete report configuration.');
      }
      await this.getReportConfigData();
    }
  }

  editSiteConfig(config: ReportConfigModel): void {
    this.newSiteConfig = { ...config };
    this.showModal = true;
  }

  async saveGlobalSettings() {
    
    if (!this.globalConfig().receivedBy) {
      return this.sendMessageToState('warn', 'Please select a receiver.');
    }

    if (!this.validateEmailList(this.globalConfig().receivedBy)) {
      return this.sendMessageToState('warn', 'Please enter a valid approver email address.');
    }
  
    if (this.globalConfig().id > 0) {
      const request: UpdateReportRequestModel ={
        id: this.globalConfig().id,
        siteId: this.globalConfig().siteId,
        reciever: this.globalConfig().receivedBy,
        carboncopy: this.globalConfig().receivedCc,
        blindcarboncopy: this.globalConfig().receivedBcc
      };
      const result = await this.httpSrv.updateReportConfig(request);
  
      if (result?.StatusCode?.toLowerCase().includes('success')) {
        this.sendMessageToState('success', 'Report configuration updated successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to update report configuration.');
      }
    } else {
  
      const request: CreateReportRequestModel = {
        siteId: 'global',
        reciever: this.globalConfig().receivedBy,
        carboncopy: this.globalConfig().receivedCc,
        blindcarboncopy: this.globalConfig().receivedBcc
      };
  
      const result = await this.httpSrv.addReportConfig(request);
  
      if (result?.StatusCode?.toLowerCase().includes('success')) {
        this.sendMessageToState('success', 'Report configuration created successfully.');
      } else {
        this.sendMessageToState('error', 'Failed to create report configuration.');
      }
    }
  
    await this.getReportConfigData();
  }

  sendMessageToState(type:  "error" | "success" | "info" | "warn" | "secondary" | "contrast", msg: string){
    this.store.dispatch(sendMessage({ 
      payload: { type: type, text: msg }
    }));
  }

  validateEmailList(value: string | null | undefined): boolean {

    if (!value) return false;

    // split email ด้วย comma
    const emails = value
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (emails.length === 0) return false;

    // basic email regex (safe สำหรับ frontend validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emails.every(email => emailRegex.test(email));
  }

  getSiteName(id: string){
    return this.siteList().find(x => x.id === id)?.name || id;
  }

}

export interface SiteConfig {
  id: number;
  siteName: string;
  emails: string;
};
