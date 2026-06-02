import { Component, computed, effect, inject, input, Input, OnInit, output, signal } from '@angular/core';
import { HttpService } from '../../../../../../shared/services/http.service';
import {
  WorkOrderModel, WorkOrderType,
  MaintenanceScheduleModel,
  PlantModel
} from '../../../../../../shared/models/maintenance.model';
import { PlantStatusData } from '../../../../../../shared/components/piechart/piechart';
import { UserDataModel } from '../../../../../../shared/models/user.model';

@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview implements OnInit {

  @Input() plantId = '';
  plants = input<PlantModel[]>([]);
  users = input<UserDataModel[]>([]);
  orders = input<WorkOrderModel[]>([]);
  date = input<Date>(new Date());
  selectWO = output<number>();

  workOrders = signal<WorkOrderModel[]>([]);
  schedules = signal<MaintenanceScheduleModel[]>([]);
  loading = signal(true);

  private http = inject(HttpService);

  constructor() {
    effect(() => {
      if (this.date() && this.orders().length > 0) {
        this.loading.set(false);
        this.workOrders.set(this.orders());
      } else {
        this.loading.set(false);
        this.workOrders.set([]);
      }
    });
  }

  // ── Computed stats ──────────────────────────────────────────────────────────

  scheduledCount = computed(() =>
    this.workOrders().filter(w => w.status === 'draft' || w.status === 'assigned').length
  );
  inProgressCount = computed(() =>
    this.workOrders().filter(w => w.status === 'in_progress').length
  );
  overdueCount = computed(() => {
    const today = new Date();
    return this.workOrders().filter(w =>
      w.status !== 'completed' && w.status !== 'closed' && w.status !== 'cancelled' &&
      w.due_date && new Date(w.due_date) < today
    ).length;
  });
  completedCount = computed(() =>
    this.workOrders().filter(w => w.status === 'completed' || w.status === 'closed').length
  );

  activeWorkOrders = computed(() =>
    this.workOrders().filter(w => w.status !== 'completed' && w.status !== 'closed' && w.status !== 'cancelled').slice(0, 8)
  );

  donutData = computed<PlantStatusData[]>(() => {
    const wos = this.workOrders();
    const count = (t: WorkOrderType) => wos.filter(w => w.type === t).length;
    const total = wos.length || 1;
    return [
      { label: 'Preventive', count: count('preventive'), percentage: count('preventive') / total * 100, color: '#5BC0EB', unit: 'WOs' },
      { label: 'Corrective',  count: count('corrective'),  percentage: count('corrective')  / total * 100, color: '#EF9F27', unit: 'WOs' },
      { label: 'Emergency',  count: count('emergency'),  percentage: count('emergency')  / total * 100, color: '#DC3545', unit: 'WOs' },
      { label: 'Inspection',  count: count('inspection'),  percentage: count('inspection')  / total * 100, color: '#A78BFA', unit: 'WOs' },
    ];
  });

  currentMonth = computed(() => {
    const date = this.date();
    return date.toLocaleString('en', { month: 'long', year: 'numeric' }).toUpperCase();
  });

  // Calendar helpers
  calendarCells = computed(() => {
    const now = this.date() || new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();
    const wos = this.workOrders();

    const cells: { blank: boolean; day?: number; today?: boolean; hasTasks?: boolean; taskType?: string }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ blank: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')} 00:00:00`;
      const isoDate = new Date(iso).toISOString();
      const dayWos = wos.filter(w => w.due_date && w.due_date === isoDate);
      //console.log('Day', d, 'WOs:', dayWos, 'iso:', iso, 'isoDate:', isoDate);
      const topType = dayWos[0]?.type;
      cells.push({ blank: false, day: d, today: d === today, hasTasks: dayWos.length > 0, taskType: topType });
    }
    return cells;
  });

  kpis = computed(() => {
    const completed = this.workOrders().filter(w => w.status === 'completed' || w.status === 'closed');
    return { availability: 100, totalCompleted: completed.length };
  });

  async ngOnInit() {
    //await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    const ts = new Date(this.date());
    const startOfMonth = new Date(ts.getFullYear(), ts.getMonth(), 2).toISOString().slice(0, 10);
    const endOfMonth = new Date(ts.getFullYear(), ts.getMonth() + 1, 1).toISOString().slice(0, 10);
    const body = { start_time: startOfMonth, end_time: endOfMonth };
    try {
      // const [woRes, schRes] = await Promise.all([
      //   this.http.getAllWorkOrders(),
      //   this.http.getAllMaintenanceSchedules(),
      // ]);
      const woRes = await this.http.getWorkOrderByDate(body);
      if (woRes.status === 'success' && woRes.data) this.workOrders.set(woRes.data);
      //if (schRes.status === 'success' && schRes.data) this.schedules.set(schRes.data);
    } catch (_) {}
    this.loading.set(false);
  }

  typeIcon(type?: string): string {
    const icons: Record<string, string> = {
      emergency: 'warning', corrective: 'build_circle',
      preventive: 'event_repeat', inspection: 'fact_check',
    };
    return icons[type ?? ''] ?? 'handyman';
  }

  typeColor(type?: string): string {
    const colors: Record<string, string> = {
      emergency: '#DC3545', corrective: '#EF9F27',
      preventive: '#5BC0EB', inspection: '#A78BFA',
    };
    return colors[type ?? ''] ?? '#667079';
  }

  statusLabel(status: string): string {
    return status.replace('_', ' ').toUpperCase();
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      draft: 's-schedule', open: 's-schedule', in_progress: 's-progress',
      on_hold: 's-onhold', completed: 's-completed', cancelled: 's-cancelled',
    };
    return map[status] ?? 's-schedule';
  }

  isOverdue(wo: WorkOrderModel): boolean {
    if (!wo.due_date || wo.status === 'completed' || wo.status === 'closed' || wo.status === 'cancelled') return false;
    return new Date(wo.due_date) < new Date();
  }

  calDotColor(type?: string): string {
    const colors: Record<string, string> = {
      emergency: '#DC3545', corrective: '#EF9F27',
      preventive: '#2BB673', inspection: '#A78BFA',
    };
    return colors[type ?? ''] ?? '#2BB673';
  }

  weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
}
