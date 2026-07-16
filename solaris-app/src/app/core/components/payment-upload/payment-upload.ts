import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpService } from '../../../shared/services/http.service';
import { BillingStateBySiteIdAndTimestampRequestModel, BillingStateBySiteIdAndTimestampResponseModel, BillingStateDataModel, UpdatePaymentCustomerReviewRequestModel } from '../../../features/central/models/billing.model';

@Component({
  selector: 'app-payment-upload',
  templateUrl: './payment-upload.html',
  styleUrl: './payment-upload.scss',
  standalone: false
})
export class PaymentUpload implements OnInit {

  private router = inject(Router);
  private location = inject(Location);
  private httpService = inject(HttpService);

  billingId: any = '';
  billingStateData: any = null;
  billingState: BillingStateDataModel | null = null;
  uploadedFile: File | null = null;
  isDragOver = false;
  isUploading = false;
  sendDate: string = '';
  userName: string = '';

  // ✅ New filename format
  fileNamePattern: RegExp = /^Invoice_Billing_[A-Za-z0-9]+_\d{4}-\d{2}\.pdf$/;

  ngOnInit(): void {
    const user = localStorage.getItem('user');
    if (user) {
      this.userName = user || '';
    } else {
      alert('User not found. Please login again.');
      this.router.navigate(['/login']);
      return;
    }
    const segments = this.router.url.split('/');
    const billingId = segments[segments.length - 1];
    if(billingId) {
      const data = this.safeBase64Decode(billingId);
      this.billingStateData = JSON.parse(data);
      if(!this.billingStateData || !this.billingStateData.pointsource || !this.billingStateData.timestamp) {
        alert('Invalid billing data');
        this.router.navigate(['/main/overview']);
        return;
      }
      const timestamp = this.billingStateData.timestamp;
      const month = new Date(timestamp).getMonth() + 1;
      const year = new Date(timestamp).getFullYear();
      const pattern = `^Invoice_Billing_${this.billingStateData.pointsource}_${year}-${month.toString().padStart(2, '0')}\\.pdf$`;
      this.fileNamePattern = new RegExp(pattern);

      this.getBillingState();
    } else {
      alert('Invalid billing ID');
      this.router.navigate(['/main/overview']);
    }
  }

  async getBillingState(): Promise<void> {
    try {
      const body: BillingStateBySiteIdAndTimestampRequestModel = {
        siteId: this.billingStateData.pointsource,
        timestamp: this.billingStateData.timestamp
      };
      const response: BillingStateBySiteIdAndTimestampResponseModel = await this.httpService.getBillingStatesBySiteIdAndTimestamp(body);
      if (response.status === 'success') {
        this.billingState = response.data[0];
        if(!this.billingState) {
          alert('No billing state found for the given site and timestamp');
          this.router.navigate(['/main/overview']);
        }

        //if(this.billingState.billing_process !== 'payment') {
          //alert('Current billing process is not in "payment" stage. Please check the billing state and try again.');
          //this.router.navigate(['/main/overview']);
        //}
      } else {
        alert('Failed to fetch billing state');
      }

    } catch (error) {
      console.error('Error fetching billing state:', error);
    }
  };

  goBack(): void {
    this.router.navigate(['/main/overview']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.addFile(input.files[0]);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer?.files?.[0]) {
      this.addFile(event.dataTransfer.files[0]);
    }
  }

  addFile(file: File): void {
    const maxSize = 10 * 1024 * 1024;

    // if (file.type !== 'application/pdf') {
    //   alert('Only PDF allowed');
    //   return;
    // }

    if (file.size > maxSize) {
      alert('File too large (max 10MB)');
      return;
    }

    // if (!this.fileNamePattern.test(file.name)) {
    //   alert(
    //     `Invalid filename\n\n` +
    //     `Expected: Invoice_Billing_XXX_YYYY-MM.pdf\n`
    //   );
    //   return;
    // }

    this.uploadedFile = file;
  }

  removeFile(): void {
    this.uploadedFile = null;
    this.sendDate = '';
  }

  clearFile(): void {
    if (confirm('Clear file?')) {
      this.removeFile();
    }
  }

  getTodayDate(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  async submitFile(): Promise<void> {
    if (!this.uploadedFile) return;

    // if (!this.sendDate) {
    //   alert('Please select send date');
    //   return;
    // }

    if (!confirm('Submit file?')) {
      return;
    }

    this.isUploading = true;

    try {
      const payload: UpdatePaymentCustomerReviewRequestModel = {
        file: this.uploadedFile,
        timestamp: this.billingStateData.timestamp,   // 🔥 ต้องตรง backend
        pointsource: this.billingStateData.pointsource,          // 🔥 TODO: dynamic
        status: 'customer_paid',
        username: this.userName
      };

      const res = await this.httpService.updatePaymentCustomerReview(payload);
      if (!res || !res.StatusCode.toLowerCase().includes('success')) {
        throw new Error(res?.Message || 'Upload failed');
      }

      alert('Upload success!');
      this.removeFile();
      this.goBack();

    } catch (err: any) {
      console.error(err);
      alert('Upload failed : ' + err.message);
    } finally {
      this.isUploading = false;
    }
  }

  safeBase64Decode(base64: string): string {
    try {
      // ✅ step 1: decode URL encoding ก่อน
      base64 = decodeURIComponent(base64);

      // ✅ step 2: fix URL-safe base64 (เผื่อมี - _)
      base64 = base64.replace(/-/g, '+').replace(/_/g, '/');

      // ✅ step 3: fix padding
      while (base64.length % 4) {
        base64 += '=';
      }

      // ✅ step 4: decode base64
      return decodeURIComponent(
        escape(atob(base64))
      );

    } catch (e) {
      console.error("Invalid Base64:", base64);
      throw e;
    }
  }
}