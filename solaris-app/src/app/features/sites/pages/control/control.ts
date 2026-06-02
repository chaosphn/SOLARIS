import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { SiteModel } from '../../../../shared/models/config.model';
import { HttpService } from '../../../../shared/services/http.service';
import { NavbarStateModel } from '../../../../shared/models/navigate.model';
import { getNavState } from '../../../../store/selectors/nav.selectors';
import { Store } from '@ngrx/store';
import { getZoneConfig } from '../../../../store/selectors/site.selectors';
import { sendMessage } from '../../../../store/actions/toaster.actions';
import {
    InverterDeviceModel,
    InverterCommandLogModel,
    InverterRealtimeModel,
} from '../../../../shared/models/inverter.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';

type SessionState = 'login' | 'connecting' | 'ready';
type ConfirmType = 'shutdown' | null;
type RunState = 'running' | 'fault' | 'standby' | 'offline';

@Component({
    selector: 'app-control',
    standalone: false,
    templateUrl: './control.html',
    styleUrl: './control.scss',
})
export class Control implements OnInit, OnDestroy {
    navState$: Observable<NavbarStateModel>;
    siteList = signal<SiteModel[]>([]);
    siteSelected = signal<string>('');
    navSub?: Subscription;

    private http = inject(HttpService);
    private store = inject(Store);
    private readonly dialogs = inject(MatDialog);

    // ─── Session ──────────────────────────────────────────────────────────────
    sessionState = signal<SessionState>('login');
    sessionId = signal<string | null>(null);
    sessionExpiry = signal<string | null>(null);

    // ─── Login form (plain props for ngModel) ─────────────────────────────────
    loginUsername = '';
    loginSystemCode = '';
    loginStationCode = '';
    loginError = signal<string>('');

    // ─── Devices ──────────────────────────────────────────────────────────────
    devices = signal<InverterDeviceModel[]>([]);
    selectedDevice = signal<InverterDeviceModel | null>(null);
    deviceStatus = signal<InverterRealtimeModel | null>(null);
    deviceStatusMap = signal<Record<string, InverterRealtimeModel>>({});
    loadingDevices = signal(false);
    loadingStatus = signal(false);

    runningCount = computed(() =>
        Object.values(this.deviceStatusMap()).filter(s => {
            const rs = s.dataItemMap?.['run_state'];
            return rs === 512 || rs === 1024;
        }).length
    );

    // ─── Control ──────────────────────────────────────────────────────────────
    powerLimitPct = signal<number>(100);
    zeroExportMode = signal<'enable' | 'disable'>('disable');
    confirmDialog = signal<ConfirmType>(null);
    loadingCommand = signal(false);

    // ─── Command logs ─────────────────────────────────────────────────────────
    commandLogs = signal<InverterCommandLogModel[]>([]);
    loadingLogs = signal(false);

    constructor() {
        this.navState$ = this.store.select(getNavState);
        this.navSub = this.navState$.subscribe(async (state) => {
            this.siteSelected.set(state.location);
            const res = await firstValueFrom(this.store.select(getZoneConfig(state.location)));
            if (res?.siteList) this.siteList.set(res.siteList);
        });
    }

    ngOnInit(): void {}

    ngOnDestroy(): void {
        this.navSub?.unsubscribe();
    }

    // ─── Login / Logout ───────────────────────────────────────────────────────

    async onLogin() {
        if (!this.loginUsername || !this.loginSystemCode || !this.loginStationCode) {
            this.loginError.set('Please fill in all fields');
            return;
        }
        this.sessionState.set('connecting');
        this.loginError.set('');
        try {
            const res = await this.http.createInverterSession({
                username: this.loginUsername,
                systemCode: this.loginSystemCode,
            });
            if (res.status !== 'success' || !res.data?.sessionId) {
                this.loginError.set(res.message || 'Login failed');
                this.sessionState.set('login');
                return;
            }
            this.sessionId.set(res.data.sessionId);
            this.sessionExpiry.set(res.data.expiresAt);
            await this.loadDevices();
            await this.loadCommandLogs();
            this.sessionState.set('ready');
        } catch (err: any) {
            this.loginError.set(err?.message || 'An error occurred. Please try again.');
            this.sessionState.set('login');
        }
    }

