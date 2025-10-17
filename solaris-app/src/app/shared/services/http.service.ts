import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AppInitService } from './app-init.service';
import { Router } from '@angular/router';
import { RequestAtTimeModel, RequestHistorianModel, RequestRealtimeModel } from '../models/request.model';
import { firstValueFrom, map } from 'rxjs';
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
        const body = requests;
        return this.httpClient.post( this.appLoadService.config.UrlApi + 'getrealtime', body).pipe(
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
    

    getConfigFile(path: string): Promise<any> {
        return this.httpClient.get<any>(path).toPromise();
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

    async getReport(name: string) {
        const res = await this.httpClient.get(name, {
            responseType: 'blob' // ✅ ไม่ต้อง cast เป็น 'json'
        }).toPromise();

        if (!res) {
            throw new Error('No blob returned from server');
        }

        return res;
    }

    async downloadReport(name: string, type: string) {
        try {
            const res = await this.httpClient.get(name, {
                responseType: 'blob' // ✅ ไม่ต้อง cast เป็น 'json'
            }).toPromise();

            if (!res) {
                throw new Error('No blob returned from server');
            }
            
            // Create a blob URL for the PDF content
            let blob: Blob = new Blob([res], { type: 'application/pdf' });
            if(type == "EXCEL"){
                blob = new Blob([res], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
            }
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element
            const a = document.createElement('a');
            a.href = url;
            a.download = name.split('/')[2]; // Specify the file name
            a.target = '_blank'; // Open in a new tab
            document.body.appendChild(a);
            
            // Trigger the download
            a.click();
            
            // Clean up
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error downloading report:', error);
            // Handle errors, if any
        }
    }
    
}