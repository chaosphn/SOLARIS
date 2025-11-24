import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AppInitService } from './app-init.service';
import { Router } from '@angular/router';
import { RequestAtTimeModel, RequestHistorianModel, RequestRealtimeModel } from '../models/request.model';
import { firstValueFrom, map, Observable } from 'rxjs';
import { AuthRespondModel } from '../models/auth.model';

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

    async getAssistantMessage(qst: string, data: any) {
        try {
            const body = {
                Question: qst,
                Datas: data
            };
            const res = await this.httpClient.post(
                'http://localhost:4040/api/ask', 
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
                'http://localhost:4040/api/genReport', 
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
                'http://localhost:4040/api/genReport', 
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

    async getBilling(id: string, timestamp: string) {
        try {
            const body = {
                ProjectId: id,
                Timestamp: timestamp
            };
            const res = await this.httpClient.post(
                'http://localhost:4040/api/genbilling', 
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

    async downloadBilling(id: string, timestamp: string) {
        try {
            const body = {
                ProjectId: id,
                Timestamp: timestamp
            };
            const res = await this.httpClient.post(
                'http://localhost:4040/api/genbilling', 
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
    
}