    async onLogout() {
        const sid = this.sessionId();
        if (sid) {
            try { await this.http.destroyInverterSession({ sessionId: sid }); } catch {}
        }
        this.sessionId.set(null);
        this.sessionExpiry.set(null);
        this.devices.set([]);
        this.selectedDevice.set(null);
        this.deviceStatus.set(null);
        this.deviceStatusMap.set({});
        this.commandLogs.set([]);
        this.loginUsername = '';
        this.loginSystemCode = '';
        this.sessionState.set('login');
    }

    // ─── Load data ────────────────────────────────────────────────────────────

    async loadDevices() {
        this.loadingDevices.set(true);
        try {
            const res = await this.http.getInverterDevices({
                stationCode: this.loginStationCode,
                sessionId: this.sessionId() ?? undefined,
            });
            if (res.status === 'success' && res.data) {
                this.devices.set(res.data);
                if (res.data.length > 0) {
                    await this.loadAllStatuses(res.data);
                    await this.selectDevice(res.data[0]);
                }
            } else {
                this.toast('warn', res.message || 'No devices found');
            }
        } catch (err: any) {
            this.toast('error', err?.message || 'Failed to load devices');
        } finally {
            this.loadingDevices.set(false);
        }
    }

    async loadAllStatuses(devList: InverterDeviceModel[]) {
        const ids = devList.map(d => d.devDn || d.esnCode).filter(Boolean).join(',');
        if (!ids) return;
        try {
            const res = await this.http.getInverterStatus({
                devIds: ids,
                sessionId: this.sessionId() ?? undefined,
            });
            if (res.status === 'success' && res.data) {
                const map: Record<string, InverterRealtimeModel> = {};
                res.data.forEach(s => {
                    if (s.devId) map[s.devId] = s;
                });
                this.deviceStatusMap.set(map);
            }
        } catch {}
    }

    async selectDevice(device: InverterDeviceModel) {
        if (this.selectedDevice()?.devName === device.devName) {
            this.selectedDevice.set(null);
            this.deviceStatus.set(null);
            await this.refreshDeviceStatus();
            return; // already selected
        };
        this.selectedDevice.set(device);
        const devId = device.devDn || device.esnCode || '';
        const existing = this.deviceStatusMap()[devId];
        if (existing) {
            this.deviceStatus.set(existing);
        } else {
            this.deviceStatus.set(null);
            await this.refreshDeviceStatus();
        }
    }

    async refreshDeviceStatus() {
        const device = this.selectedDevice();
        if (!device) return;
        const devId = device.devDn || device.esnCode;
        if (!devId) return;
        this.loadingStatus.set(true);
        try {
            const res = await this.http.getInverterStatus({
                devIds: devId,
                sessionId: this.sessionId() ?? undefined,
            });
            if (res.status === 'success' && res.data?.[0]) {
                this.deviceStatus.set(res.data[0]);
                this.deviceStatusMap.update(m => ({ ...m, [devId]: res.data![0] }));
            }
        } catch (err: any) {
            this.toast('warn', 'Failed to load device status');
        } finally {
            this.loadingStatus.set(false);
        }
    }

    async loadCommandLogs() {
        this.loadingLogs.set(true);
        try {
            const res = await this.http.getInverterCommandLogs({
                siteId: this.siteSelected(),
                limit: 50,
            });
            if (res.status === 'success' && res.data) {
                this.commandLogs.set(res.data);
            }
        } catch {}
        finally {
            this.loadingLogs.set(false);
        }
    }

    // ─── Commands ─────────────────────────────────────────────────────────────

    //openConfirmShutdown() { this.confirmDialog.set('shutdown'); }
    closeConfirmDialog() { this.confirmDialog.set(null); }

