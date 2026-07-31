import { Component, OnInit, input, output, signal, inject } from '@angular/core';
import { UserDataModel } from '../../../../../../shared/models/user.model';
import { PageDataModel } from '../../../../../../shared/models/page.model';
import { SiteModel, SiteStateModel } from '../../../../../../shared/models/config.model';
import { Store } from '@ngrx/store';
import { HttpService } from '../../../../../../shared/services/http.service';

@Component({
  selector: 'app-user-viewer-dialog',
  standalone: false,
  templateUrl: './user-viewer-dialog.html',
  styleUrl: './user-viewer-dialog.scss'
})
export class UserViewerDialog implements OnInit {

  userData = input<UserDataModel>(this.getEmptyUser());
  pageList = input<PageDataModel[]>([]);
  onClose = output();

  siteList = signal<SiteModel[]>([]);

  private store = inject(Store);
  private service = inject(HttpService);

  ngOnInit(): void {
    this.getSiteConfig();
  }

  getEmptyUser(): UserDataModel {
    return {
      _id: '',
      username: '',
      password: '',
      Group: 'user',
      pageAccess: [],
      siteAccess: [],
      fullname: '',
      company: '',
      department: '',
      role: '',
      signature: ''
    };
  }

  closeUserModal(): void {
    this.onClose.emit();
  }

  async getSiteConfig() {
    this.siteList.set(await this.service.getMasterSiteList());
  }

  getSelectedPages(): string[] {
    const selectedPaths = this.userData().pageAccess;
    const allPages = this.pageList().flatMap(p => p.page);
    return allPages.filter(p => selectedPaths.includes(p.path)).map(p => p.name);
  }

  getSelectedSites(): string[] {
    const selectedIds = this.userData().siteAccess;
    return this.siteList().filter(s => selectedIds.includes(s.id)).map(s => s.name);
  }
}
