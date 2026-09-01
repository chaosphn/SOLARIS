import { Component, ContentChild, HostListener, Input, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-card-container',
  standalone: false,
  templateUrl: './card-container.html',
  styleUrl: './card-container.scss'
})
export class CardContainer implements OnInit, OnChanges {

  @Input() enable?: boolean;
  @Input() title?: string;
  @Input() expandable?: boolean = false;
  @ContentChild('container') containerTmp!: TemplateRef<any>;

  check: boolean | undefined = false;
  expanded = false;
  constructor(){}

  ngOnChanges(changes: SimpleChanges): void {

  }

  ngOnInit(): void {

  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
    // การ์ดเปลี่ยนขนาด (fixed 90vw <-> grid cell) — บอก Highcharts ให้ reflow
    // เผื่อกรณี ResizeObserver ใน app-highchart จับไม่ทัน (เช่นตอนย่อกลับ)
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.expanded) {
      this.expanded = false;
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    }
  }

}
