import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AppInitService } from './app-init.service';
import { Router } from '@angular/router';
import { RequestAtTimeModel, RequestHistorianModel, RequestRealtimeModel } from '../models/request.model';
import { firstValueFrom, map, Observable } from 'rxjs';
import { AuthRespondModel } from '../models/auth.model';
import { ResponseTagsModel } from '../models/tags.model';
import { AddUserRequestModel, ChnagePasswordRequestModel, UpdateUserRequestModel, UserDataModel, UserRespondModel } from '../models/user.model';
import { BillingSessionModel } from '../models/billing.model';
import {
    BillingConfigByIdRequestModel,
    BillingConfigByIdResponseModel,
    BillingConfigBySiteIdRequestModel,
    BillingConfigBySiteIdResponseModel,
    BillingConfigResponseModel,
    BillingLogByIdRequestModel,
    BillingLogByIdResponseModel,
    BillingLogResponseModel,
    BillingLogsByBillingIdRequestModel,
    BillingLogsByBillingIdResponseModel,
    BillingLogsByTimestampRequestModel,
    BillingLogsByTimestampResponseModel,
    BillingResponseModel,
    BillingStateByIdRequestModel,
    BillingStateByIdResponseModel,
    BillingStateBySiteIdAndTimestampRequestModel,
    BillingStateBySiteIdAndTimestampResponseModel,
    BillingStateBySiteIdRequestModel,
    BillingStateBySiteIdResponseModel,
    BillingStateResponseModel,
    CreateBillingLogRequestModel,
    CreateBillingRequestModel,
    CreateBillingStateRequestModel,
    DeleteBillingLogRequestModel,
    DeleteBillingRequestModel,
    DeleteBillingStateRequestModel,
    GenerateConfirmationBillingRequestModel,
    GetBillingDocumentFileRequestModel,
    RejectConfirmationCustomerReviewRequestModel,
    RejectConfirmationInternalReviewRequestModel,
    UpdateBillingLogRequestModel,
    UpdateBillingRequestModel,
    UpdateBillingStateRequestModel,
    UpdateConfirmationCustomerReviewRequestModel,
    UpdateConfirmationInternalReviewRequestModel,
    UpdateInvoiceAccountingReviewRequestModel,
    UpdateInvoiceCustomerReviewRequestModel,
    UpdatePaymentAccountingReviewRequestModel,
    UpdatePaymentCustomerReviewRequestModel,
    UpdateReceiptAccountingReviewRequestModel,
    UpdateReceiptCustomerReviewRequestModel,
} from '../../features/central/models/billing.model';
import { CreateReportRequestModel, DeleteReportRequestModel, ReportConfigResponseModel, ReportResponseModel, UpdateReportRequestModel } from '../../features/central/models/report.model';
import { AddNotificationConfigModel, DeleteNotificationConfigModel, EventConfigModel, EventConfigResponseModel, EventDataModel, EventRequestModel, EventSummaryModel, ExpressionParseResultModel, FilterEventRequestModel, NotificationConfigModel, UpdateNotificationConfigModel } from '../../features/sites/models/event.model';

@Injectable({
    providedIn: 'root'
})
export class HttpService {

    private httpClient = inject(HttpClient);
    private appLoadService = inject(AppInitService);
    private router = inject(Router);


    getRealtime(requests: RequestRealtimeModel) {
        const body = requests;
        return this.httpClient.post( this.appLoadService.config.UrlApi + 'getrealtime', body).pipe(
            map((x: any) => {
                
                return x;
            })
        ).toPromise();
    }

    getAtTime(requests: RequestAtTimeModel[]) {
        const body = {
            Tags: requests[0].Tags,
            Options: {
                StartTime: requests[0].TimeStamp
            }
        };
        return this.httpClient.post( this.appLoadService.config.UrlApi + 'getattime', body).pipe(
            map((x: any) => {
                
                return x;
            })
        ).toPromise();
    }

    async getHistorian(requests: RequestHistorianModel[]) {
        const body = requests;
        return this.httpClient.post( this.appLoadService.config.UrlApi + 'gethisdata', body).pipe(
            map((x: any) => {
                
                return x;
            })
        ).toPromise();
    }

