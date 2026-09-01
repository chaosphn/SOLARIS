import { AfterViewInit, Component, computed, effect, input, inject, OnDestroy, signal } from '@angular/core';
import * as L from 'leaflet';
import { DataRealtimeModel } from '../../models/response.model';
import { SiteModel } from '../../models/config.model';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { EventSummaryModel } from '../../../features/sites/models/event.model';
import { getEventSummary } from '../../../store/selectors/event.selectors';

@Component({
  selector: 'app-map-container',
  templateUrl: './map-container.html',
  styleUrls: ['./map-container.scss'],
  standalone: false
})
export class MapContainer implements AfterViewInit, OnDestroy {

  private map!: L.Map;
  private markerLayer = L.layerGroup();
  private eventSummary$: Observable<EventSummaryModel[]>;
  private eventSub?: Subscription;
  private eventSummaryData: EventSummaryModel[] = [];

  /** เก็บ marker ต่อไซต์ไว้ เพื่อสั่งเปิด popup จากปุ่ม prev/next ได้ */
  private markerBySite = new Map<string, L.Marker>();
  /** ระดับ zoom ตอนกดเลื่อนไปทีละไซต์ — ใกล้พอให้เห็นรายละเอียดรอบโรงไฟฟ้า */
  private readonly FOCUS_ZOOM = 11;

  dataRealtime = input<DataRealtimeModel>();
  siteList = input<SiteModel[]>([]);

  /** เฉพาะไซต์ที่มีพิกัด — ไซต์ไม่มีพิกัดวางบนแผนที่ไม่ได้ */
  mappedSites = computed<SiteModel[]>(() => (this.siteList() || []).filter(s => !!s.position));
  /** ไซต์ที่กำลังโฟกัสอยู่ (-1 = ยังไม่เลือก) */
  focusIndex = signal<number>(-1);
  focusedSite = computed<SiteModel | null>(() => {
    const sites = this.mappedSites();
    const i = this.focusIndex();
    return i >= 0 && i < sites.length ? sites[i] : null;
  });
  siteStatus = signal<any>({
    normal: 0,
    warn: 0,
    alarm: 0,
    offline: 0
  });

  private store = inject(Store);

