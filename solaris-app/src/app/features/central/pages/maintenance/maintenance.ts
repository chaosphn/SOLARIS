import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../../shared/services/auth.service';
import { HttpService } from '../../../../shared/services/http.service';
import { UserDataModel } from '../../../../shared/models/user.model';
import { PlantModel, WorkOrderModel } from '../../../../shared/models/maintenance.model';

export type MaintenanceTab = 'overview' | 'schedule' | 'workorders' | 'history';

@Component({
  selector: 'app-maintenance',
  standalone: false,
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class Maintenance implements OnInit {

  activeTab = signal<MaintenanceTab>('overview');
  plantId = signal<string>('');
  closeoutWoId = signal<number | null>(null);
  today = signal<Date>(new Date());

  workOrders  = signal<WorkOrderModel[]>([]);
  plants      = signal<PlantModel[]>([]);
  users       = signal<UserDataModel[]>([]);

  role = signal<string>('user');
  isAdmin = computed(() => this.role() === 'administrator');

  private store = inject(Store);
  private http = inject(HttpService);
  private auth = inject(AuthService);

  async ngOnInit() {
    const nav = await firstValueFrom(this.store.select(getNavState));
    if (nav?.name) {
      this.plantId.set(nav.name);
    }
    this.role.set(this.auth.getRole() ?? 'user');
    // non-admin: Overview tab ถูกซ่อน → เริ่มที่ Work Orders แทน
    if (!this.isAdmin() && this.activeTab() === 'overview') {
      this.activeTab.set('workorders');
    }
    await this.loadPlants();
    await this.loadUsers();
    if(this.users().length > 0) {
      await this.loadData();
    }
    //await Promise.all([this.loadData(), this.loadPlants(), this.loadUsers()]);
  }

  async loadPlants() {
    try {
      const res = await this.http.getPlants();
      if (res.status === 'success' && res.data && res.data.length > 0) this.plants.set(res.data);
    } catch (_) {}
  }

  async loadUsers() {
    try {
      const res = await this.http.getUserConfig();
      if (Array.isArray(res)) this.users.set(res);
    } catch (_) {}
  }

  async loadData() {
    const ts = new Date(this.today());
    const startOfMonth = new Date(ts.getFullYear(), ts.getMonth(), 2).toISOString().slice(0, 10);
    const endOfMonth = new Date(ts.getFullYear(), ts.getMonth() + 1, 1).toISOString().slice(0, 10);
    const user = this.auth.getUser();
    const userData = this.users().find(u => u.username === user);
    try {
      if(this.role() === 'administrator') {
        const woRes = await this.http.getWorkOrderByDate({ start_time: startOfMonth, end_time: endOfMonth });
        if (woRes.status === 'success' && woRes.data) this.workOrders.set(woRes.data);
      } else {
        const woRes = await this.http.getWorkOrdersByAssignee({ start_time: startOfMonth, end_time: endOfMonth, assigned_to: userData?._id?.toString() ?? '' });
        if (woRes.status === 'success' && woRes.data) this.workOrders.set(woRes.data);
      }
    } catch (_) {}
  }

  setTab(tab: MaintenanceTab) {
    this.activeTab.set(tab);
    this.closeoutWoId.set(null);
  }

  openCloseout(id: number) {
    this.closeoutWoId.set(id);
    this.activeTab.set('workorders');
  }

  exitCloseout() {
    this.closeoutWoId.set(null);
  }

  onDateSelect(event: any) {
    this.today.set(event);
    this.loadData();
  }
}
