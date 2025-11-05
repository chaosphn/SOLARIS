import { Component, input, output } from '@angular/core';
import { BillingConfigModel } from '../../../../models/billing.model';

@Component({
  selector: 'app-config-dialog',
  standalone: false,
  templateUrl: './config-dialog.html',
  styleUrl: './config-dialog.scss'
})
export class ConfigDialog {

  // Site config form
  siteConfig = input<BillingConfigModel>(this.getEmptySiteConfig());
  onClose = output();
  onSave = output<BillingConfigModel>();
  
  // Available sites (mock data)
  availableSites: string[] = [
    'Site 01 - Solar Rooftop Singha Kameda',
    'Site 02 - Solar Rooftop Vara Food Phase1',
    'Site 03 - Solar Rooftop PSC Starch',
    'Site 04 - Solar Rooftop Singha Park Chiangrai',
    'Site 05 - Solar Rooftop Vara Food Phase2',
    'Site 06 - Solar Rooftop SRB',
    'Site 07 - Solar Rooftop WNB2',
    'Site 08 - Solar Rooftop KKB Factory',
    'Site 09 - Solar Rooftop BAB',
    'Site 10 - Solar Rooftop SBC'
  ];

  getEmptySiteConfig(): BillingConfigModel {
    return {
      id: 0,
      siteName: '',
      meterMode: 'normal',
      energyCost: 2.95,
      onpeakCost: 4.1839,
      offpeakCost: 2.6037,
      discountCost: 0,
      ftCost: 0.3972,
      co2Ratio: 0.23314,
      fuelRatio: 3.11,
      treeRatio: 0.0193,
      emails: ''
    };
  }

  closeModal(): void {
    this.onClose.emit();
  }

  onSiteConfigMeterModeChange(): void {
    if (this.siteConfig().meterMode === 'normal') {
      this.siteConfig().onpeakCost = 0;
      this.siteConfig().offpeakCost = 0;
    } else {
      this.siteConfig().energyCost = 0;
    }
  }

  saveSiteConfig(): void {
    if (!this.siteConfig().siteName) {
      alert('Please select a site');
      return;
    }
    
    console.log('Site config saved:', this.siteConfig());
    alert('Site configuration added successfully!');
    
    this.onSave.emit(this.siteConfig());
  }

}
