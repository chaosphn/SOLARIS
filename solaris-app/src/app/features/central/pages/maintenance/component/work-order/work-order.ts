import { Component, computed, effect, inject, input, Input, OnInit, output, signal } from '@angular/core';
import { HttpService } from '../../../../../../shared/services/http.service';
import { AuthService } from '../../../../../../shared/services/auth.service';
import {
  WorkOrderModel, WorkOrderStatus, WorkOrderType, WorkOrderPriority,
  CreateWorkOrderRequest, UpdateWorkOrderRequest, ChecklistItemModel,
  WoReportModel, CreateWoReportRequest, UpdateWoReportRequest, FollowupAction,
  PlantModel
} from '../../../../../../shared/models/maintenance.model';
import { UserDataModel } from '../../../../../../shared/models/user.model';
import { Store } from '@ngrx/store';
import { sendMessage } from '../../../../../../store/actions/toaster.actions';

@Component({
  selector: 'app-work-order',
  standalone: false,
  templateUrl: './work-order.html',
  styleUrl: './work-order.scss',
})
export class WorkOrder implements OnInit {

  @Input() plantId = '';
  @Input() closeoutWoId: number | null = null;
  plants = input<PlantModel[]>([]);
  users = input<UserDataModel[]>([]);
  orders = input<WorkOrderModel[]>([]);
  date = input<Date>(new Date());

  selectWO     = output<number>();
  exitCloseout = output<void>();

  workOrders  = signal<WorkOrderModel[]>([]);
  loading     = signal(true);
  filter      = signal<string>('all');
  searchQuery = signal('');
  showForm    = signal(false);
  selectedWO  = signal<WorkOrderModel | null>(null);

  // ── Checklist ───────────────────────────────────────────────────────────────
  checklists           = signal<ChecklistItemModel[]>([]);
  checklistNewLabel    = signal('');
  checklistNewSublabel = signal('');
  checklistLoading     = signal(false);
  checklistAdding      = signal(false);

  // ── Report ──────────────────────────────────────────────────────────────────
  report           = signal<WoReportModel | null>(null);
  reportForm       = signal({
    work_date: '', start_time: '', end_time: '',
    duration_min: null as number | null,
    summary: '', findings: '', spare_parts_used: '',
    followup_action: 'none' as FollowupAction,
  });
  reportFile       = signal<File | null>(null);
  reportSubmitting = signal(false);

  // ── New WO form ─────────────────────────────────────────────────────────────
  form = signal({
    plant_id: '', title: '', type: 'preventive' as WorkOrderType,
    priority: 'medium' as WorkOrderModel['priority'],
    assigned_to: '', due_date: '', description: '', equipment_id: '',
    checklists: [] as { label: string; sub_label: string }[],
  });
  newWoChecklists = signal<{ label: string; sub_label: string }[]>([]);

  // ── Edit WO form ─────────────────────────────────────────────────────────────
  editForm = signal({
    title: '', type: 'preventive' as WorkOrderType,
    priority: 'medium' as WorkOrderPriority,
    assigned_to: '', due_date: '', equipment_id: '', description: '',
  });
  woUpdating = signal(false);

  role = signal<string>('user');

  private http = inject(HttpService);
  private auth = inject(AuthService);
  private store = inject(Store);

  constructor() {
    effect(async () => {
      if (this.date() && this.orders().length > 0) {
        this.loading.set(false);
        this.workOrders.set(this.orders());
      } else {
        this.loading.set(false);
        this.workOrders.set([]);
      }
    });
  }

  currentUser = signal(this.auth.getUser() ?? 'unknown');

  // ── Computed ────────────────────────────────────────────────────────────────
  filteredWOs = computed(() => {
    const q     = this.searchQuery().toLowerCase();
    const f     = this.filter();
    const today = new Date();
    return this.workOrders().filter(w => {
      const matchSearch = !q || w.title.toLowerCase().includes(q) ||
        w.wo_number?.toLowerCase().includes(q) || w.plant_id?.toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (f === 'all') return true;
      if (f === 'overdue')
        return w.status !== 'completed' && w.status !== 'closed' && w.status !== 'cancelled' &&
               !!w.due_date && new Date(w.due_date) < today;
      return w.status === f;
    });
  });