    getConfig(path: string): Promise<any[] | undefined> {
        return this.httpClient.get<any[]>(path).toPromise();
    }

    getConfig2(path: string): Promise<any> {
        return this.httpClient.get<any>(path).toPromise();
    }
    

    async getConfigFile(path: string) {
        const text = await this.httpClient.get(path, { responseType: 'text' }).toPromise();
        return text;
    }

    async authentication(username: string, password: string) {
        const body = {
            user : username,
            password : password
        };
        ////console.log(body)
        const res = await firstValueFrom(
            this.httpClient.post<AuthRespondModel>(this.appLoadService.config.UrlApiAuthen + 'userauthen', body)
        );
        
        return res;
    }

    async refreshtoken(token: string) {
        const body = {
            token : token
        };
        ////console.log(body)
        const res = await firstValueFrom(
            this.httpClient.post(this.appLoadService.config.UrlApiAuthen + 'refreshtoken', body)
        );
        
        return res;
    }

    async getTagConfigByPointSource(pointsource: string) {
        const body = {
            pointsource : pointsource,
            cal : 2
        };
        ////console.log(body)
        const res = await firstValueFrom(
            this.httpClient.post(this.appLoadService.config.UrlApi + 'getags', body)
        );
        
        return res;
    }

    async getAssistantMessage(qst: string, data: any) {
        try {
            const body = {
                Question: qst,
                Datas: data
            };
            const res = await this.httpClient.post(
                `${this.appLoadService.config.UrlApiBilling}ask`, 
                body
            ).toPromise();

            if (!res) {
                throw new Error('No file returned from server');
            }

            return res;
        } catch (error) {
            throw new Error('No file returned from server');
        }
    }

    async getReport(id: string, type: string, timestamp: string) {
        try {
            const body = {
                Type: type,
                ProjectId: id,
                Timestamp: timestamp
            };
            const res = await this.httpClient.post(
                `${this.appLoadService.config.UrlApiBilling}genreport`,
                body,
                { responseType: 'blob' }
            ).toPromise();

            if (!res) {
                throw new Error('No file returned from server');
            }

            return res;
        } catch (error) {
            throw new Error('No file returned from server');
        }
    }

