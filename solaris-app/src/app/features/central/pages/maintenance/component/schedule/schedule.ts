import { Component, effect, input, Input, OnInit, signal } from '@angular/core';
import { PlantModel, WorkOrderModel } from '../../../../../../shared/models/maintenance.model';
import { UserDataModel } from '../../../../../../shared/models/user.model';

interface GanttRow {
  wo: WorkOrderModel;
  leftPct: number;
  widthPct: number;
  color: string;
}

@Component({
  selector: 'app-schedule',
  standalone: false,
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
})
export class Schedule implements OnInit {

  @Input() plantId = '';
  plants = input<PlantModel[]>([]);
  users = input<UserDataModel[]>([]);
  orders = input<WorkOrderModel[]>([]);
  date = input<Date>(new Date());
  workOrders = signal<WorkOrderModel[]>([]);
  loading = signal(true);

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

  get monthStart(): number {
    return new Date(this.date().getFullYear(), this.date().getMonth(), 1).getTime();
  }

  get monthEnd(): number {
    return new Date(this.date().getFullYear(), this.date().getMonth() + 1, 0, 23, 59, 59).getTime();
  }

  private readonly typeColors: Record<string, string> = {
    preventive: 'var(--info)', corrective: 'var(--warning)',
    inspection: 'var(--purple)', emergency: 'var(--danger)',
  };

  // TODAY line โชว์เฉพาะเดือนปัจจุบัน — เดือนเก่า/อนาคตไม่โชว์
  get isThisMonth(): boolean {
    const now = new Date();
    const d = this.date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }

  async ngOnInit() {
  }

  private get monthSpan(): number {
    return this.monthEnd - this.monthStart;
  }

  get todayPct(): number {
    return Math.min(100, Math.max(0, (this.date().getTime() - this.monthStart) / this.monthSpan * 100));
  }

  get ganttRows(): GanttRow[] {
    const durMs = 3 * 24 * 60 * 60 * 1000;
    return this.workOrders().map(wo => {
      const dueMs   = wo.due_date ? new Date(wo.due_date).getTime() : this.date().getTime();
      const startMs = Math.max(dueMs - durMs, this.monthStart);
      const endMs   = Math.min(dueMs + Math.round(durMs * 0.5), this.monthEnd);
      const leftPct = Math.max(0, (startMs - this.monthStart) / this.monthSpan * 100);
      const widthPct = Math.max(1, Math.min(100 - leftPct, (endMs - startMs) / this.monthSpan * 100));
      return { wo, leftPct, widthPct, color: this.typeColors[wo.type] ?? 'var(--info)' };
    });
  }

  get dayLabels(): Array<{ label: string; leftPct: number }> {
    const y = this.date().getFullYear();
    const m = this.date().getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return [1, 7, 14, 21, 28]
      .filter(d => d <= daysInMonth)
      .map(day => ({
        label: String(day),
        leftPct: (new Date(y, m, day).getTime() - this.monthStart) / this.monthSpan * 100,
      }));
  }

  get thisWeek(): WorkOrderModel[] {
    const in7 = new Date(this.date());
    in7.setDate(in7.getDate() + 7);
    return this.workOrders().filter(wo => {
      if (!wo.due_date) return false;
      const d = new Date(wo.due_date);
      return d >= this.date() && d <= in7;
    }).slice(0, 8);
  }

  get overdueWorkOrders(): WorkOrderModel[] {
    return this.workOrders().filter(wo =>
      wo.due_date &&
      new Date(wo.due_date) < this.date() &&
      wo.status !== 'completed' &&
      wo.status !== 'closed'
    );
  }

  get next30Days(): WorkOrderModel[] {
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    return this.workOrders().filter(wo => wo.due_date && new Date(wo.due_date) <= in30);
  }

  get currentMonth(): string {
    return this.date().toLocaleString('en', { month: 'long', year: 'numeric' }).toUpperCase();
  }
}
