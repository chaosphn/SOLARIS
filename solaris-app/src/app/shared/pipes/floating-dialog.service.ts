import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Assistant } from '../../core/components/assistant/assistant';

@Injectable({ providedIn: 'root' })
export class FloatingDialogService {
  private overlayRef?: OverlayRef;

  constructor(private overlay: Overlay, private injector: Injector) {}

  open() {
    if (this.overlayRef) return;

    this.overlayRef = this.overlay.create({
      hasBackdrop: false, // ไม่ให้มี backdrop
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically()
    });

    const portal = new ComponentPortal(Assistant, null, this.injector);
    this.overlayRef.attach(portal);
  }

  close() {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }
}