    async openConfirmShutdown() {
        const dialogData: ConfirmDialogData = {
            title:  'Confirm Shutdown',
            message: `You are about to shutdown ${this.selectedDevice()?.devName || this.selectedDevice()?.devDn } \nThe inverter will stop generating power immediately and must be restarted via FusionSolar before it can resume operation.`,
            subMessage:  'This action cannot be undone.',
            confirmText: 'Shutdown',
            cancelText:  'Cancel',
            type: 'danger',
        };
        
        const ref = this.dialogs.open(ConfirmDialog, {
            width: '480px',
            data: dialogData,
            panelClass: 'confirm-dialog-panel'
        });
        
        ref.afterClosed().subscribe(async result => {
            if (result === true) {
                await this.sendCommand('SHUTDOWN');
            }
        });
    }

    async applyPowerLimit() {
        await this.sendCommand('POWER_LIMIT', { percent: this.powerLimitPct() });
    }

    async applyZeroExport() {
        if (this.zeroExportMode() === 'enable') {
            await this.sendCommand('ZERO_EXPORT');
        } else {
            await this.sendCommand('START');
        }
    }

    private async sendCommand(
        command: 'SHUTDOWN' | 'START' | 'POWER_LIMIT' | 'ZERO_EXPORT',
        params?: { percent?: number }
    ) {
        const device = this.selectedDevice();
        if (!device) { this.toast('warn', 'Please select an inverter first'); return; }
        const deviceSn = device.esnCode || device.devDn;
        if (!deviceSn) { this.toast('error', 'Device serial number not found'); return; }

        this.loadingCommand.set(true);
        try {
            const res = await this.http.sendInverterCommand({
                siteId: this.siteSelected(),
                deviceSn,
                command,
                params,
                sessionId: this.sessionId() ?? undefined,
            });
            if (res.status === 'success') {
                this.toast('success', `${command.replace(/_/g, ' ')} completed successfully`);
                await this.loadCommandLogs();
                await this.refreshDeviceStatus();
            } else {
                this.toast('error', res.message || `${command} failed`);
                await this.loadCommandLogs();
            }
        } catch (err: any) {
            this.toast('error', err?.message || 'An error occurred');
        } finally {
            this.loadingCommand.set(false);
        }
    }

    // ─── Status helpers ───────────────────────────────────────────────────────

    getRunState(device: InverterDeviceModel): RunState {
        const devId = device.devDn || device.esnCode || '';
        const status = this.deviceStatusMap()[devId];
        return this.resolveRunState(status?.dataItemMap?.['run_state']);
    }

    getStatusRunState(): RunState {
        return this.resolveRunState(this.deviceStatus()?.dataItemMap?.['run_state']);
    }

    private resolveRunState(state: number | undefined): RunState {
        if (state === 512 || state === 1024) return 'running';
        if (state === 40960 || state === 768) return 'fault';
        if (state === 256) return 'standby';
        if (state === undefined || state === null) return 'offline';
        return 'offline';
    }

    getActivePower(): number { return this.deviceStatus()?.dataItemMap?.active_power ?? 0; }
    getReactivePower(): number { return this.deviceStatus()?.dataItemMap?.reactive_power ?? 0; }
    getEfficiency(): number { return this.deviceStatus()?.dataItemMap?.efficiency ?? 0; }
    getFrequency(): number { return this.deviceStatus()?.dataItemMap?.elec_freq ?? 0; }
    getTemperature(): number { return this.deviceStatus()?.dataItemMap?.temperature ?? 0; }

    onPowerLimitSlide(event: Event) {
        const val = Number((event.target as HTMLInputElement).value);
        this.powerLimitPct.set(val);
    }

    onPowerLimitInput(event: Event) {
        const raw = Number((event.target as HTMLInputElement).value);
        const clamped = Math.min(100, Math.max(0, raw));
        this.powerLimitPct.set(clamped);
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString('en-GB', {
                timeZone: 'Asia/Bangkok',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
            });
        } catch { return dateStr; }
    }

    private toast(type: 'success' | 'info' | 'warn' | 'error', text: string) {
        this.store.dispatch(sendMessage({ payload: { text, type } }));
    }
}
