import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpService } from '../../../shared/services/http.service';
import { Store } from '@ngrx/store';
import { sendMessage } from '../../../store/actions/toaster.actions';
import { BillingSessionModel } from '../../../shared/models/billing.model';

@Component({
  selector: 'app-billing-upload',
  standalone: false,
  templateUrl: './billing-upload.html',
  styleUrl: './billing-upload.scss'
})
export class BillingUpload implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private http = inject(HttpService);
  private store = inject(Store);

  billingId: string = '';
  sessionData = signal<BillingSessionModel | null>(null);
  uploadedFile: File | null = null;
  isDragOver: boolean = false;
  isUploading: boolean = false;

  // Regex pattern: Billing_XXX-X_YYYY-MM.pdf
  // XXX = alphanumeric, X = alphanumeric, YYYY = 4 digits, MM = 2 digits
  private fileNamePattern = /^Billing_[A-Za-z0-9]+-[A-Za]+_\d{4}-\d{2}\.pdf$/;

  ngOnInit(): void {
    const currentUrl = this.router.url;
    const segments = currentUrl.split('/');
    this.billingId = segments[segments.length - 1];
    this.getSessionData();
    //console.log('Billing Upload ID:', this.billingId);
  }

  async getSessionData(){
    try {
      const data: BillingSessionModel = await this.http.getBillingSessionData(this.billingId);
      if(data && data.siteId){
        this.sessionData.set(data);
      } else {
        this.sessionData.set(null);
      }
    } catch (error) {
      this.sessionData.set(null);
    } 
  };

  goBack(): void {
    this.router.navigate(['/']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.addFile(input.files[0]);
    }
    // Reset input value to allow selecting the same file again
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.addFile(event.dataTransfer.files[0]);
    }
  }

  addFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Check file type
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      alert(`File "${file.name}" exceeds 10MB limit`);
      return;
    }

    // Check file name format
    // if (!this.fileNamePattern.test(file.name)) {
    //   alert(
    //     `Invalid file name format.\n\n` +
    //     `Expected format: Billing_XXX-X_YYYY-MM.pdf\n` +
    //     `Example: Billing_J2301-1_2025-12.pdf\n\n` +
    //     `Your file: ${file.name}`
    //   );
    //   return;
    // }

    this.uploadedFile = file;
  }

  removeFile(): void {
    this.uploadedFile = null;
  }

  clearFile(): void {
    if (confirm('Are you sure you want to clear this file?')) {
      this.uploadedFile = null;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async submitFile(): Promise<void> {
    if (!this.uploadedFile) return;


    try {
      this.isUploading = true;
      // Simulate upload - Replace with actual API call
      const result = await this.http.uploadBilling(this.uploadedFile, this.billingId, this.sessionData()?.siteId || '');
      //console.log(result);
      this.uploadedFile = null;
      //this.goBack();
      this.isUploading = false;
      alert('File uploaded successfully!');
    } catch (error) {
      //console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
      this.isUploading = false;
    } finally {
      this.isUploading = false;
    }
  }

  private async uploadFileToServer(file: File): Promise<void> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        //console.log('Uploading file for billing ID:', this.billingId);
        //console.log('File:', file.name);
        resolve();
      }, 2000);
    });

    // Real implementation example:
    /*
    const formData = new FormData();
    formData.append('file', file);
    formData.append('billingId', this.billingId);

    return this.http.post('/api/billing/upload', formData).toPromise();
    */
  }
}