    async downloadReport(id: string, type: string, timestamp: string) {
        try {
            const body = {
                Type: type,
                ProjectId: id,
                Timestamp: timestamp
            };
            const res = await this.httpClient.post(
                `${this.appLoadService.config.UrlApiBilling}genreport`,
                body,
                { responseType: 'blob' }
            ).toPromise();

            if (!res) {
                throw new Error('No file returned from server');
            }

            let blob: Blob = new Blob([res], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element
            const a = document.createElement('a');
            a.href = url;
            a.download = 'report.pdf';
            a.target = '_blank'; // Open in a new tab
            document.body.appendChild(a);
            
            // Trigger the download
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            throw new Error('No file returned from server');
        }

    }

    async generateBilling(id: string, timestamp: string, type?: string) {
        try {
            const body = {
                ProjectId: id,
                Timestamp: timestamp,
                Type: type
            };
            const res = await this.httpClient.post(
                `${this.appLoadService.config.UrlApiBilling}genbill`,
                body
            ).toPromise();
            if (!res) {
                throw new Error('No file returned from server');
            }
            //console.log(res)
            return res;
        } catch (error) {
            throw new Error('No file returned from server');
        }
    }

    async getBilling(id: string, timestamp: string, type?: string) {
        try {
            const body = {
                ProjectId: id,
                Timestamp: timestamp,
                Type: type
            };
            const res = await this.httpClient.post(
                `${this.appLoadService.config.UrlApiBilling}getbill`,
                body
            ).toPromise();
            if (!res) {
                throw new Error('No file returned from server');
            }
            //console.log(res)
            return res;
        } catch (error) {
            throw new Error('No file returned from server');
        }
    }

    async downloadBilling(id: string, timestamp: string, type?: string) {
        try {
            const body = {
                ProjectId: id,
                Timestamp: timestamp,
                Type: type
            };
            const res = await this.httpClient.post<any>(
                `${this.appLoadService.config.UrlApiBilling}getbill`,
                body
            ).toPromise();

            if (!res) {
                throw new Error('No file returned from server');
            }

            const byteArray = new Uint8Array(res.data.data);
            let blob: Blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element
            const a = document.createElement('a');
            a.href = url;
            a.download = 'billing.pdf'
            a.target = '_blank'; // Open in a new tab
            document.body.appendChild(a);
            
            // Trigger the download
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            throw new Error('No file returned from server');
        }

    }

    async approveBilling(id: string, timestamp: string, site: string) {
        try {
            const body = {
                siteId: site,
                timestamp: timestamp,
                sesseionId: id    
            };
            const res = await this.httpClient.post<any>(
                `${this.appLoadService.config.UrlApiBilling}approvebill`,
                body
            ).toPromise();

            if (!res) {
                throw new Error('No billing approved from server');
            }

            return res;
        } catch (error) {
            throw new Error('No billing approved from server');
        }

    }

    async uploadBilling(file: File, sesseionId: string, sietId: string) {
        try {
            if (!file) {
                throw new Error('No file provided for upload');
            }

            const formData = new FormData();
            formData.append('file', file, file.name);

            // server expects session id in query string as `sesseionId`
            const url = `${this.appLoadService.config.UrlApiBilling}uploadbill?sesseionId=${encodeURIComponent(sesseionId)}&siteId=${encodeURIComponent(sietId)}`;
            const res = await this.httpClient.post(url, formData).toPromise();

            if (!res) {
                throw new Error('Upload failed or no response from server');
            }

            return res;
        } catch (error: any) {
            throw new Error(error?.message || 'Upload failed');
        }

    }

    async getBillingSessionData(id: string) {
        try {
            const body = {
                sessionId: id    
            };
            const res = await this.httpClient.post<BillingSessionModel | any>(
                `${this.appLoadService.config.UrlApiBilling}getsession`,
                body
            ).toPromise();

            if (!res) {
                throw new Error('No session data returned from server');
            }

            return res;
        } catch (error) {
            throw new Error('No session data returned from server');
        }

    }

    async getBillingConfig() {
        const res = await firstValueFrom(
            this.httpClient.get<BillingConfigResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/get')
        );
        
        return res;
    };

    async getBillingConfigById(body: BillingConfigByIdRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingConfigByIdResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/find', body)
        );
        return res;
    };

