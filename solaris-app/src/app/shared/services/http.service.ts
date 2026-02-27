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
import { BillingConfigModel, BillingConfigResponseModel, BillingResponseModel, CreateBillingRequestModel, DeleteBillingRequestModel, UpdateBillingRequestModel } from '../../features/central/models/billing.model';
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
            this.httpClient.get<BillingConfigResponseModel>(this.appLoadService.config.UrlApiBilling + 'billing/get')
        );
        
        return res;
    };

    async addBillingConfig(body: CreateBillingRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billing/set', body)
        );
        
        return res;
    };

    async updateBillingConfig(body: UpdateBillingRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billing/update', body)
        );
        
        return res;
    };

    async deleteBillingConfig(body: DeleteBillingRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<BillingResponseModel>(this.appLoadService.config.UrlApiBilling + 'billing/delete', body)
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
            this.httpClient.post<UserDataModel[]>(this.appLoadService.config.UrlApiAuthen + 'getuser', {})
        );
        
        return res;
    };

    async addUserConfig(body: AddUserRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApiAuthen + 'adduser', body)
        );
        
        return res;
    };

    async updateUserConfig(body: UpdateUserRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApiAuthen + 'edituser', body)
        );
        
        return res;
    };

    async deleteUserConfig(userId: string) {
        const body = {
            _id: userId
        };
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApiAuthen + 'deluser', body)
        );
        return res;
    }

    async updatePassword(body: ChnagePasswordRequestModel) {
        const res = await firstValueFrom(
            this.httpClient.post<UserRespondModel>(this.appLoadService.config.UrlApiAuthen + 'chgpass', body)
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
            this.httpClient.delete<EventConfigResponseModel>(this.appLoadService.config.UrlApiNotification + 'config/notification', {
                body: request 
            })
        );
        
        return res;
    };

    async parseExpression(expr: string) {
        const request = {
            expression: expr
        };
        const res = await firstValueFrom(
            this.httpClient.post<ExpressionParseResultModel>(this.appLoadService.config.UrlApiNotification + 'calc/expression', request)
        );
        
        return res;
    };
}