  constructor() {
    this.eventSummary$ = this.store.select(getEventSummary);
    this.eventSub = this.eventSummary$.subscribe(data => {
      this.eventSummaryData = data;
    });

    effect(() => {
      this.siteStatus.set({
        normal: 0,
        warn: 0,
        alarm: 0,
        offline: 0
      });
      const sites = this.siteList();

      // 🔒 กัน crash
      if (!this.map || !sites || sites.length === 0) return;

      this.markerLayer.clearLayers();
      this.markerBySite.clear();

      for (const site of sites) {
        if (!site.position) continue;
        const realtime = this.dataRealtime()?.[site.id+'_POWER']?.Value;
        const energy = this.dataRealtime()?.[site.id+'_ENERGY']?.Value;
        const pr = this.dataRealtime()?.[site.id+'_PR']?.Value;

        // Get event data for this site
        const eventData = this.eventSummaryData.find(e => e.PointSource === site.id);

        // Determine status based on realtime data and events
        let status: string;
        if (eventData && eventData.Major > 0) {
          status = 'critical';
          this.siteStatus.update(val => {
            return {
              ...val,
              alarm: val.alarm + 1
            }
          });
        } else if (eventData && eventData.Minor > 0) {
          status = 'warning';
          this.siteStatus.update(val => {
            return {
              ...val,
              alarm: val.alarm + 1
            }
          });
        } else if (eventData && eventData.Warning > 0) {
          status = 'warning';
          this.siteStatus.update(val => {
            return {
              ...val,
              warn: val.warn + 1
            }
          });
        } else {
          status = realtime > 0 ? 'normal' : realtime === 0 ? 'offline' : 'nodata';
          if(realtime > 0){
            this.siteStatus.update(val => {
              return {
                ...val,
                normal: val.normal + 1
              }
            });
          } else {
            this.siteStatus.update(val => {
              return {
                ...val,
                offline: val.offline + 1
              }
            });
          }
        }

        const marker = L.marker(
          [site.position.lat, site.position.lng],
          {
            icon: this.createSolarIcon(this.getColorByStatus(status)),
            title: site.name
          }
        );

        marker.bindPopup(`
          <div style="
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-width: 300px;
          ">
            <div style="
              font-weight: 700;
              font-size: 18px;
              color: var(--primary-txt);
              margin-bottom: 8px;
              border-bottom: 2px solid ${this.getColorByStatus(status)};
              padding-bottom: 8px;
            ">${site.name}</div>
            
            <div style="
              font-size: 14px;
              color: var(--secondary-txt);
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <i class="material-icons" style="
                  font-size: 18px;
                  color: var(--secondary-txt);
              ">pin_drop</i>
              <div>${site.location}</div>
            </div>
            
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            ">
              <div style="
                background: var(--primary-bg);
                padding: 8px;
                border-radius: 6px;
                font-size: 12px;
                color: var(--secondary-txt);
                border: 1px solid var(--border-color);
              ">
                <div style="color: var(--secondary-txt); font-size: 11px; margin-bottom: 2px; display: flex;
                  align-items: center;
                  gap: 4px;">
                  <i class="material-icons" style="
                    font-size: 18px;
                    color: var(--secondary-txt);
                  ">bolt</i>
                  <div>Capacity</div>
                </div>
                <div style="font-weight: 600; font-size: 15px; color: var(--primary-txt);">${site.capacity} MW</div>
              </div>
              <div style="
                background: var(--primary-bg);
                padding: 8px;
                border-radius: 6px;
                font-size: 12px;
                color: var(--secondary-txt);
                border: 1px solid var(--border-color);
              ">
                <div style="color: var(--secondary-txt); font-size: 11px; margin-bottom: 2px; display: flex;
                  align-items: center;
                  gap: 4px;">
                  <i class="material-icons" style="
                    font-size: 18px;
                    color: var(--secondary-txt);
                  ">settings</i>
                  <div>Status</div>
                </div>
                <div style="
                  font-weight: 700;
                  color: ${this.getColorByStatus(status)};
                  text-transform: uppercase;
                  font-size: 15px;
                ">${status}</div>
              </div>
            </div>
            
            <div style="
              background: var(--primary-bg);
              padding: 10px;
              border-radius: 6px;
              border-left: 3px solid ${this.getColorByStatus(status)};
              border: 1px solid var(--border-color);
              border-left: 3px solid ${this.getColorByStatus(status)};
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid var(--border-color);
                font-size: 14px;
              ">
                <span style="color: var(--secondary-txt);">Power</span>
                <span style="font-weight: 600; color: var(--primary-txt);">
                  ${realtime?.toFixed(2) ?? 'N/A'} ${realtime !== undefined ? 'kW' : ''}
                </span>
              </div>
              <div style="
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                border-bottom: 1px solid var(--border-color);
                font-size: 14px;
              ">
                <span style="color: var(--secondary-txt);">Energy</span>
                <span style="font-weight: 600; color: var(--primary-txt);">
                  ${energy?.toFixed(2) ?? 'N/A'} ${energy !== undefined ? 'kWh' : ''}
                </span>
              </div>
              <div style="
                display: flex;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 14px;
              ">
                <span style="color: var(--secondary-txt);">PR</span>
                <span style="font-weight: 600; color: var(--primary-txt);">
                  ${pr?.toFixed(2) ?? 'N/A'} ${pr !== undefined ? '%' : ''}
                </span>
              </div>
            </div>
          </div>
        `);

        this.markerBySite.set(site.id, marker);
        this.markerLayer.addLayer(marker);
      }

      this.markerLayer.addTo(this.map);

      // marker ถูกสร้างใหม่ทุกครั้งที่ข้อมูลอัปเดต — เปิด popup ของไซต์ที่โฟกัสอยู่กลับมา
      // ไม่งั้นรอบ auto-refresh จะปิด popup ที่ผู้ใช้เปิดค้างไว้
      const focused = this.focusedSite();
      if (focused) {
        this.markerBySite.get(focused.id)?.openPopup();
      }
    });
  }

  /** เลื่อนไปไซต์ก่อนหน้า (วนกลับไปตัวสุดท้ายเมื่อถึงตัวแรก) */
  prevSite(): void {
    const total = this.mappedSites().length;
    if (total === 0) return;
    const current = this.focusIndex();
    this.focusSite(current <= 0 ? total - 1 : current - 1);
  }

  /** เลื่อนไปไซต์ถัดไป (วนกลับไปตัวแรกเมื่อถึงตัวสุดท้าย) */
  nextSite(): void {
    const total = this.mappedSites().length;
    if (total === 0) return;
    this.focusSite((this.focusIndex() + 1) % total);
  }

  /** ซูมไปที่ไซต์ตามลำดับที่ระบุ พร้อมเปิดข้อมูลของไซต์นั้น */
  private focusSite(index: number): void {
    const site = this.mappedSites()[index];
    if (!site || !site.position || !this.map) return;

    this.focusIndex.set(index);
    this.map.flyTo([site.position.lat, site.position.lng], this.FOCUS_ZOOM, { duration: 0.6 });
    // รอ animation จบก่อนเปิด popup ไม่งั้น popup จะถูกวางผิดตำแหน่ง
    setTimeout(() => this.markerBySite.get(site.id)?.openPopup(), 650);
  }