  checklistDone    = computed(() => this.checklists().filter(c => c.is_done).length);
  checklistPercent = computed(() => {
    const total = this.checklists().length;
    return total ? Math.round(this.checklistDone() / total * 100) : 0;
  });

  woProgress = computed(() => {
    const r    = this.report();
    const rf   = this.reportForm();
    const cl   = this.checklists();
    const done = this.checklistDone();
    const steps = [
      {
        label: 'Time log',
        done: !!(rf.work_date && rf.start_time && rf.end_time),
        inProgress: !!rf.work_date && !(rf.start_time && rf.end_time),
      },
      {
        label: 'Checklist',
        done: cl.length > 0 && done === cl.length,
        inProgress: done > 0 && done < cl.length,
      },
      {
        label: 'Work report',
        done: !!(r?.summary),
        inProgress: !!rf.work_date && !r?.summary,
      },
      {
        label: 'Site photos',
        done: !!(r?.report_path),
        inProgress: false,
      },
      {
        label: 'Signature',
        done: false,
        inProgress: false,
      },
    ];
    const totalDone = steps.filter(s => s.done).length;
    return { steps, percent: Math.round(totalDone / steps.length * 100) };
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  async ngOnInit() {
    // await Promise.all([this.loadData(), this.loadPlants(), this.loadUsers()]);
    this.role.set(this.auth.getRole() ?? 'user');
  }

  async loadPlants() {
    try {
      const res = await this.http.getPlants();
      //if (res.status === 'success' && res.data && res.data.siteList) this.plants.set(res.data.siteList);
    } catch (_) {}
  }

  async loadUsers() {
    try {
      const res = await this.http.getUserConfig();
      //if (Array.isArray(res)) this.users.set(res);
    } catch (_) {}
  }

  async loadData() {
    this.loading.set(true);
    const ts = new Date(this.date());
    const startOfMonth = new Date(ts.getFullYear(), ts.getMonth(), 2).toISOString().slice(0, 10);
    const endOfMonth = new Date(ts.getFullYear(), ts.getMonth() + 1, 1).toISOString().slice(0, 10);
    try {
      const woRes = await this.http.getWorkOrderByDate({ start_time: startOfMonth, end_time: endOfMonth });
      if (woRes.status === 'success' && woRes.data) this.workOrders.set(woRes.data);
    } catch (_) {}
    this.loading.set(false);
  }

  async openDetail(wo: WorkOrderModel) {
    this.selectedWO.set(wo);
    this.selectWO.emit(wo.id);
    this.initEditForm(wo);
    await this._loadDetail(wo.id);
  }

  private initEditForm(wo: WorkOrderModel) {
    const dueDate = wo.due_date ? new Date(wo.due_date).getTime() : '';
    const localDueDate = dueDate ? new Date((dueDate) + (7 * 60 * 60 * 1000)) : '';
    this.editForm.set({
      title:        wo.title        ?? '',
      type:         wo.type         ?? 'preventive',
      priority:     wo.priority     ?? 'medium',
      assigned_to:  wo.assigned_to  ?? '',
      due_date:     localDueDate ? localDueDate.toISOString().slice(0, 10) : '',
      equipment_id: wo.equipment_id ?? '',
      description:  wo.description  ?? '',
    });
  }

  patchEditForm(patch: Partial<ReturnType<typeof this.editForm>>) {
    this.editForm.update(f => ({ ...f, ...patch }));
  }

  async updateWO() {
    const wo = this.selectedWO();
    if (!wo || !this.editForm().title.trim()) return;
    this.woUpdating.set(true);
    try {
      const f = this.editForm();
      //const date = new Date(f.due_date).getTime() + (7 * 60 * 60 * 1000); // set to end of day
      const due_date = f.due_date ? new Date(f.due_date).toISOString().slice(0, 10) : undefined;
      const body: UpdateWorkOrderRequest = {
        id:           wo.id,
        title:        f.title        || undefined,
        type:         f.type         || undefined,
        priority:     f.priority     || undefined,
        assigned_to:  f.assigned_to  || null,
        due_date:     due_date       || undefined,
        equipment_id: f.equipment_id || undefined,
        description:  f.description  || undefined,
      };
      const res = await this.http.updateWorkOrder(body);
      if (res.status === 'success') {
        this.selectedWO.update(w => w ? { ...w, ...f } : w);
        await this.loadData();
      } else if (res.message) {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: res.message }
        }));
      }
    } catch (_) {}
    this.woUpdating.set(false);
  }

  private async _loadDetail(woId: number) {
    await Promise.all([this.loadChecklists(woId), this.loadReport(woId)]);
  }

  closeDetail() {
    this.selectedWO.set(null);
    this.checklists.set([]);
    this.report.set(null);
    this.reportFile.set(null);
    this.exitCloseout.emit();
  }

  // ── Checklist ───────────────────────────────────────────────────────────────
  async loadChecklists(woId: number) {
    try {
      const res = await this.http.getChecklistsByWorkOrder({ work_order_id: woId });
      if (res.status === 'success' && res.data) this.checklists.set(res.data);
      return res.status === 'success' && res.data ? true : false;
    } catch (_) {return false;}
  }

  async toggleChecklist(item: ChecklistItemModel) {
    try {
      await this.http.toggleChecklist({ id: item.id });
      const updatedChecklists = await this.loadChecklists(this.selectedWO()!.id);
      console.log(item);
      if (updatedChecklists) {
        if(!item.is_done){
          await this.updateStatus(this.selectedWO()!, 'in_progress');
        } else {
          const notAllDone = this.checklists().some(c => c.id !== item.id && !c.is_done);
          if(!notAllDone){
            await this.updateStatus(this.selectedWO()!, 'assigned');
          }
        }
      }
    } catch (_) {}
  }

  async addChecklist() {
    const label     = this.checklistNewLabel().trim();
    const sub_label = this.checklistNewSublabel().trim() || undefined;
    if (!label || !this.selectedWO()) return;
    this.checklistLoading.set(true);
    try {
      await this.http.createChecklist({ work_order_id: this.selectedWO()!.id, label, sub_label });
      this.checklistNewLabel.set('');
      this.checklistNewSublabel.set('');
      this.checklistAdding.set(false);
      await this.loadChecklists(this.selectedWO()!.id);
    } catch (_) {}
    this.checklistLoading.set(false);
  }

  async deleteChecklist(id: number) {
    try {
      await this.http.deleteChecklist({ id });
      await this.loadChecklists(this.selectedWO()!.id);
    } catch (_) {}
  }

  // ── Report ──────────────────────────────────────────────────────────────────
  async loadReport(woId: number) {
    try {
      const res = await this.http.getWoReport({ work_order_id: woId });
      if (res.status === 'success' && res.data) {
        const r = res.data;
        this.report.set(r);
        this.reportForm.set({
          work_date:        r.work_date || '',
          start_time:       r.start_time || '',
          end_time:         r.end_time || '',
          duration_min:     r.duration_min ?? null,
          summary:          r.summary || '',
          findings:         r.findings || '',
          spare_parts_used: r.spare_parts_used || '',
          followup_action:  r.followup_action || 'none',
        });
      } else {
        this.report.set(null);
        this.reportForm.set({
          work_date:        new Date().toISOString().slice(0, 10),
          start_time: '', end_time: '', duration_min: null,
          summary: '', findings: '', spare_parts_used: '',
          followup_action: 'none',
        });
      }
    } catch (_) {}
  }

  async submitReport() {
    const wo = this.selectedWO();
    if (!wo || !this.reportForm().work_date) return;
    if(!this.reportForm().start_time || !this.reportForm().end_time) {
      this.store.dispatch(sendMessage({ 
                payload: { type: 'warn', text: 'Please select start and end times !' }
              }));
      return;
    }
    if(this.checklists().length > 0 && !this.checklists().every(c => c.is_done)) {
      this.store.dispatch(sendMessage({ 
                payload: { type: 'warn', text: 'Please complete all checklist items !' }
              }));
      return;
    }
    this.reportSubmitting.set(true);
    try {
      const f        = this.reportForm();
      const existing = this.report();
      if (existing) {
        const body: UpdateWoReportRequest = {
          id:               existing.id,
          work_date:        f.work_date,
          start_time:       f.start_time  || undefined,
          end_time:         f.end_time    || undefined,
          duration_min:     f.duration_min ?? undefined,
          summary:          f.summary     || undefined,
          findings:         f.findings    || undefined,
          spare_parts_used: f.spare_parts_used || undefined,
          followup_action:  f.followup_action,
          file:             this.reportFile() ?? undefined,
        };
        const res = await this.http.updateWoReport(body);
        if (res.status === 'success') {
          await this.loadReport(wo.id)
        } else if (res.message) {
          this.store.dispatch(sendMessage({
            payload: { type: 'error', text: res.message }
          }));
        }
      } else {
        const body: CreateWoReportRequest = {
          work_order_id:    wo.id,
          submitted_by:     this.currentUser(),
          work_date:        f.work_date,
          start_time:       f.start_time  || undefined,
          end_time:         f.end_time    || undefined,
          duration_min:     f.duration_min ?? undefined,
          summary:          f.summary     || undefined,
          findings:         f.findings    || undefined,
          spare_parts_used: f.spare_parts_used || undefined,
          followup_action:  f.followup_action,
          file:             this.reportFile() ?? undefined,
        };
        const res = await this.http.createWoReport(body);
        if (res.status === 'success') {
          await this.loadReport(wo.id);
          await this.updateStatus(wo, 'completed');
        } else if (res.message) {
          this.store.dispatch(sendMessage({
            payload: { type: 'error', text: res.message }
          }));
        }
      }
      this.reportFile.set(null);
    } catch (_) {}
    this.reportSubmitting.set(false);
  }

  onReportFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.reportFile.set(input.files?.[0] ?? null);
  }

  patchReportForm(patch: Partial<ReturnType<typeof this.reportForm>>) {
    this.reportForm.update(f => ({ ...f, ...patch }));
  }

  onTimeChange(field: 'start_time' | 'end_time', value: string) {
    const start = field === 'start_time' ? value : this.reportForm().start_time;
    const end   = field === 'end_time'   ? value : this.reportForm().end_time;
    this.patchReportForm({ [field]: value, duration_min: this.calcDuration(start, end) });
  }

  calcDuration(start: string, end: string): number | null {
    if (!start || !end) return null;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff : null;
  }

  formatDuration(mins: number | null): string {
    if (!mins || mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // ── Work Order CRUD ─────────────────────────────────────────────────────────
  async submitNewWO() {
    const f = this.form();
    if (!f.title) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'warn', text: 'Title is required !' }
      }));
      return;
    };
    if(!f.plant_id) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'warn', text: 'Plant is required !' }
      }));
      return;
    }
    if(!f.due_date) {
      this.store.dispatch(sendMessage({ 
        payload: { type: 'warn', text: 'Due date is required !' }
      }));
      return;
    }
    const body: CreateWorkOrderRequest = {
      plant_id:     f.plant_id || this.plantId,
      title:        f.title,
      created_by:   this.currentUser(),
      type:         f.type,
      priority:     f.priority,
      status:       f.assigned_to ? 'assigned' : 'draft',
      assigned_to:  f.assigned_to  || undefined,
      due_date:     f.due_date     || undefined,
      description:  f.description  || undefined,
      equipment_id: f.equipment_id || undefined,
      checklists:   this.newWoChecklists()
        .filter(c => c.label.trim())
        .map((c, i) => ({ label: c.label.trim(), sub_label: c.sub_label.trim() || undefined, seq: i + 1 })),
    };
    try {
      const res = await this.http.createWorkOrder(body);
      if (res.status === 'success') {
        this.cancelNewWO();
        await this.loadData();
      } else if (res.message) {
        this.store.dispatch(sendMessage({ 
          payload: { type: 'error', text: res.message }
        }));
      }
    } catch (_) {}
  }

  cancelNewWO() {
    this.showForm.set(false);
    this.newWoChecklists.set([]);
    this.form.set({
      plant_id: '', title: '', type: 'preventive',
      priority: 'medium', assigned_to: '', due_date: '', description: '', equipment_id: '',
      checklists: [],
    });
  }

  addNewWoChecklist() {
    this.newWoChecklists.update(list => [...list, { label: '', sub_label: '' }]);
  }

  removeNewWoChecklist(i: number) {
    this.newWoChecklists.update(list => list.filter((_, idx) => idx !== i));
  }

  patchNewWoChecklist(i: number, patch: { label?: string; sub_label?: string }) {
    this.newWoChecklists.update(list =>
      list.map((item, idx) => idx === i ? { ...item, ...patch } : item)
    );
  }

  async updateStatus(wo: WorkOrderModel, status: WorkOrderStatus) {
    try {
      await this.http.updateWorkOrderStatus({ id: wo.id, status });
      this.selectedWO.update(w => w ? { ...w, status } : w);
      await this.loadData();
    } catch (_) {}
  }

  async deleteWO(wo: WorkOrderModel) {
    try {
      await this.http.deleteWorkOrder({ id: wo.id });
      if (this.selectedWO()?.id === wo.id) this.closeDetail();
      await this.loadData();
    } catch (_) {}
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  typeIcon(type?: string): string {
    const icons: Record<string, string> = {
      emergency: 'warning', corrective: 'build_circle',
      preventive: 'event_repeat', inspection: 'fact_check',
    };
    return icons[type ?? ''] ?? 'handyman';
  }

  statusLabel(s: string) { return s.replace('_', ' ').toUpperCase(); }

  statusClass(s: string) {
    const m: Record<string, string> = {
      draft: 's-schedule', assigned: 's-schedule', in_progress: 's-progress',
      completed: 's-completed', closed: 's-completed', cancelled: 's-cancelled',
    };
    return m[s] ?? 's-schedule';
  }

  isOverdue(wo: WorkOrderModel) {
    return wo.status !== 'completed' && wo.status !== 'closed' && wo.status !== 'cancelled' &&
           !!wo.due_date && new Date(wo.due_date) < new Date();
  }

  patchForm(patch: Partial<ReturnType<typeof this.form>>) {
    this.form.update(f => ({ ...f, ...patch }));
  }

  userDisplayName(u: UserDataModel): string {
    return u.fullname || `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username;
  }

  userDisplayNameFromId(id: string | undefined): string {
    const user = this.users().find(u => u._id === id);
    return user ? this.userDisplayName(user) : id || 'Unknown User';
  }

  statusOptions: WorkOrderStatus[] = ['draft', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled'];
  typeOptions:   WorkOrderType[]   = ['preventive', 'corrective', 'inspection', 'emergency'];
  followupOptions: { value: FollowupAction; label: string }[] = [
    { value: 'none',          label: 'No follow-up needed' },
    { value: 'monitor',       label: 'Continue monitoring' },
    { value: 'schedule_next', label: 'Schedule next maintenance' },
    { value: 'escalate',      label: 'Escalate to supervisor' },
  ];

  siteName(plantId: string): string {
    return this.plants().find(p => p.id === plantId)?.name ?? plantId;
  }
}
