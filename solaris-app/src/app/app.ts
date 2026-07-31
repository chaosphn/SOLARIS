import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme.service';
import { HttpService } from './shared/services/http.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: false
})
export class App {
  protected readonly title = signal('solaris-app');

  private theme = inject(ThemeService);
  private http = inject(HttpService);

  constructor(){
    // ตั้งธีมตั้งแต่ bootstrap เพื่อให้หน้า login ที่ยังไม่มี navbar ได้ธีมด้วย
    this.theme.initTheme();
    this.checkTokenAuthorization();
  }

  async checkTokenAuthorization(){
    const token = localStorage.getItem('token') || '';
    await this.http.checkToken(token);
  }
}