  /** กลับไปมุมมองรวมทั้งประเทศ */
  resetFocus(): void {
    this.focusIndex.set(-1);
    this.map?.closePopup();
    this.map?.flyTo([13.7563, 100.5018], 6, { duration: 0.6 });
  }

  ngAfterViewInit(): void {

    const thailandBounds = L.latLngBounds(
      [5.5, 97.3],
      [20.5, 105.7]
    );

    this.map = L.map('map', {
      center: [13.7563, 100.5018],
      zoom: 6,
      minZoom: 5,
      // maxBounds: thailandBounds,
      maxBoundsViscosity: 1.0,
      attributionControl: false,
    });

    // ใช้แผนที่โทนสว่างชุดเดียวทั้งสองธีมของแอป
    // แผนที่โทนมืดอ่านตำแหน่งโรงไฟฟ้ายากกว่า และหมุดสีสถานะเด่นกว่าบนพื้นสว่างอยู่แล้ว
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(this.map);

    this.markerLayer.addTo(this.map);

    const defaultCenter: [number, number] = [13.7563, 100.5018];
    const defaultZoom = 6;

    const resetControl = new L.Control({ position: 'topleft' });

    resetControl.onAdd = () => {
      const btn = L.DomUtil.create('button', 'reset-map-btn');
      btn.innerHTML = '⟳';

      btn.onclick = () => {
        this.map.setView(defaultCenter, defaultZoom);
      };

      return btn;
    };

    resetControl.addTo(this.map);

    // 🔥 test marker (กันพลาด)
    // L.marker([13.7563, 100.5018], { icon: this.createIcon() })
    //   .addTo(this.map)
    //   .bindPopup('Bangkok')
    //   .openPopup();
  }

  ngOnDestroy(): void {
    this.eventSub?.unsubscribe();
  }

  // ✅ icon ที่ขึ้นแน่นอน
  // private createIcon(): L.Icon {
  //   return L.icon({
  //     iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  //     iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  //     shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  //     iconSize: [25, 41],
  //     iconAnchor: [12, 41],
  //     popupAnchor: [0, -30]
  //   });
  // }
  // private createIcon(): L.DivIcon {
  //   return L.divIcon({
  //     className: '', // 🔥 ไม่ใช้ class default
  //     html: `
  //       <div style="
  //         width:14px;
  //         height:14px;
  //         background:#FBE134;
  //         border-radius:50%;
  //         box-shadow:0 0 10px #FBE134;
  //       ">
          
  //       </div>
  //     `,
  //     iconSize: [20, 20],
  //     iconAnchor: [10, 10]
  //   });
  // }

  private createSolarIcon(color: string = '#ff3b3b'): L.DivIcon {
    return L.divIcon({
      className: '',
      html: `
        <div style="width:40px;height:40px;">
          <svg viewBox="0 0 48 48" width="40" height="40">
            
            <!-- pin shape -->
            <path 
              d="M24 2C14 2 7 9 7 19c0 12 17 27 17 27s17-15 17-27c0-10-7-17-17-17z"
              fill="${color}"
            />

            <!-- inner circle -->
            <circle cx="24" cy="19" r="14" fill="#ffffff">
            </circle>

            <!-- solar panel icon -->
            <g transform="translate(16,9)">
              <rect x="0" y="4" width="16" height="10" fill="${color}" rx="1"/>
              
              <!-- grid lines -->
              <line x1="4" y1="4" x2="4" y2="14" stroke="#ffffff" stroke-width="0.5"/>
              <line x1="8" y1="4" x2="8" y2="14" stroke="#ffffff" stroke-width="0.5"/>
              <line x1="12" y1="4" x2="12" y2="14" stroke="#ffffff" stroke-width="0.5"/>

              <line x1="0" y1="7" x2="16" y2="7" stroke="#ffffff" stroke-width="0.5"/>
              <line x1="0" y1="10" x2="16" y2="10" stroke="#ffffff" stroke-width="0.5"/>

              <!-- stand -->
              <line x1="8" y1="14" x2="8" y2="18" stroke="${color}" stroke-width="1"/>
              <line x1="4" y1="18" x2="12" y2="18" stroke="${color}" stroke-width="1"/>
            </g>

          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });
  }

  private getColorByStatus(status: string): string {
    switch (status) {
      case 'critical': return '#E0463C';   // 🔴 alarm
      case 'warning': return '#E3A92B';    // 🟡 warning
      case 'normal': return '#34C08A';     // 🟢 normal
      default: return '#667079';           // ⚪ offline
    }
  }
}