    async getBillingConfigBySiteId(body: BillingConfigBySiteIdRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingConfigBySiteIdResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/getbyid', body)
        );
        return res;
    };

    async addBillingConfig(body: CreateBillingRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/set', body)
        );
        
        return res;
    };

    async updateBillingConfig(body: UpdateBillingRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/update', body)
        );
        
        return res;
    };

    async deleteBillingConfig(body: DeleteBillingRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/delete', body)
        );
        
        return res;
    };

    // billings logs
    async getAllBillingLogs() {
        const res = await firstValueFrom(
            this.httpClient.get<BillingLogResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/get')
        );
        return res;
    };

    async getBillingLogById(body: BillingLogByIdRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingLogByIdResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/find', body)
        );
        return res;
    };

    async getBillingLogsByBillingId(body: BillingLogsByBillingIdRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingLogsByBillingIdResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/find-by-billing', body)
        );
        return res;
    };

    async getBillingLogsByTimestamp(body: BillingLogsByTimestampRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingLogsByTimestampResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/find-by-timestamp', body)
        );
        return res;
    };

    async createBillingLog(body: CreateBillingLogRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/set', body)
        );
        return res;
    };

    async updateBillingLog(body: UpdateBillingLogRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/update', body)
        );
        return res;
    };

    async deleteBillingLog(body: DeleteBillingLogRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/delete', body)
        );
        return res;
    };

    async getReportConfig() {
        const res = await firstValueFrom(
            this.httpClient.get<ReportConfigResponseModel>(this.appLoadService.config.UrlApiBilling + 'report/get')
        );
        
        return res;
    };

    async addReportConfig(body: CreateReportRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<ReportResponseModel>(this.appLoadService.config.UrlApiBilling + 'report/set', body)
        );
        
        return res;
    };

    async updateReportConfig(body: UpdateReportRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<ReportResponseModel>(this.appLoadService.config.UrlApiBilling + 'report/update', body)
        );
        
        return res;
    };

    async deleteReportConfig(body: DeleteReportRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<ReportResponseModel>(this.appLoadService.config.UrlApiBilling + 'report/delete', body)
        );
        
        return res;
    };


    async getUserConfig() {
        const res = await firstValueFrom(
            this.httpClient.get<UserDataModel[]>(this.appLoadService.config.UrlApi + 'user/get', {})
        );
        
        return res;
    };

    async addUserConfig(body: AddUserRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApi + 'user/create', body)
        );
        
        return res;
    };

    async updateUserConfig(body: UpdateUserRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApi + 'user/update', body)
        );
        
        return res;
    };

    async deleteUserConfig(userId: string) {
        const body = {
            _id: userId
        };
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApi + 'user/delete', body)
        );
        return res;
    }

    async updatePassword(body: ChnagePasswordRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApi + 'user/changepassword', body)
        );
        
        return res;
    };

    async getUserSignature(user: string) {
        const body = {
            username: user
        };
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel | string>(this.appLoadService.config.UrlApi + 'user/signature', body)
        );
        
        return res;
    };

    async getAlarmEventData(request: EventRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<EventDataModel[]>(this.appLoadService.config.UrlApiNotification + 'event/data', request)
        );
        
        return res;
    };
    
    async getFilteredAlarmEventData(request: FilterEventRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<EventDataModel[]>(this.appLoadService.config.UrlApiNotification + 'event/filter', request)
        );
        
        return res;
    };

    async getSummaryAlarmEventData(request: EventRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<EventSummaryModel[]>(this.appLoadService.config.UrlApiNotification + 'event/summary', request)
        );
        
        return res;
    };


    async getAlarmEventConfig() {
        const res = await firstValueFrom(
            this.httpClient.get<EventConfigModel[] | any>(this.appLoadService.config.UrlApiNotification + 'event/gettag')
        );
        
        return res;
    };

    async setAlarmEventConfig(request: EventConfigModel[]) {
        const res = await firstValueFrom(
            this.httpClient.post<EventConfigResponseModel>(this.appLoadService.config.UrlApiNotification + 'event/settag', request)
        );
        
        return res;
    };


    async getNotificationConfig() {
        const res = await firstValueFrom(
            this.httpClient.get<NotificationConfigModel[] | any>(this.appLoadService.config.UrlApiNotification + 'config/notification')
        );
        
        return res;
    };

    async addNotificationConfig(request: AddNotificationConfigModel) {
        const res = await firstValueFrom(
            this.httpClient.post<EventConfigResponseModel>(this.appLoadService.config.UrlApiNotification + 'config/notification', request)
        );
        
        return res;
    };

    async updateNotificationConfig(request: UpdateNotificationConfigModel) {
        const res = await firstValueFrom(
            this.httpClient.put<EventConfigResponseModel>(this.appLoadService.config.UrlApiNotification + 'config/notification', request)
        );
        
        return res;
    };

    async deleteNotificationConfig(request: DeleteNotificationConfigModel) {
        const res = await firstValueFrom(
            this.httpClient.delete<EventConfigResponseModel>(
                this.appLoadService.config.UrlApiNotification + 'config/notification',
                {
                    body: request   // 👈 สำคัญมาก
                }
            )
        );

        return res;
    }
    
    async parseExpression(expr: string) {
        const request = {
            expression: expr
        };
        const res = await firstValueFrom(
            this.httpClient.post<ExpressionParseResultModel>(this.appLoadService.config.UrlApiNotification + 'calc/expression', request)
        );
        
        return res;
    };

    // billings state
    async getAllBillingStates() {
        const res = await firstValueFrom(
            this.httpClient.get<BillingStateResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/get')
        );
        return res;
    };

    async getBillingStateById(body: BillingStateByIdRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingStateByIdResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/find', body)
        );
        return res;
    };

    async getBillingStatesBySiteId(body: BillingStateBySiteIdRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingStateBySiteIdResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/find-by-site', body)
        );
        return res;
    };

    async getBillingStatesBySiteIdAndTimestamp(body: BillingStateBySiteIdAndTimestampRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingStateBySiteIdAndTimestampResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/find-by-timestamp', body)
        );
        return res;
    };

    async getBillingStateData(timestamp: string) {
        const body = {
            timestamp: timestamp
        };
        const res = await firstValueFrom(
            this.httpClient.post<BillingStateResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/find-by-timestamp-only', body)
        );
        
        return res;
    };

    async getBillingLogData(billingId: string, billingTimestamp: string) {
        const body = {
            billingId: billingId,
            billingTimestamp: billingTimestamp
        };
        const res = await firstValueFrom(
            this.httpClient.post<BillingLogResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/log/find-by-timestamp', body)
        );
        
        return res;
    };

    async createBillingState(body: CreateBillingStateRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/set', body)
        );
        return res;
    };

    async updateBillingState(body: UpdateBillingStateRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/update', body)
        );
        return res;
    };

    async deleteBillingState(body: DeleteBillingStateRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/state/delete', body)
        );
        return res;
    };

    // billings workflow (confirmation/invoice/payment/receipt)
    async generateConfirmationBilling(body: GenerateConfirmationBillingRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/confirmation/generate', body)
        );
        return res;
    };

    async updateConfirmationInternalReview(body: UpdateConfirmationInternalReviewRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/confirmation/update-internal', body)
        );
        return res;
    };

    async rejectConfirmationInternalReview(body: RejectConfirmationInternalReviewRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/confirmation/reject-internal', body)
        );
        return res;
    };

    async updateConfirmationCustomerReview(body: UpdateConfirmationCustomerReviewRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/confirmation/update-customer', body)
        );
        return res;
    };

    async rejectConfirmationCustomerReview(body: RejectConfirmationCustomerReviewRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/confirmation/reject-customer', body)
        );
        return res;
    };

    async updateInvoiceAccountingReview(body: UpdateInvoiceAccountingReviewRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/invoice/update-accounting', body)
        );
        return res;
    };

    async updateInvoiceCustomerReview(body: UpdateInvoiceCustomerReviewRequestModel) {
        const formData = new FormData();
        formData.append('file', body.file, body.file.name);
        formData.append('timestamp', body.timestamp);
        formData.append('pointsource', body.pointsource);
        if (body.status) formData.append('status', body.status);
        if (body.sitename) formData.append('sitename', body.sitename);
        if (body.username) formData.append('username', body.username);
        if (body.sendDate) formData.append('sendDate', body.sendDate);

        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/invoice/update-customer', formData)
        );
        return res;
    };

    async updatePaymentAccountingReview(body: UpdatePaymentAccountingReviewRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/payment/update-accounting', body)
        );
        return res;
    };

    async updatePaymentCustomerReview(body: UpdatePaymentCustomerReviewRequestModel) {
        const formData = new FormData();
        formData.append('file', body.file, body.file.name);
        formData.append('timestamp', body.timestamp);
        formData.append('pointsource', body.pointsource);
        if (body.status) formData.append('status', body.status);
        if (body.sitename) formData.append('sitename', body.sitename);
        if (body.username) formData.append('username', body.username);
        if (body.sendDate) formData.append('sendDate', body.sendDate);

        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/payment/update-customer', formData)
        );
        return res;
    };

    async updateReceiptAccountingReview(body: UpdateReceiptAccountingReviewRequestModel) {
        const formData = new FormData();
        formData.append('file', body.file, body.file.name);
        formData.append('timestamp', body.timestamp);
        formData.append('pointsource', body.pointsource);
        if (body.status) formData.append('status', body.status);
        if (body.sitename) formData.append('sitename', body.sitename);
        if (body.username) formData.append('username', body.username);
        if (body.sendDate) formData.append('sendDate', body.sendDate);

        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/receipt/update-accounting', formData)
        );
        return res;
    };

    async updateReceiptCustomerReview(body: UpdateReceiptCustomerReviewRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billings/receipt/update-customer', body)
        );
        return res;
    };

    // billings documents (PDF buffer)
    async getBillingDocumentFile(body: GetBillingDocumentFileRequestModel): Promise<Blob> {
        const res = await firstValueFrom(
            this.httpClient.post(this.appLoadService.config.UrlApiBilling + 'billings/document/get', body, { responseType: 'blob' })
        );
        return res as Blob;
    };
    
}