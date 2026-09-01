import { Component, computed, effect, input, Input, OnInit, signal } from '@angular/core';
import { MaintenanceLogModel, PlantModel, WorkOrderModel } from '../../../../../../shared/models/maintenance.model';
import { UserDataModel } from '../../../../../../shared/models/user.model';

interface LogGroup { month: string; items: MaintenanceLogModel[] }

@Component({
  selector: 'app-history',
  standalone: false,
  templateUrl: './history.html',
  styleUrl: './history.scss',
})
export class History implements OnInit {

  @Input() plantId = '';
  plants = input<PlantModel[]>([]);
  users = input<UserDataModel[]>([]);
  orders = input<WorkOrderModel[]>([]);
  date = input<Date>(new Date());
  
  logs      = signal<MaintenanceLogModel[]>([]);
  workOrders = signal<WorkOrderModel[]>([]);
  loading   = signal(true);
  filter    = signal<string>('all');
  searchQuery = signal('');

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

  // ── Stats ───────────────────────────────────────────────────────────────────
  completedWOs = computed(() => this.workOrders().filter(w => w.status === 'completed'));
  cancelledWOs = computed(() => this.workOrders().filter(w => w.status === 'cancelled'));

  // ── Filtered & grouped log ──────────────────────────────────────────────────
  filteredLogs = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const f = this.filter();
    let items = this.logs();
    if (f !== 'all') items = items.filter(l => l.to_status === f);
    if (q) items = items.filter(l =>
      l.wo_number?.toLowerCase().includes(q) ||
      l.action?.toLowerCase().includes(q) ||
      l.user?.toLowerCase().includes(q)
    );
    return items;
  });

  grouped = computed<LogGroup[]>(() => {
    const groups: Record<string, MaintenanceLogModel[]> = {};
    for (const l of this.filteredLogs()) {
      const date = l.timestamp ? new Date(l.timestamp) : new Date();
      const key = date.toLocaleString('en', { month: 'long', year: 'numeric' });
      (groups[key] ??= []).push(l);
    }
    return Object.entries(groups).map(([month, items]) => ({ month, items }));
  });

  async ngOnInit() {
  }

  dotClass(log: MaintenanceLogModel): string {
    if (log.to_status === 'completed') return 'dot-done';
    if (log.to_status === 'cancelled') return 'dot-cancel';
    if (log.to_status === 'in_progress') return 'dot-progress';
    return 'dot-default';
  }
}
